using SelfMade.Api.Application.Interfaces;

namespace SelfMade.Api.Infrastructure.AiServices;

public class DummyAiService : IAiService
{
    public async Task<string> GetDailyInsightAsync(int userId)
    {
        // Эмулируем задержку ответа от реального ИИ (2 секунды)
        await Task.Delay(2000);

        // Возвращаем фейковый ответ, но теперь ИИ знает, чей это ID!
        return $"[ФЕЙКОВЫЙ ИИ] Я проанализировал данные пользователя с ID {userId}. Отличный день для новых свершений! Добавь пару активностей, и я дам более точный совет.";
    }
}