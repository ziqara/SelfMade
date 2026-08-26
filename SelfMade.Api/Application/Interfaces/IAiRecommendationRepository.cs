using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IAiRecommendationRepository
{
    Task<AiRecommendation?> GetForDateAsync(int userId, DateTime dateUtc);
    Task AddAsync(AiRecommendation recommendation);
    Task SaveChangesAsync();
}
