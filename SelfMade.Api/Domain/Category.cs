namespace SelfMade.Api.Domain;

public class Category
{
    public int Id { get; set; }
    public int UserId { get; set; } // Категории личные — каждый пользователь видит и создает только свои
    public string Name { get; set; } = string.Empty; // Например, "Работа", "Спорт", "Отдых"
    public string Description { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    // Навигационное свойство: связь с логами активности
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}