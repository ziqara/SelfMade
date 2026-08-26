using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using System.Linq;

namespace SelfMade.Api.Infrastructure.Repositories;

public class ActivityRepository : IActivityRepository
{
    private readonly AppDbContext _context;

    public ActivityRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ActivityLog>> GetAllActivitiesAsync()
    {
        return await _context.ActivityLogs
            .Include(a => a.User)
            .Include(a => a.Category)
            .ToListAsync();
    }

    public async Task<IEnumerable<ActivityLog>> GetActivitiesByUserIdAsync(int userId)
    {
        return await _context.ActivityLogs
        .Where(a => a.UserId == userId)
        .Include(a => a.Category)
        .ToListAsync();
    }

    public async Task AddActivityAsync(ActivityLog activity)
    {
        await _context.ActivityLogs.AddAsync(activity);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}