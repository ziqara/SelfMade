using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces
{
    public interface IUserProfileRepository
    {
        Task<UserProfile?> GetByUserIdAsync(int userId);
        Task AddAsync(UserProfile profile);
        Task UpdateAsync(UserProfile profile);
        Task SaveChangesAsync();
    }
}
