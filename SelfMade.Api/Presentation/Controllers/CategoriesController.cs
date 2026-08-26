using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoriesController(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
    {
        var categories = await _categoryRepository.GetAllCategoriesAsync();

        // Маппим сущности в безопасные DTO
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
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            Type = request.Type
        };

        await _categoryRepository.AddCategoryAsync(category);
        await _categoryRepository.SaveChangesAsync();

        // Возвращаем сообщение и ID, как мы делали в других контроллерах
        return Ok(new { message = "Категория успешно создана!", categoryId = category.Id });
    }
}

// DTO для создания категории (от фронтенда)
public class CategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

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