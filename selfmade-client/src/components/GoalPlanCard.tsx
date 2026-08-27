import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import type { GoalPlanStep } from '../types';

interface GoalPlanCardProps {
  goalId: number;
  goalTitle: string;
}

// Разворачиваемый план от ИИ для конкретной цели развития: генерация шагов + чеклист выполнения.
export const GoalPlanCard = ({ goalId, goalTitle }: GoalPlanCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [steps, setSteps] = useState<GoalPlanStep[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadPlan = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<GoalPlanStep[]>(`/userinterests/${goalId}/plan`);
      setSteps(response.data);
    } catch (error) {
      console.error('Ошибка загрузки плана:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось загрузить план.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpand = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && steps === null) {
      loadPlan();
    }
  };

  const handleGenerate = async () => {
    if (steps && steps.length > 0) {
      const confirmed = window.confirm('Составить план заново? Текущие отметки о выполнении шагов будут потеряны.');
      if (!confirmed) return;
    }

    setIsGenerating(true);
    try {
      const response = await apiClient.post<GoalPlanStep[]>(`/userinterests/${goalId}/plan`);
      setSteps(response.data);
      toast.success('План от ИИ готов!');
    } catch (error) {
      console.error('Ошибка генерации плана:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось составить план. Попробуйте еще раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggle = async (stepId: number) => {
    // Оптимистично переключаем состояние, чтобы клик ощущался мгновенно
    setSteps((prev) =>
      prev?.map((s) => (s.id === stepId ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' } : s)) ?? null
    );
    try {
      const response = await apiClient.post<GoalPlanStep>(`/userinterests/${goalId}/plan/${stepId}/toggle`);
      setSteps((prev) => prev?.map((s) => (s.id === stepId ? response.data : s)) ?? null);
    } catch (error) {
      console.error('Ошибка обновления шага:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось обновить шаг.');
      loadPlan(); // откатываем к реальному состоянию с сервера
    }
  };

  const completedCount = steps?.filter((s) => s.status === 'completed').length ?? 0;

  return (
    <div className="mt-2 border-t border-rose-500/20 pt-2">
      <button
        onClick={handleExpand}
        className="flex items-center gap-1 text-sm font-medium text-rose-400 hover:text-rose-300 transition-colors"
      >
        <Sparkles size={14} />
        План от ИИ
        {steps && steps.length > 0 && (
          <span className="text-xs text-text-muted font-normal">({completedCount}/{steps.length})</span>
        )}
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <p className="text-sm text-text-muted">Загрузка плана...</p>
          ) : steps && steps.length > 0 ? (
            <>
              <ul className="space-y-2">
                {steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-2 bg-surface border border-border-subtle rounded-lg p-3">
                    <input
                      type="checkbox"
                      checked={step.status === 'completed'}
                      onChange={() => handleToggle(step.id)}
                      className="mt-1 w-4 h-4 rounded text-rose-500 shrink-0 cursor-pointer"
                    />
                    <div>
                      <p className={`font-medium text-sm ${step.status === 'completed' ? 'text-text-muted line-through' : 'text-text'}`}>
                        {step.title}
                      </p>
                      {step.description && (
                        <p className={`text-xs mt-0.5 ${step.status === 'completed' ? 'text-text-muted/60' : 'text-text-muted'}`}>
                          {step.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-xs text-text-muted hover:text-rose-400 transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Пересоставляю...' : 'Составить план заново'}
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full text-sm text-white px-4 py-2 rounded-lg font-medium transition-colors ${
                isGenerating ? 'bg-rose-500/50 cursor-wait' : 'bg-rose-500 hover:bg-rose-400'
              }`}
            >
              {isGenerating ? 'Составляю план...' : `Составить план для «${goalTitle}»`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
