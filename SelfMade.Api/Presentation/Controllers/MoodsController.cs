using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

[Authorize] // <-- Замок!
[Route("api/[controller]")]
[ApiController]
public class MoodsController : ControllerBase
{
    private readonly IMoodRepository _moodRepository;

    public MoodsController(IMoodRepository moodRepository)
    {
        _moodRepository = moodRepository;
    }

    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<MoodLog>>> GetMyMoods()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);
        return Ok(moods);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] MoodDto request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var mood = new MoodLog
        {
            UserId = userId,
            Score = request.Score, // Оценка настроения (например, от 1 до 5)
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        await _moodRepository.AddMoodAsync(mood);
        await _moodRepository.SaveChangesAsync();

        return Ok(new { message = "Настроение успешно записано!" });
    }
}

public class MoodDto
{
    public int Score { get; set; }
    public string Note { get; set; } = string.Empty;
}