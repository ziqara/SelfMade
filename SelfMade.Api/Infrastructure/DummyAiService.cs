using SelfMade.Api.Application.Interfaces;
using System.Text;

namespace SelfMade.Api.Infrastructure.AiServices;

public class DummyAiService : IAiService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IMoodRepository _moodRepository;

    // Внедряем репозитории через конструктор
    public DummyAiService(IActivityRepository activityRepository, IMoodRepository moodRepository)
    {
        _activityRepository = activityRepository;
        _moodRepository = moodRepository;
    }

    public async Task<string> GetDailyInsightAsync(int userId)
    {
        // 1. Достаем все данные пользователя из БД
        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);

        // 2. Отбираем только то, что было сделано сегодня (по UTC)
        var today = DateTime.UtcNow.Date;
        var todayActivities = activities.Where(a => a.CreatedAt.Date == today).ToList();

        // Берем последнюю запись о настроении за сегодня
        var todayMood = moods
            .Where(m => m.CreatedAt.Date == today)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefault();

        // Имитируем "раздумья" ИИ
        await Task.Delay(1500);

        // 3. Собираем сводку (Промпт)
        var report = new StringBuilder();
        report.AppendLine($"[ФЕЙКОВЫЙ ИИ] Анализ дня для пользователя ID {userId}:");

        // Анализ настроения
        if (todayMood != null)
        {
            report.AppendLine($"- Твое настроение: {todayMood.Score}/5 ({todayMood.Note})");
        }
        else
        {
            report.AppendLine("- Настроение пока не отмечено.");
        }

        // Анализ активностей
        if (todayActivities.Any())
        {
            int totalMinutes = todayActivities.Sum(a => a.DurationMinutes);
            report.AppendLine($"- Выполнено активностей: {todayActivities.Count} (общее время: {totalMinutes} мин.)");

            // Простая имитация "умного" совета на основе данных
            if (totalMinutes > 120 && todayMood?.Score >= 4)
            {
                report.AppendLine("🌟 Ого, супер-продуктивный день, и ты чувствуешь себя отлично! Так держать!");
            }
            else if (totalMinutes > 120 && todayMood?.Score <= 3)
            {
                report.AppendLine("⚠️ Ты много трудился, но настроение не очень. Обязательно выдели время на отдых, чтобы избежать выгорания!");
            }
            else
            {
                report.AppendLine("💡 Хороший старт! Продолжай двигаться к своим целям, балансируя работу и отдых.");
            }
        }
        else
        {
            report.AppendLine("- Ты еще не записал ни одной активности за сегодня. Самое время начать!");
        }

        return report.ToString();
    }
}