using System.ComponentModel.DataAnnotations.Schema;

namespace SelfMade.Api.Domain;

public class User
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Навигационные свойства (их не нужно маппить на колонки)
    public ICollection<UserInterest> Interests { get; set; } = new List<UserInterest>();
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
    public ICollection<MoodLog> MoodLogs { get; set; } = new List<MoodLog>();
    public ICollection<AiRecommendation> AiRecommendations { get; set; } = new List<AiRecommendation>();
}