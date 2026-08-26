using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Infrastructure.Repositories;

public class AiRecommendationRepository : IAiRecommendationRepository
{
    private readonly AppDbContext _context;

    public AiRecommendationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AiRecommendation?> GetForDateAsync(int userId, DateTime dateUtc)
    {
        return await _context.AiRecommendations
            .Where(r => r.UserId == userId && r.CreatedAt.Date == dateUtc.Date)
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task AddAsync(AiRecommendation recommendation)
    {
        await _context.AiRecommendations.AddAsync(recommendation);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
