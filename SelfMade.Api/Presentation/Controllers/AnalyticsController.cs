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

    // Ближайший невыполненный шаг из плана ИИ по любой из целей развития пользователя —
    // именно его дашборд показывает как одну актуальную карточку "что делать дальше".
    [HttpGet("next-step")]
    public async Task<ActionResult<NextStepDto?>> GetNextStep()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var step = await _planRepository.GetNextPendingForUserAsync(userId);
        if (step == null) return Ok(null);

        var goal = await _interestRepository.GetByIdAsync(step.GoalId);

        return Ok(new NextStepDto
        {
            GoalId = step.GoalId,
            StepId = step.Id,
            GoalTitle = goal?.Title ?? string.Empty,
            Title = step.Title,
            Description = step.Description
        });
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

public class NextStepDto
{
    public int GoalId { get; set; }
    public int StepId { get; set; }
    public string GoalTitle { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
