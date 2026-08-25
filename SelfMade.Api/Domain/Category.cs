namespace SelfMade.Api.Domain;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty; // Например, "Работа", "Спорт", "Отдых"
    public string Description { get; set; } = string.Empty;

    // Навигационное свойство: связь с логами активности
    public ICollection<ActivityLog> ActivityLogs { get; set; } = new List<ActivityLog>();
}