import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import type { NextStep } from '../types';

interface NextStepCardProps {
  step: NextStep;
  onCompleted: () => void;
}

// Один клик = шаг плана отмечен выполненным И записана активность с тем же названием.
export const NextStepCard = ({ step, onCompleted }: NextStepCardProps) => {
  const [duration, setDuration] = useState('30');
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await apiClient.post(`/userinterests/${step.goalId}/plan/${step.stepId}/complete`, {
        durationMinutes: parseInt(duration) || 30,
      });
      toast.success('Шаг отмечен выполненным, активность записана!');
      onCompleted();
    } catch (error) {
      console.error('Ошибка завершения шага:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось отметить шаг выполненным.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-white/70 border border-purple-200 rounded-xl">
      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
        🎯 {step.goalTitle}
      </span>
      <p className="font-bold text-gray-800 mt-1">{step.title}</p>
      {step.description && <p className="text-sm text-gray-600 mt-1">{step.description}</p>}

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <label className="text-sm text-gray-600 flex items-center gap-2">
          Минут:
          <input
            type="number"
            min="1"
            max="1440"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-20 border p-1.5 rounded-lg bg-white"
          />
        </label>
        <button
          onClick={handleComplete}
          disabled={isCompleting}
          className={`flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
            isCompleting ? 'bg-purple-300 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <CheckCircle2 size={16} />
          {isCompleting ? 'Сохраняю...' : 'Отметить выполненным'}
        </button>
      </div>
    </div>
  );
};
