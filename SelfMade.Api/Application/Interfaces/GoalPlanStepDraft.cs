namespace SelfMade.Api.Application.Interfaces;

// Черновик одного шага плана, который ИИ предложил для цели — еще не сохранен в БД.
public record GoalPlanStepDraft(string Title, string Description);
