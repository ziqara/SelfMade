using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

[Authorize] // <-- Замок!
[Route("api/[controller]")]
[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IAiService _aiService;

    public AnalyticsController(IAiService aiService)
    {
        _aiService = aiService;
    }

    // Раньше было [HttpGet("daily/{userId}")], теперь просто:
    [HttpGet("daily")]
    public async Task<ActionResult> GetDailyInsight()
    {
        // ИИ сам узнает, для кого генерировать совет, заглянув в токен
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var insight = await _aiService.GetDailyInsightAsync(userId);
        return Ok(new { insight });
    }
}