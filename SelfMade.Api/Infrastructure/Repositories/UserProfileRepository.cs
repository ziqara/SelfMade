using SelfMade.Api.Application.Interfaces;
using SelfMade.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace SelfMade.Api.Infrastructure.Repositories
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly AppDbContext _context;

        public UserProfileRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfile?> GetByUserIdAsync(int userId)
        {
            return await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
        }

        public async Task AddAsync(UserProfile profile)
        {
            await _context.UserProfiles.AddAsync(profile);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserProfile profile)
        {
            profile.UpdatedAt = DateTime.UtcNow;
            _context.UserProfiles.Update(profile);
            await _context.SaveChangesAsync();
        }
    }
}
