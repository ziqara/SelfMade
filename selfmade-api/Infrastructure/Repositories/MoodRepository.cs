using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Infrastructure.Repositories;

public class MoodRepository : IMoodRepository
{
    private readonly AppDbContext _context;

    public MoodRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MoodLog>> GetAllMoodsAsync()
    {
        return await _context.MoodLogs
            .Include(m => m.User)
            .ToListAsync();
    }

    public async Task<IEnumerable<MoodLog>> GetMoodsByUserIdAsync(int userId)
    {
        return await _context.MoodLogs
            .Where(m => m.UserId == userId)
            .ToListAsync();
    }

    public async Task AddMoodAsync(MoodLog mood)
    {
        await _context.MoodLogs.AddAsync(mood);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}