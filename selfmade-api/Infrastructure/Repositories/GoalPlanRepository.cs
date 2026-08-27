using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Infrastructure.Repositories;

public class GoalPlanRepository : IGoalPlanRepository
{
    private readonly AppDbContext _context;

    public GoalPlanRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AiRecommendation>> GetByGoalIdAsync(int goalId)
    {
        return await _context.AiRecommendations
            .Where(r => r.GoalId == goalId)
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task<AiRecommendation?> GetByIdAsync(int id)
    {
        return await _context.AiRecommendations.FindAsync(id);
    }

    public async Task<List<AiRecommendation>> GetAllPendingForUserAsync(int userId)
    {
        return await _context.AiRecommendations
            .Where(r => r.UserId == userId && r.Status == "pending")
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task<List<AiRecommendation>> GetAllForUserAsync(int userId)
    {
        return await _context.AiRecommendations
            .Where(r => r.UserId == userId)
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task AddRangeAsync(IEnumerable<AiRecommendation> steps)
    {
        await _context.AiRecommendations.AddRangeAsync(steps);
    }

    public async Task RemoveAllForGoalAsync(int goalId)
    {
        var existing = await _context.AiRecommendations.Where(r => r.GoalId == goalId).ToListAsync();
        _context.AiRecommendations.RemoveRange(existing);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
