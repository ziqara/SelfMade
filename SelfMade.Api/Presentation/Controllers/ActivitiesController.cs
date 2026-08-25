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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ActivityLog>>> GetAll()
    {
        var activities = await _activityRepository.GetAllActivitiesAsync();
        return Ok(activities);
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<ActivityLog>>> GetByUserId(int userId)
    {
        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        return Ok(activities);
    }

    [HttpPost]
    public async Task<ActionResult<ActivityLog>> Create([FromBody] ActivityDto request)
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

        return Ok(activity);
    }
}

public class ActivityDto
{
    public int UserId { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
}