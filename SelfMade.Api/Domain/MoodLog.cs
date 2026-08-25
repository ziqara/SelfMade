namespace SelfMade.Api.Domain;

public class MoodLog
{
    public int Id { get; set; }

    // Какой пользователь зафиксировал настроение
    public int UserId { get; set; }
    public User? User { get; set; }

    public int Score { get; set; } // Оценка настроения (например, от 1 до 5)
    public string Note { get; set; } = string.Empty; // Текстовая рефлексия, мысли, заметка
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}