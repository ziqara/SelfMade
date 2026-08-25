using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IMoodRepository
{
    Task<IEnumerable<MoodLog>> GetAllMoodsAsync();
    Task<IEnumerable<MoodLog>> GetMoodsByUserIdAsync(int userId);
    Task AddMoodAsync(MoodLog mood);
    Task SaveChangesAsync();
}