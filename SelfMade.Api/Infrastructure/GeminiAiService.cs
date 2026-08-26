using System.Text;
using System.Text.Json;
using SelfMade.Api.Application.Interfaces;

namespace SelfMade.Api.Infrastructure;

public class GeminiAiService : IAiService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IMoodRepository _moodRepository;
    private readonly IUserInterestRepository _interestRepository;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public GeminiAiService(
        IActivityRepository activityRepository,
        IMoodRepository moodRepository,
        IUserInterestRepository interestRepository,
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _activityRepository = activityRepository;
        _moodRepository = moodRepository;
        _interestRepository = interestRepository;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<string> GetDailyInsightAsync(int userId)
    {
        // 1. Собираем контекст из базы данных
        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);
        var interests = await _interestRepository.GetInterestsByUserIdAsync(userId);

        var today = DateTime.UtcNow.Date;
        var todayActivities = activities.Where(a => a.CreatedAt.Date == today).ToList();
        var todayMood = moods.Where(m => m.CreatedAt.Date == today).OrderByDescending(m => m.CreatedAt).FirstOrDefault();
        var developmentGoals = interests.Where(i => i.IsDevelopmentGoal).ToList();

        // 2. Формируем промпт для реальной нейросети
        var promptBuilder = new StringBuilder();
        promptBuilder.AppendLine("Ты — профессиональный ИИ-коучер по личной продуктивности. Проанализируй данные пользователя за сегодня и дай короткий, мотивирующий совет на русском языке.");

        if (developmentGoals.Any())
        {
            promptBuilder.AppendLine("Глобальные цели пользователя:");
            foreach (var goal in developmentGoals)
                promptBuilder.AppendLine($"- {goal.Title}");
        }

        if (todayMood != null)
        {
            promptBuilder.AppendLine($"Настроение за сегодня: {todayMood.Score}/5. Заметка: {todayMood.Note}");
        }
        else
        {
            promptBuilder.AppendLine("Настроение сегодня не отмечено.");
        }

        if (todayActivities.Any())
        {
            int totalMinutes = todayActivities.Sum(a => a.DurationMinutes);
            promptBuilder.AppendLine($"Выполненные активности за сегодня (всего {totalMinutes} мин.):");
            foreach (var act in todayActivities)
            {
                promptBuilder.AppendLine($"- {act.Title} ({act.DurationMinutes} мин.): {act.Description}");
            }
        }
        else
        {
            promptBuilder.AppendLine("Пользователь еще не записал ни одной активности за сегодня.");
        }

        promptBuilder.AppendLine("Дай конструктивную обратную связь, поддержи пользователя и соотнеси его действия с его целями.");

        // 3. Отправляем запрос в Google Gemini API
        var apiKey = _configuration["Gemini:ApiKey"];
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = promptBuilder.ToString() }
                    }
                }
            }
        };

        var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.PostAsync(url, jsonContent);

            // Читаем текст ошибки от Google, если запрос неуспешный
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return $"Google Error: {response.StatusCode} - {responseString}";
            }

            using var doc = JsonDocument.Parse(responseString);

            // Извлекаем текст ответа из структуры JSON ответа Google
            var text = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return text?.Trim() ?? "Не удалось получить ответ от ИИ.";
        }
        catch (Exception ex)
        {
            return $"Exception: {ex.Message}";
        }
    }
}