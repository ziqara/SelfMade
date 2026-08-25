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
    public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
    {
        var categories = await _categoryRepository.GetAllCategoriesAsync();
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] CategoryDto request)
    {
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description
        };

        await _categoryRepository.AddCategoryAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return Ok(category);
    }
}

public class CategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}