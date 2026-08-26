using Microsoft.AspNetCore.Mvc;
using SelfMade.Api.Application.Interfaces;

namespace SelfMade.Api.Presentation.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnalyticsController : ControllerBase
{
    private readonly IAiService _aiService;
    private readonly IActivityRepository _activityRepository;
    private readonly IMoodRepository _moodRepository;

    public AnalyticsController(
        IAiService aiService,
        IActivityRepository activityRepository,
        IMoodRepository moodRepository)
    {
        _aiService = aiService;
        _activityRepository = activityRepository;
        _moodRepository = moodRepository;
    }

    // Получить совет от ИИ за сегодняшний день: GET /api/analytics/daily/{userId}
    [HttpGet("daily/{userId}")]
    public async Task<IActionResult> GetDailyInsight(int userId)
    {
        // 1. Вытаскиваем все активности пользователя
        var allActivities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        var allMoods = await _moodRepository.GetMoodsByUserIdAsync(userId);

        // 2. Отфильтруем только сегодняшние записи (в будущем это лучше делать прямо в базе)
        var today = DateTime.UtcNow.Date;

        var todayActivities = allActivities
            .Where(a => a.CreatedAt.Date == today)
            .ToList();

        var todayMood = allMoods
            .Where(m => m.CreatedAt.Date == today)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefault(); // Берем последнюю оценку за день

        // Если данных нет, ИИ нечего анализировать
        if (!todayActivities.Any() && todayMood == null)
        {
            return Ok(new { insight = "У тебя пока нет записей за сегодня. Добавь пару активностей, и я дам тебе совет!" });
        }

        // 3. Формируем текст (промпт) для нейросети
        var activitiesText = string.Join(", ", todayActivities.Select(a => $"{a.Title} ({a.DurationMinutes} мин)"));
        var moodText = todayMood != null ? todayMood.Score.ToString() : "не указано";

        string prompt = $"Проанализируй мой день. Мои занятия сегодня: {activitiesText}. Мое настроение: {moodText} из 5. " +
                        $"Дай короткий, мотивирующий совет на одно-два предложения, как мне улучшить продуктивность или самочувствие.";

        // 4. Отправляем промпт в нашу нейросеть (сейчас в DummyAiService)
        string aiResponse = await _aiService.GetDailyInsightsAsync(prompt);

        return Ok(new { insight = aiResponse, generatedAt = DateTime.UtcNow });
    }
}