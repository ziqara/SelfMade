using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _context;

    public CategoryRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
    {
        return await _context.Categories.ToListAsync();
    }

    public async Task<Category?> GetByIdAsync(int id)
    {
        return await _context.Categories
            .Include(c => c.ActivityLogs)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Category?> GetByNameAsync(string name)
    {
        // Регистронезависимое сравнение делаем на стороне .NET, а не в SQL (lower() в Postgres
        // под локалью "C" не умеет корректно работать с кириллицей — категорий все равно немного,
        // так что грузим все и сравниваем в памяти).
        var normalized = name.Trim();
        var all = await _context.Categories.ToListAsync();
        return all.FirstOrDefault(c => string.Equals(c.Name.Trim(), normalized, StringComparison.OrdinalIgnoreCase));
    }

    public async Task AddCategoryAsync(Category category)
    {
        await _context.Categories.AddAsync(category);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}