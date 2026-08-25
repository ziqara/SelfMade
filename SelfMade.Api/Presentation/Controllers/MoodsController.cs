using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MoodsController : ControllerBase
{
    private readonly IMoodRepository _moodRepository;

    public MoodsController(IMoodRepository moodRepository)
    {
        _moodRepository = moodRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MoodLog>>> GetAll()
    {
        var moods = await _moodRepository.GetAllMoodsAsync();
        return Ok(moods);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<MoodLog>>> GetByUserId(int userId)
    {
        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);
        return Ok(moods);
    }

    [HttpPost]
    public async Task<ActionResult<MoodLog>> Create([FromBody] MoodDto request)
    {
        var mood = new MoodLog
        {
            UserId = request.UserId,
            Score = request.Score,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        await _moodRepository.AddMoodAsync(mood);
        await _moodRepository.SaveChangesAsync();

        return Ok(mood);
    }
}

public class MoodDto
{
    public int UserId { get; set; }
    public int Score { get; set; }
    public string Note { get; set; } = string.Empty;
}