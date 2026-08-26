using Microsoft.EntityFrameworkCore;
using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;

namespace SelfMade.Api.Infrastructure.Repositories;

public class UserInterestRepository : IUserInterestRepository
{
    private readonly AppDbContext _context;

    public UserInterestRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<UserInterest>> GetInterestsByUserIdAsync(int userId)
    {
        return await _context.UserInterests
            .Where(ui => ui.UserId == userId)
            .ToListAsync();
    }

    public async Task<UserInterest?> GetByIdAsync(int id)
    {
        return await _context.UserInterests.FindAsync(id);
    }

    public async Task AddInterestAsync(UserInterest interest)
    {
        await _context.UserInterests.AddAsync(interest);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}