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
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAiService aiService, ILogger<AnalyticsController> logger)
    {
        _aiService = aiService;
        _logger = logger;
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
