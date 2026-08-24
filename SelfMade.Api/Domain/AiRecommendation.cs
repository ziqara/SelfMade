namespace SelfMade.Api.Domain
{
    public class AiRecommendation
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }

        public string RecommendationText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
