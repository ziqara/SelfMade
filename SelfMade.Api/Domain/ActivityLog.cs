namespace SelfMade.Api.Domain
{
    public class ActivityLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }

        public string Title { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public bool IsProductive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
