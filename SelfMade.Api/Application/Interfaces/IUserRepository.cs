using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IUserRepository
{
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task<User?> GetByIdAsync(int id);
    Task AddUserAsync(User user);
    Task SaveChangesAsync();
}