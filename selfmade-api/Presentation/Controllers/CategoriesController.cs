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
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoriesController(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    // Категории личные — каждый пользователь видит и создает только свои,
    // чтобы список не превращался в общую свалку из чужих категорий
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        var categories = await _categoryRepository.GetByUserIdAsync(userId.Value);

        var response = categories.Select(c => new CategoryResponseDto
        {
            Id = c.Id,
            Name = c.Name,
            Description = c.Description,
            Type = c.Type
        });

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult> CreateCategory([FromBody] CategoryDto request)
    {
        var userId = CurrentUserId();
        if (userId == null) return Unauthorized();

        // Если у этого же пользователя уже есть такая категория (без учета регистра) —
        // переиспользуем ее вместо дубля.
        var existing = await _categoryRepository.GetByNameAsync(userId.Value, request.Name);
        if (existing != null)
        {
            return Ok(new { message = "Такая категория уже есть, используем её.", categoryId = existing.Id });
        }

        var category = new Category
        {
            UserId = userId.Value,
            Name = request.Name,
            Description = request.Description,
            Type = request.Type
        };

        await _categoryRepository.AddCategoryAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return Ok(new { message = "Категория успешно создана!", categoryId = category.Id });
    }

    private int? CurrentUserId()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdString, out int userId) ? userId : null;
    }
}

// DTO для создания категории (от фронтенда)
public class CategoryDto
{
    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Type { get; set; } = string.Empty;
}

// DTO для отправки данных на фронтенд (чтение)
public class CategoryResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}
