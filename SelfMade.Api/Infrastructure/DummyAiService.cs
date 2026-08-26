using SelfMade.Api.Application.Interfaces;

namespace SelfMade.Api.Infrastructure.AiServices;

public class DummyAiService : IAiService
{
    public async Task<string> GetDailyInsightsAsync(string prompt)
    {
        // Эмулируем задержку ответа сети (2 секунды)
        await Task.Delay(2000);

        // Возвращаем фейковый ответ, чтобы протестировать логику
        return $"[ФЕЙКОВЫЙ ИИ] Я проанализировал твои данные: \"{prompt}\". Ты молодец, так держать! Завтра постарайся больше отдыхать.";
    }
}