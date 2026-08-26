using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Exceptions;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

// План от ИИ для конкретной цели развития (UserInterest): api/userinterests/{goalId}/plan
[Authorize]
[Route("api/userinterests/{goalId:int}/plan")]
[ApiController]
public class GoalPlansController : ControllerBase
{
    private readonly IUserInterestRepository _interestRepository;
    private readonly IGoalPlanRepository _planRepository;
    private readonly IActivityRepository _activityRepository;
    private readonly IAiService _aiService;
    private readonly ILogger<GoalPlansController> _logger;

    public GoalPlansController(
        IUserInterestRepository interestRepository,
        IGoalPlanRepository planRepository,
        IActivityRepository activityRepository,
        IAiService aiService,
        ILogger<GoalPlansController> logger)
    {
        _interestRepository = interestRepository;
        _planRepository = planRepository;
        _activityRepository = activityRepository;
        _aiService = aiService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<GoalPlanStepDto>>> GetPlan(int goalId)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var goal = await _interestRepository.GetByIdAsync(goalId);
        if (goal == null || goal.UserId != userId) return NotFound(new { message = "Цель не найдена." });

        var steps = await _planRepository.GetByGoalIdAsync(goalId);
        return Ok(steps.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<IEnumerable<GoalPlanStepDto>>> GeneratePlan(int goalId)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var goal = await _interestRepository.GetByIdAsync(goalId);
        if (goal == null || goal.UserId != userId) return NotFound(new { message = "Цель не найдена." });

        try
        {
            var draftSteps = await _aiService.GenerateGoalPlanAsync(userId.Value, goal);

            await _planRepository.RemoveAllForGoalAsync(goalId);
            var entities = draftSteps.Select(s => new AiRecommendation
            {
                UserId = userId.Value,
                GoalId = goalId,
                Title = s.Title,
                Description = s.Description,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _planRepository.AddRangeAsync(entities);
            await _planRepository.SaveChangesAsync();

            return Ok(entities.Select(ToDto));
        }
        catch (AiServiceException ex)
        {
            _logger.LogWarning(ex, "Goal plan generation failed for user {UserId}, goal {GoalId}", userId, goalId);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    [HttpPost("{stepId:int}/toggle")]
    public async Task<ActionResult<GoalPlanStepDto>> ToggleStep(int goalId, int stepId)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var goal = await _interestRepository.GetByIdAsync(goalId);
        if (goal == null || goal.UserId != userId) return NotFound(new { message = "Цель не найдена." });

        var step = await _planRepository.GetByIdAsync(stepId);
        if (step == null || step.GoalId != goalId || step.UserId != userId)
        {
            return NotFound(new { message = "Шаг плана не найден." });
        }

        if (step.Status == "completed")
        {
            step.Status = "pending";
            step.CompletedAt = null;
        }
        else
        {
            step.Status = "completed";
            step.CompletedAt = DateTime.UtcNow;
        }

        await _planRepository.SaveChangesAsync();
        return Ok(ToDto(step));
    }

    // Единое действие "выполнил шаг плана": отмечает шаг выполненным И сразу
    // логирует активность с этим же названием — чтобы не заполнять две формы за одно и то же дело.
    [HttpPost("{stepId:int}/complete")]
    public async Task<ActionResult<CompleteStepResponseDto>> CompleteStep(int goalId, int stepId, [FromBody] CompleteStepRequest request)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var goal = await _interestRepository.GetByIdAsync(goalId);
        if (goal == null || goal.UserId != userId) return NotFound(new { message = "Цель не найдена." });

        var step = await _planRepository.GetByIdAsync(stepId);
        if (step == null || step.GoalId != goalId || step.UserId != userId)
        {
            return NotFound(new { message = "Шаг плана не найден." });
        }

        step.Status = "completed";
        step.CompletedAt = DateTime.UtcNow;
        await _planRepository.SaveChangesAsync();

        var activity = new ActivityLog
        {
            UserId = userId.Value,
            CategoryId = goal.CategoryId,
            Title = step.Title,
            Description = step.Description,
            DurationMinutes = request.DurationMinutes,
            CreatedAt = DateTime.UtcNow
        };
        await _activityRepository.AddActivityAsync(activity);
        await _activityRepository.SaveChangesAsync();

        return Ok(new CompleteStepResponseDto
        {
            Step = ToDto(step),
            ActivityId = activity.Id
        });
    }

    private int? CurrentUserId()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdString, out int userId) ? userId : null;
    }

    private static GoalPlanStepDto ToDto(AiRecommendation r) => new()
    {
        Id = r.Id,
        Title = r.Title,
        Description = r.Description,
        Status = r.Status,
        CompletedAt = r.CompletedAt
    };
}

public class GoalPlanStepDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
}

public class CompleteStepRequest
{
    [Range(1, 1440, ErrorMessage = "Длительность должна быть от 1 до 1440 минут.")]
    public int DurationMinutes { get; set; }
}

public class CompleteStepResponseDto
{
    public GoalPlanStepDto Step { get; set; } = new();
    public int ActivityId { get; set; }
}
