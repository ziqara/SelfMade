namespace SelfMade.Api.Domain
{
    public class UserProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string LearningTrack { get; set; } = string.Empty;
        public string? CurrentLevel { get; set; }
        public TimeOnly FreeTimeStart { get; set; }
        public TimeOnly FreeTimeEnd { get; set; }
        public TimeOnly SleepTime { get; set; }
        public string PreferredRest { get; set; } = string.Empty;
        public string? DislikedRest { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User? User { get; set; }
    }
}
