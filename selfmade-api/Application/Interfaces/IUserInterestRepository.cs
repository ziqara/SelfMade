using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IUserInterestRepository
{
    Task<IEnumerable<UserInterest>> GetInterestsByUserIdAsync(int userId);
    Task<UserInterest?> GetByIdAsync(int id);
    Task AddInterestAsync(UserInterest interest);
    Task SaveChangesAsync();
}