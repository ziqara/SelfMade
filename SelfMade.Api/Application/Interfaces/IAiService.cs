namespace SelfMade.Api.Application.Interfaces;

public interface IAiService
{
    /// <summary>
    /// Отправляет данные в нейросеть и получает текстовый анализ/советы.
    /// </summary>
    /// <param name="prompt">Сформированный текст с активностями и настроением пользователя за день</param>
    /// <returns>Ответ от искусственного интеллекта</returns>
    Task<string> GetDailyInsightsAsync(string prompt);
}