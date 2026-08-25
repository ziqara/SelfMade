namespace SelfMade.Api.Domain;

public class ActivityLog
{
    public int Id { get; set; }

    // Кто совершил активность
    public int UserId { get; set; }
    public User? User { get; set; }

    // К какой категории относится активность (Работа, Спорт и т.д.)
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public string Title { get; set; } = string.Empty; // Например: "Изучение Clean Architecture"
    public string Description { get; set; } = string.Empty;

    public int DurationMinutes { get; set; } // Сколько времени потрачено (в минутах)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}