using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task AddUserAsync(User user);
    Task SaveChangesAsync();
}