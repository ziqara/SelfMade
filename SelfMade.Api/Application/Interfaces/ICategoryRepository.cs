using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetAllCategoriesAsync();
    Task<Category?> GetByIdAsync(int id);
    Task AddCategoryAsync(Category category);
    Task SaveChangesAsync();
}