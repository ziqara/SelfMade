import { useEffect, useState } from 'react';
import { Play, Square, CheckCircle2, X } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import type { NextStep } from '../types';

interface NextStepCardProps {
  step: NextStep;
  onCompleted: () => void;
}

type SessionState = 'idle' | 'active' | 'finishing';

const sessionKey = (stepId: number) => `selfmade_session_${stepId}`;

const formatElapsed = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

// Сессия "Начать -> Закончить": во время работы просто тикает таймер, а вопросы
// про настроение и что было непонятно задаются один раз, в самом конце.
// Родитель обязан передавать key={step.stepId}, чтобы React пересоздавал этот компонент
// при смене шага — тогда восстановление сессии из localStorage ниже безопасно делать
// через ленивый начальный useState, не через useEffect.
export const NextStepCard = ({ step, onCompleted }: NextStepCardProps) => {
  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const saved = localStorage.getItem(sessionKey(step.stepId));
    return saved ? parseInt(saved) : null;
  });
  const [sessionState, setSessionState] = useState<SessionState>(() =>
    localStorage.getItem(sessionKey(step.stepId)) ? 'active' : 'idle'
  );
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationOverride, setDurationOverride] = useState('');
  const [moodScore, setMoodScore] = useState('5');
  const [moodNote, setMoodNote] = useState('');
  const [confusionNote, setConfusionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionState !== 'active' || startedAt === null) return;

    const tick = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionState, startedAt]);

  const handleStart = () => {
    const now = Date.now();
    localStorage.setItem(sessionKey(step.stepId), String(now));
    setStartedAt(now);
    setElapsedSec(0);
    setSessionState('active');
  };

  const handleFinishClick = () => {
    setDurationOverride(String(Math.max(1, Math.round(elapsedSec / 60))));
    setSessionState('finishing');
  };

  const handleCancel = () => {
    localStorage.removeItem(sessionKey(step.stepId));
    setSessionState('idle');
    setStartedAt(null);
    setElapsedSec(0);
  };

  const handleSubmitFinish = async () => {
    const minutes = Math.max(1, Math.min(1440, parseInt(durationOverride) || 1));
    setIsSubmitting(true);

    try {
      await apiClient.post(`/userinterests/${step.goalId}/plan/${step.stepId}/complete`, {
        durationMinutes: minutes,
      });
    } catch (error) {
      console.error('Ошибка завершения шага:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось завершить шаг.');
      setIsSubmitting(false);
      return;
    }

    localStorage.removeItem(sessionKey(step.stepId));

    // Шаг уже сохранен — заметку о настроении логируем отдельным, "не блокирующим" вызовом
    const note = [moodNote.trim(), confusionNote.trim() && `Что было непонятно: ${confusionNote.trim()}`]
      .filter(Boolean)
      .join('\n\n') || 'Без заметки';

    try {
      await apiClient.post('/moods', { score: parseInt(moodScore), note });
      toast.success('Сессия завершена, шаг и настроение записаны!');
    } catch (error) {
      console.error('Ошибка записи настроения:', error);
      toast.error(getApiErrorMessage(error) || 'Шаг сохранен, но не удалось записать настроение.');
    }

    setIsSubmitting(false);
    onCompleted();
  };

  return (
    <div className="mt-4 p-4 bg-white/70 border border-purple-200 rounded-xl">
      <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
        🎯 {step.goalTitle}
      </span>
      <p className="font-bold text-gray-800 mt-1">{step.title}</p>
      {step.description && <p className="text-sm text-gray-600 mt-1">{step.description}</p>}

      {sessionState === 'idle' && (
        <button
          onClick={handleStart}
          className="mt-3 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Play size={16} />
          Начать
        </button>
      )}

      {sessionState === 'active' && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-bold text-purple-700">{formatElapsed(elapsedSec)}</span>
          <button
            onClick={handleFinishClick}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <Square size={14} />
            Закончить
          </button>
          <button onClick={handleCancel} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            Отмена
          </button>
        </div>
      )}

      {sessionState === 'finishing' && (
        <div className="mt-3 space-y-3 bg-white p-4 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-800">Как прошла сессия?</h4>
            <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600" aria-label="Отменить">
              <X size={16} />
            </button>
          </div>

          <label className="text-sm text-gray-600 flex items-center gap-2">
            Потрачено минут:
            <input
              type="number"
              min="1"
              max="1440"
              value={durationOverride}
              onChange={(e) => setDurationOverride(e.target.value)}
              className="w-20 border p-1.5 rounded-lg"
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Настроение (1-5):</label>
            <input
              type="number"
              min="1"
              max="5"
              value={moodScore}
              onChange={(e) => setMoodScore(e.target.value)}
              className="w-16 border p-1.5 rounded-lg"
            />
          </div>

          <input
            type="text"
            placeholder="Короткая заметка о настроении (необязательно)"
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm"
          />

          <textarea
            placeholder="Что было непонятно во время занятия? (необязательно — учтем в следующем совете)"
            value={confusionNote}
            onChange={(e) => setConfusionNote(e.target.value)}
            rows={2}
            className="w-full border p-2 rounded-lg text-sm resize-none"
          />

          <button
            onClick={handleSubmitFinish}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors ${
              isSubmitting ? 'bg-purple-300 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <CheckCircle2 size={16} />
            {isSubmitting ? 'Сохраняю...' : 'Готово'}
          </button>
        </div>
      )}
    </div>
  );
};
