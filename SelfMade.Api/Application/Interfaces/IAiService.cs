namespace SelfMade.Api.Application.Interfaces;

public interface IAiService
{
    // Метод, который принимает ID пользователя и возвращает строку с советом
    Task<string> GetDailyInsightAsync(int userId);
}