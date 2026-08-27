using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Exceptions;
using SelfMade.Api.Application.Interfaces;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

[Authorize] // <-- Замок!
[Route("api/[controller]")]
[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly IGoalPlanRepository _planRepository;
    private readonly IUserInterestRepository _interestRepository;
    private readonly IActivityRepository _activityRepository;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAiService aiService,
        IGoalPlanRepository planRepository,
        IUserInterestRepository interestRepository,
        IActivityRepository activityRepository,
        ILogger<AnalyticsController> logger)
    {
        _aiService = aiService;
        _planRepository = planRepository;
        _interestRepository = interestRepository;
        _activityRepository = activityRepository;
        _logger = logger;
    }

    // Все невыполненные шаги плана ИИ по всем целям развития пользователя —
    // дашборд показывает их единым чек-листом внутри сессии "Начать развиваться".
    [HttpGet("pending-steps")]
    public async Task<ActionResult<IEnumerable<PendingStepDto>>> GetPendingSteps()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var steps = await _planRepository.GetAllPendingForUserAsync(userId);
        if (steps.Count == 0) return Ok(Array.Empty<PendingStepDto>());

        var goals = await _interestRepository.GetInterestsByUserIdAsync(userId);
        var goalTitles = goals.ToDictionary(g => g.Id, g => g.Title);

        var goalCategoryIds = goals.ToDictionary(g => g.Id, g => g.CategoryId);

        var response = steps.Select(s => new PendingStepDto
        {
            GoalId = s.GoalId,
            StepId = s.Id,
            GoalTitle = goalTitles.GetValueOrDefault(s.GoalId, string.Empty),
            CategoryId = goalCategoryIds.GetValueOrDefault(s.GoalId),
            Title = s.Title,
            Description = s.Description
        });

        return Ok(response);
    }

    // Отдает уже сгенерированный сегодня совет (если есть), без обращения к Gemini.
    // Используется при загрузке дашборда, чтобы не терять совет при обновлении страницы.
    [HttpGet("daily")]
    public async Task<ActionResult> GetCachedDailyInsight()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var insight = await _aiService.GetCachedInsightAsync(userId);
        return Ok(new { insight });
    }

    // Генерирует новый совет через Gemini и сохраняет его.
    [HttpPost("daily")]
    public async Task<ActionResult> GenerateDailyInsight()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        try
        {
            var insight = await _aiService.GenerateDailyInsightAsync(userId);
            return Ok(new { insight });
        }
        catch (AiServiceException ex)
        {
            _logger.LogWarning(ex, "AI insight generation failed for user {UserId}", userId);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
    }

    // Сводка для вкладки "История": прогресс по каждой цели (сколько шагов плана выполнено)
    // и лента достижений (уже выполненные шаги) — общая картина того, чему пользователь научился.
    [HttpGet("summary")]
    public async Task<ActionResult<UserSummaryDto>> GetSummary()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var allSteps = await _planRepository.GetAllForUserAsync(userId);
        var goals = await _interestRepository.GetInterestsByUserIdAsync(userId);
        var goalTitles = goals.ToDictionary(g => g.Id, g => g.Title);

        var goalsProgress = allSteps
            .GroupBy(s => s.GoalId)
            .Select(g => new GoalProgressDto
            {
                GoalId = g.Key,
                GoalTitle = goalTitles.GetValueOrDefault(g.Key, "Цель"),
                TotalSteps = g.Count(),
                CompletedSteps = g.Count(s => s.Status == "completed")
            })
            .OrderByDescending(g => g.TotalSteps == 0 ? 0 : (double)g.CompletedSteps / g.TotalSteps)
            .ToList();

        var achievements = allSteps
            .Where(s => s.Status == "completed")
            .OrderByDescending(s => s.CompletedAt)
            .Select(s => new AchievementDto
            {
                GoalTitle = goalTitles.GetValueOrDefault(s.GoalId, "Цель"),
                Title = s.Title,
                CompletedAt = s.CompletedAt
            })
            .ToList();

        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        var activitiesList = activities.ToList();

        return Ok(new UserSummaryDto
        {
            GoalsProgress = goalsProgress,
            Achievements = achievements,
            TotalActivities = activitiesList.Count,
            TotalMinutes = activitiesList.Sum(a => a.DurationMinutes)
        });
    }
}

public class PendingStepDto
{
    public int GoalId { get; set; }
    public int StepId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class GoalProgressDto
{
    public int GoalId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public int TotalSteps { get; set; }
    public int CompletedSteps { get; set; }
}

public class AchievementDto
{
    public string GoalTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
}

public class UserSummaryDto
{
    public List<GoalProgressDto> GoalsProgress { get; set; } = new();
    public List<AchievementDto> Achievements { get; set; } = new();
    public int TotalActivities { get; set; }
    public int TotalMinutes { get; set; }
}
