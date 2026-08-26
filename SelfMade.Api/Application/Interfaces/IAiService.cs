using SelfMade.Api.Domain;

namespace SelfMade.Api.Application.Interfaces;

public interface IAiService
{
    // Возвращает уже сгенерированный сегодня совет без обращения к внешнему API (или null, если его еще нет)
    Task<string?> GetCachedInsightAsync(int userId);

    // Всегда обращается к Gemini, сохраняет и возвращает новый совет.
    // Бросает AiServiceException, если ИИ недоступен или вернул невалидный ответ.
    Task<string> GenerateDailyInsightAsync(int userId);

    // Просит ИИ разбить конкретную цель развития на пошаговый план.
    // Бросает AiServiceException, если ИИ недоступен или вернул невалидный ответ.
    Task<List<GoalPlanStepDraft>> GenerateGoalPlanAsync(int userId, UserInterest goal);
}
