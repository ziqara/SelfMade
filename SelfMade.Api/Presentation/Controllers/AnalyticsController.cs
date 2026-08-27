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
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        IAiService aiService,
        IGoalPlanRepository planRepository,
        IUserInterestRepository interestRepository,
        ILogger<AnalyticsController> logger)
    {
        _aiService = aiService;
        _planRepository = planRepository;
        _interestRepository = interestRepository;
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
