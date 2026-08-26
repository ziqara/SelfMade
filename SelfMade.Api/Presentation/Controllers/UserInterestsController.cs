using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace SelfMade.Api.Presentation.Controllers;

[Authorize] // <-- Замок!
[Route("api/[controller]")]
[ApiController]
public class UserInterestsController : ControllerBase
{
    private readonly IUserInterestRepository _repository;

    public UserInterestsController(IUserInterestRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<UserInterest>>> GetMyInterests()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var interests = await _repository.GetInterestsByUserIdAsync(userId);
        return Ok(interests);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] UserInterestDto request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        var interest = new UserInterest
        {
            UserId = userId,
            CategoryId = request.CategoryId,
            Title = request.Title,
            IsDevelopmentGoal = request.IsDevelopmentGoal
        };

        await _repository.AddInterestAsync(interest);
        await _repository.SaveChangesAsync();

        return Ok(new { message = "Интерес/цель успешно добавлены!" });
    }
}

public class UserInterestDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Выберите категорию.")]
    public int CategoryId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public bool IsDevelopmentGoal { get; set; }
}