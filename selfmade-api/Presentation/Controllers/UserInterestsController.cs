using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Exceptions;
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
    private readonly ICategoryRepository _categoryRepository;
    private readonly IAiService _aiService;
    private readonly ILogger<UserInterestsController> _logger;

    public UserInterestsController(
        IUserInterestRepository repository,
        ICategoryRepository categoryRepository,
        IAiService aiService,
        ILogger<UserInterestsController> logger)
    {
        _repository = repository;
        _categoryRepository = categoryRepository;
        _aiService = aiService;
        _logger = logger;
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

        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null || category.UserId != userId)
        {
            return BadRequest(new { message = "Категория не найдена." });
        }

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

    // Пользователь задает только общее направление в Профиле — конкретные цели внутри
    // него предлагает ИИ. Категории для новых целей переиспользуются или создаются
    // тем же способом, что и при ручном добавлении, чтобы не плодить дубли.
    [HttpPost("generate")]
    public async Task<ActionResult> GenerateGoals()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdString, out int userId)) return Unauthorized();

        try
        {
            var suggestions = await _aiService.GenerateGoalSuggestionsAsync(userId);

            var existingTitles = (await _repository.GetInterestsByUserIdAsync(userId))
                .Where(i => i.IsDevelopmentGoal)
                .Select(i => i.Title.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var createdCount = 0;

            foreach (var suggestion in suggestions)
            {
                if (existingTitles.Contains(suggestion.Title)) continue;

                var category = await _categoryRepository.GetByNameAsync(userId, suggestion.Category);
                if (category == null)
                {
                    category = new Category { UserId = userId, Name = suggestion.Category, Description = string.Empty, Type = "Обучение" };
                    await _categoryRepository.AddCategoryAsync(category);
                    await _categoryRepository.SaveChangesAsync();
                }

                await _repository.AddInterestAsync(new UserInterest
                {
                    UserId = userId,
                    CategoryId = category.Id,
                    Title = suggestion.Title,
                    IsDevelopmentGoal = true
                });

                existingTitles.Add(suggestion.Title);
                createdCount++;
            }

            await _repository.SaveChangesAsync();

            return Ok(new
            {
                message = createdCount > 0
                    ? $"ИИ добавил целей: {createdCount}."
                    : "ИИ не нашел новых целей — похоже, всё уже есть в списке.",
                count = createdCount
            });
        }
        catch (AiServiceException ex)
        {
            _logger.LogWarning(ex, "Goal suggestion generation failed for user {UserId}", userId);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = ex.Message });
        }
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