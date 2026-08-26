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

    // Получить дневник настроения только конкретного пользователя
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<MoodResponseDto>>> GetByUserId(int userId)
    {
        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);

        var response = moods.Select(m => new MoodResponseDto
        {
            Id = m.Id,
            Score = m.Score,
            Note = m.Note,
            CreatedAt = m.CreatedAt
        });

        return Ok(response);
    }

    // Создать новую запись настроения
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] MoodDto request)
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

        return Ok(new { message = "Настроение успешно записано!", moodId = mood.Id });
    }
}

// DTO для создания (от фронтенда)
public class MoodDto
{
    public int UserId { get; set; }
    public int Score { get; set; }
    public string Note { get; set; } = string.Empty;
}

// DTO для отправки на фронтенд (чтение)
public class MoodResponseDto
{
    public int Id { get; set; }
    public int Score { get; set; }
    public string Note { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}