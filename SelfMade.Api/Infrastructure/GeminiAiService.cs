using System.Text;
using System.Text.Json;
using SelfMade.Api.Application.Interfaces;

namespace SelfMade.Api.Infrastructure;

public class GeminiAiService : IAiService
{
    private readonly IActivityRepository _activityRepository;
    private readonly IMoodRepository _moodRepository;
    private readonly IUserInterestRepository _interestRepository;
    private readonly IUserProfileRepository _profileRepository;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public GeminiAiService(
        IActivityRepository activityRepository,
        IMoodRepository moodRepository,
        IUserInterestRepository interestRepository,
        IUserProfileRepository profileRepository,
        IConfiguration configuration,
        HttpClient httpClient)
    {
        _activityRepository = activityRepository;
        _moodRepository = moodRepository;
        _interestRepository = interestRepository;
        _profileRepository = profileRepository;
        _configuration = configuration;
        _httpClient = httpClient;
    }

    public async Task<string> GetDailyInsightAsync(int userId)
    {
        // 1. Сбор контекста из БД
        var activities = await _activityRepository.GetActivitiesByUserIdAsync(userId);
        var moods = await _moodRepository.GetMoodsByUserIdAsync(userId);
        var interests = await _interestRepository.GetInterestsByUserIdAsync(userId);
        var profile = await _profileRepository.GetByUserIdAsync(userId);

        var today = DateTime.UtcNow.Date;
        var todayActivities = activities.Where(a => a.CreatedAt.Date == today).ToList();
        var todayMood = moods.Where(m => m.CreatedAt.Date == today).OrderByDescending(m => m.CreatedAt).FirstOrDefault();
        var developmentGoals = interests.Where(i => i.IsDevelopmentGoal).ToList();

        // 2. Формирование промпта
        var promptBuilder = new StringBuilder();

        promptBuilder.AppendLine("Ты — персональный наставник по саморазвитию и тайм-менеджменту. Твоя задача — вести пользователя по пути обучения и помогать качественно восстанавливать силы исключительно в его свободное время.");
        promptBuilder.AppendLine("ВАЖНЫЕ ПРАВИЛА:");
        promptBuilder.AppendLine("1. Общайся в деловом, тактичном, но мотивирующем тоне. Обращайся на 'ты', без сленга и панибратства.");
        promptBuilder.AppendLine("2. Всегда давай ТОЧНЫЕ, предметные рекомендации. Не используй общие фразы вроде 'почитай книгу' или 'поучи что-то'. Называй конкретную тему/паттерн для изучения и конкретное произведение/активность для отдыха.");
        promptBuilder.AppendLine("3. Учитывай график пользователя: он занимается саморазвитием только в свои свободные часы.");

        if (profile != null)
        {
            promptBuilder.AppendLine("ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ:");
            promptBuilder.AppendLine($"- Вектор развития: {profile.LearningTrack}");
            if (!string.IsNullOrEmpty(profile.CurrentLevel))
                promptBuilder.AppendLine($"- Текущий уровень: {profile.CurrentLevel}");
            promptBuilder.AppendLine($"- Свободное время: с {profile.FreeTimeStart:HH:mm} до {profile.FreeTimeEnd:HH:mm}");
            promptBuilder.AppendLine($"- Время отхода ко сну: {profile.SleepTime:HH:mm}");
            promptBuilder.AppendLine($"- Предпочтительный отдых/хобби: {profile.PreferredRest}");
            if (!string.IsNullOrEmpty(profile.DislikedRest))
                promptBuilder.AppendLine($"- Нежелательный отдых (не предлагать!): {profile.DislikedRest}");
        }

        if (developmentGoals.Any())
        {
            promptBuilder.AppendLine("Глобальные цели:");
            foreach (var goal in developmentGoals)
                promptBuilder.AppendLine($"- {goal.Title}");
        }

        if (todayMood != null)
        {
            promptBuilder.AppendLine($"Состояние сегодня: {todayMood.Score}/5 ({todayMood.Note}).");
        }

        if (todayActivities.Any())
        {
            int totalMinutes = todayActivities.Sum(a => a.DurationMinutes);
            promptBuilder.AppendLine($"Выполненные задачи сегодня (всего {totalMinutes} мин.):");
            foreach (var act in todayActivities)
            {
                promptBuilder.AppendLine($"- {act.Title} ({act.DurationMinutes} мин.): {act.Description}");
            }
        }
        else
        {
            promptBuilder.AppendLine("Сегодня задачи еще не фиксировались.");
        }

        promptBuilder.AppendLine("СФОРМИРУЙ ОТВЕТ СТРОГО ПО СЛЕДУЮЩЕЙ СТРУКТУРЕ:");
        promptBuilder.AppendLine("1. Краткий анализ дня (1-2 предложения).");
        promptBuilder.AppendLine("2. **Следующий шаг в обучении**: конкретная тема, паттерн или практическая задача строго по его вектору развития с расчетом на его окно свободного времени.");
        promptBuilder.AppendLine("3. **План восстановления**: точная рекомендация по отдыху (конкретный фильм/книга/формат прогулки) строго с учетом его предпочтений и времени сна.");

        // 3. Отправка запроса в Gemini API
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
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return $"Google Error: {response.StatusCode} - {responseString}";
            }

            using var doc = JsonDocument.Parse(responseString);

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