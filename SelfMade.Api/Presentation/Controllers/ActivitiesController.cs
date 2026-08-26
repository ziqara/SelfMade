using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityRepository _activityRepository;

    public ActivitiesController(IActivityRepository activityRepository)
    {
        _activityRepository = activityRepository;
    }

    // Получить активности только конкретного пользователя
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<ActivityResponseDto>>> GetByUserId(int userId)
    {
        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);

        // Превращаем (маппим) сущности из базы в безопасные DTO
        var response = activities.Select(a => new ActivityResponseDto
        {
            Id = a.Id,
            Title = a.Title,
            Description = a.Description, // Если может быть null, добавь '?' в DTO
            DurationMinutes = a.DurationMinutes,
            CreatedAt = a.CreatedAt
        });

        return Ok(response);
    }

    // Создать новую активность
    [HttpPost]
    public async Task<ActionResult> Create([FromBody] ActivityDto request)
    {
        var activity = new ActivityLog
        {
            UserId = request.UserId,
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

// DTO для получения данных от фронтенда (создание)
public class ActivityDto
{
    public int UserId { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
}

// DTO для отправки данных на фронтенд (чтение)
public class ActivityResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
}