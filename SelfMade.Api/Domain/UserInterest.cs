namespace SelfMade.Api.Domain;

public class UserInterest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsDevelopmentGoal { get; set; } // Является ли это целью для развития
}