using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface ICategoryRepository
{
    Task<IEnumerable<Category>> GetByUserIdAsync(int userId);
    Task<Category?> GetByIdAsync(int id);
    Task<Category?> GetByNameAsync(int userId, string name);
    Task AddCategoryAsync(Category category);
    Task SaveChangesAsync();
}