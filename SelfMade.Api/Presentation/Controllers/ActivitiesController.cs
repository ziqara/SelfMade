using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

[Authorize] // Без токена сюда не пустят!
[Route("api/[controller]")]
[ApiController]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityRepository _activityRepository;

    public ActivitiesController(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    // Получить активности текущего пользователя (больше не передаем ID в URL)
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<ActivityResponseDto>>> GetMyActivities()
    {
        // Достаем ID пользователя прямо из токена
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId))
        {
            return Unauthorized(new { message = "Не удалось определить пользователя." });
        }

        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);

        var response = activities.Select(a => new ActivityResponseDto
        {
            Id = a.Id,
            Title = a.Title,
            Description = a.Description,
            DurationMinutes = a.DurationMinutes,
            CreatedAt = a.CreatedAt
        });

        return Ok(response);
    }

    // Создать новую активность
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] ActivityDto request)
    {
        // Достаем ID из токена для сохранения в базу
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId))
        {
            return Unauthorized();
        }

        var activity = new ActivityLog
        {
            UserId = userId, // Берем из токена, а не от фронтенда!
            CategoryId = request.CategoryId,
            Title = request.Title,
            Description = request.Description,
            DurationMinutes = request.DurationMinutes,
            CreatedAt = DateTime.UtcNow
        };

        await _activityRepository.AddActivityAsync(activity);
        await _activityRepository.SaveChangesAsync();

        return Ok(new { message = "Активность успешно добавлена!", activityId = activity.Id });
    }
}

// DTO для создания (UserId отсюда удалили, он больше не нужен!)
public class ActivityDto
{
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
}

// DTO для ответа (без изменений)
public class ActivityResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
}