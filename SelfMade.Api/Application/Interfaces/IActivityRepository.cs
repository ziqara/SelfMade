using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IActivityRepository
{
    Task<IEnumerable<ActivityLog>> GetAllActivitiesAsync();
    Task<IEnumerable<ActivityLog>> GetActivitiesByUserIdAsync(int userId);
    Task AddActivityAsync(ActivityLog activity);
    Task SaveChangesAsync();
}