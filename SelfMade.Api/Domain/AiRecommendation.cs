namespace SelfMade.Api.Domain
{
    // Один шаг плана, который ИИ предложил для конкретной цели развития (UserInterest).
    public class AiRecommendation
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int GoalId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        // "pending" | "completed"
        public string Status { get; set; } = "pending";
        public DateTime? CompletedAt { get; set; }
    }
}
