using SelfMade.Api.Application.Interfaces;
using System.Text;

namespace SelfMade.Api.Infrastructure.AiServices;

public class DummyAiService : IAiService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IMoodRepository _moodRepository;
    private readonly IUserInterestRepository _interestRepository; // <-- Добавили репозиторий целей

    public DummyAiService(
        IActivityRepository activityRepository,
        IMoodRepository moodRepository,
        IUserInterestRepository interestRepository) // <-- Внедрили через конструктор
    {
        _activityRepository = activityRepository;
        _moodRepository = moodRepository;
        _interestRepository = interestRepository;
    }

    public async Task<string> GetDailyInsightAsync(int userId)
    {
        // 1. Достаем все данные пользователя из БД
        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);
        var interests = await _interestRepository.GetInterestsByUserIdAsync(userId); // <-- Достаем цели

        // 2. Фильтруем данные
        var today = DateTime.UtcNow.Date;
        var todayActivities = activities.Where(a => a.CreatedAt.Date == today).ToList();
        var todayMood = moods.Where(m => m.CreatedAt.Date == today).OrderByDescending(m => m.CreatedAt).FirstOrDefault();
        var developmentGoals = interests.Where(i => i.IsDevelopmentGoal).ToList(); // Берем только цели развития

        await Task.Delay(1500); // Имитация раздумий

        // 3. Собираем сводку (Промпт для ИИ)
        var report = new StringBuilder();
        report.AppendLine($"[ФЕЙКОВЫЙ ИИ] Анализ дня для пользователя ID {userId}:");

        // Добавляем цели в отчет
        if (developmentGoals.Any())
        {
            report.AppendLine("- Твои глобальные цели:");
            foreach (var goal in developmentGoals)
            {
                report.AppendLine($"  * {goal.Title}");
            }
        }

        if (todayMood != null) report.AppendLine($"- Настроение: {todayMood.Score}/5 ({todayMood.Note})");

        if (todayActivities.Any())
        {
            int totalMinutes = todayActivities.Sum(a => a.DurationMinutes);
            report.AppendLine($"- Выполнено активностей: {todayActivities.Count} (общее время: {totalMinutes} мин.)");

            // Если есть цели, ИИ может их упомянуть
            if (developmentGoals.Any())
            {
                report.AppendLine($"💡 Ты отлично поработал! Каждый шаг приближает тебя к цели «{developmentGoals.First().Title}». Так держать!");
            }
            else
            {
                report.AppendLine("💡 Хороший старт! Добавь глобальные цели, чтобы я мог лучше тебе помогать.");
            }
        }
        else
        {
            report.AppendLine("- Ты еще не записал ни одной активности за сегодня.");
        }

        return report.ToString();
    }
}