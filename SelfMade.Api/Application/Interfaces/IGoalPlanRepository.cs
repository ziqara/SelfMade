using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IGoalPlanRepository
{
    Task<List<AiRecommendation>> GetByGoalIdAsync(int goalId);
    Task<AiRecommendation?> GetByIdAsync(int id);
    Task<List<AiRecommendation>> GetAllPendingForUserAsync(int userId);
    Task AddRangeAsync(IEnumerable<AiRecommendation> steps);
    Task RemoveAllForGoalAsync(int goalId);
    Task SaveChangesAsync();
}
