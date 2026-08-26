using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IUserProfileRepository _profileRepository;

    public ProfileController(IUserProfileRepository profileRepository)
    {
        _profileRepository = profileRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _profileRepository.GetByUserIdAsync(userId);
        if (profile == null)
            return NotFound("Профиль еще не заполнен.");

        return Ok(profile);
    }

    [HttpPost]
    public async Task<IActionResult> SaveProfile([FromBody] SaveProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existing = await _profileRepository.GetByUserIdAsync(userId);

        if (existing == null)
        {
            var newProfile = new UserProfile
            {
                UserId = userId,
                LearningTrack = request.LearningTrack,
                CurrentLevel = request.CurrentLevel,
                FreeTimeStart = request.FreeTimeStart,
                FreeTimeEnd = request.FreeTimeEnd,
                SleepTime = request.SleepTime,
                PreferredRest = request.PreferredRest,
                DislikedRest = request.DislikedRest
            };
            await _profileRepository.AddAsync(newProfile);
        }
        else
        {
            existing.LearningTrack = request.LearningTrack;
            existing.CurrentLevel = request.CurrentLevel;
            existing.FreeTimeStart = request.FreeTimeStart;
            existing.FreeTimeEnd = request.FreeTimeEnd;
            existing.SleepTime = request.SleepTime;
            existing.PreferredRest = request.PreferredRest;
            existing.DislikedRest = request.DislikedRest;
            await _profileRepository.UpdateAsync(existing);
        }

        await _profileRepository.SaveChangesAsync();

        return Ok(new { message = "Профиль успешно сохранен." });
    }
}

public record SaveProfileRequest(
    [Required, MaxLength(200)] string LearningTrack,
    [MaxLength(100)] string? CurrentLevel,
    TimeOnly FreeTimeStart,
    TimeOnly FreeTimeEnd,
    TimeOnly SleepTime,
    [Required, MaxLength(500)] string PreferredRest,
    [MaxLength(500)] string? DislikedRest
);