import { useEffect, useState } from 'react';
import { Play, Square, CheckCircle2, X, Coffee } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import type { Category, PendingStep } from '../types';

interface DaySessionCardProps {
  pendingSteps: PendingStep[];
  categories: Category[];
  freeTimeEnd?: string; // "HH:mm:ss"
  onFinished: () => void;
}

type SessionState = 'idle' | 'active' | 'finishing';

const SESSION_KEY = 'selfmade_day_session';
const REST_NUDGE_AFTER_SEC = 90 * 60; // мягкое напоминание про отдых после 90 минут подряд

const formatElapsed = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

const isPastTimeOfDay = (hhmmss: string) => {
  const parts = hhmmss.split(':').map(Number);
  if (parts.length < 2 || parts.some(Number.isNaN)) return false;
  const target = new Date();
  target.setHours(parts[0], parts[1], 0, 0);
  return Date.now() > target.getTime();
};

const MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12 часов — дольше явно забытая вкладка, а не реальная сессия

// Сессия "дневная" по смыслу — если она стартовала вчера (или раньше) или идет
// подозрительно долго, это забытая вкладка, а не реальная работа. Читаем localStorage
// и сразу же чистим протухшую запись, чтобы дашборд не показывал зависший таймер.
const readActiveSession = (): number | null => {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return null;

  const startedAt = parseInt(saved);
  const startedOnDifferentDay = new Date(startedAt).toDateString() !== new Date().toDateString();
  const tooLong = Date.now() - startedAt > MAX_SESSION_MS;

  if (startedOnDifferentDay || tooLong) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  return startedAt;
};

// Одна кнопка "Начать/Закончить развиваться" на весь день вместо таймера на каждый шаг.
// Во время сессии шаги плана отмечаются чек-листом, а настроение и рефлексия спрашиваются один раз, в конце.
export const DaySessionCard = ({ pendingSteps, categories, freeTimeEnd, onFinished }: DaySessionCardProps) => {
  const [startedAt, setStartedAt] = useState<number | null>(() => readActiveSession());
  const [sessionState, setSessionState] = useState<SessionState>(() =>
    readActiveSession() !== null ? 'active' : 'idle'
  );
  const [elapsedSec, setElapsedSec] = useState(0);
  const [durationOverride, setDurationOverride] = useState('');
  const [checkedThisSession, setCheckedThisSession] = useState<Set<number>>(new Set());
  const [moodScore, setMoodScore] = useState('5');
  const [reflectionNote, setReflectionNote] = useState('');
  const [fallbackCategoryId, setFallbackCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionState !== 'active' || startedAt === null) return;
    const tick = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionState, startedAt]);

  const resetSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionState('idle');
    setStartedAt(null);
    setElapsedSec(0);
    setCheckedThisSession(new Set());
    setMoodScore('5');
    setReflectionNote('');
    setFallbackCategoryId('');
  };

  const handleStart = () => {
    const now = Date.now();
    localStorage.setItem(SESSION_KEY, String(now));
    setStartedAt(now);
    setElapsedSec(0);
    setCheckedThisSession(new Set());
    setSessionState('active');
  };

  const handleCancel = async () => {
    // Отмена — это отмена всего: если во время сессии успели отметить шаги плана,
    // они уже улетели на сервер как выполненные (тоггл шлется сразу при клике на чекбокс).
    // Откатываем их обратно, иначе "Отмена" будет молча оставлять что-то сохраненным.
    const toRevert = pendingSteps.filter((s) => checkedThisSession.has(s.stepId));
    resetSession();

    for (const step of toRevert) {
      try {
        await apiClient.post(`/userinterests/${step.goalId}/plan/${step.stepId}/toggle`);
      } catch (error) {
        console.error('Ошибка отката шага при отмене сессии:', error);
      }
    }

    if (toRevert.length > 0) {
      onFinished(); // обновляем список шагов/активностей — состояние на сервере изменилось
    }
  };

  const handleFinishClick = () => {
    setDurationOverride(String(Math.max(1, Math.round(elapsedSec / 60))));
    if (!fallbackCategoryId && categories.length > 0) {
      setFallbackCategoryId(categories[0].id.toString());
    }
    setSessionState('finishing');
  };

  const handleToggleStep = async (step: PendingStep) => {
    const wasChecked = checkedThisSession.has(step.stepId);
    setCheckedThisSession((prev) => {
      const next = new Set(prev);
      if (wasChecked) next.delete(step.stepId); else next.add(step.stepId);
      return next;
    });

    try {
      await apiClient.post(`/userinterests/${step.goalId}/plan/${step.stepId}/toggle`);
    } catch (error) {
      console.error('Ошибка отметки шага:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось отметить шаг.');
      setCheckedThisSession((prev) => {
        const next = new Set(prev);
        if (wasChecked) next.add(step.stepId); else next.delete(step.stepId);
        return next;
      });
    }
  };

  const handleSubmitFinish = async () => {
    const minutes = Math.max(1, Math.min(1440, parseInt(durationOverride) || 1));
    setIsSubmitting(true);

    const completedSteps = pendingSteps.filter((s) => checkedThisSession.has(s.stepId));
    const categoryId = completedSteps.length > 0 ? completedSteps[0].categoryId : parseInt(fallbackCategoryId);

    if (!categoryId) {
      toast.error('Выбери категорию для сессии, чтобы её можно было записать.');
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient.post('/activities', {
        categoryId,
        title: completedSteps.length === 0
          ? 'Сессия развития'
          : completedSteps.length === 1
            ? completedSteps[0].title
            : `Сессия развития (${completedSteps.length} шага)`,
        description: completedSteps.map((s) => `- ${s.title}`).join('\n'),
        durationMinutes: minutes,
      });
    } catch (error) {
      console.error('Ошибка записи активности сессии:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось записать активность сессии.');
    }

    try {
      await apiClient.post('/moods', { score: parseInt(moodScore), note: reflectionNote.trim() || 'Без заметки' });
    } catch (error) {
      console.error('Ошибка записи настроения:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось записать настроение.');
    }

    toast.success('Сессия завершена!');
    resetSession();
    onFinished();
  };

  const showRestNudge = sessionState === 'active' && elapsedSec >= REST_NUDGE_AFTER_SEC;
  const pastFreeTime = sessionState === 'active' && !!freeTimeEnd && isPastTimeOfDay(freeTimeEnd);
  const completedCount = pendingSteps.filter((s) => checkedThisSession.has(s.stepId)).length;

  return (
    <div className="mt-4 p-4 bg-surface/60 border border-brand/20 rounded-xl">
      {sessionState === 'idle' && (
        <>
          <p className="text-sm text-text-muted mb-3">
            {pendingSteps.length > 0
              ? `В плане ${pendingSteps.length} невыполненных шагов. Начни сессию, чтобы отмечать их по пути.`
              : 'Активных шагов плана нет, но можно просто начать сессию и записать, чем занимался.'}
          </p>
          <button
            onClick={handleStart}
            className="flex items-center gap-2 bg-linear-to-r from-brand to-brand-dark hover:brightness-110 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
          >
            <Play size={16} />
            Начать развиваться
          </button>
        </>
      )}

      {sessionState === 'active' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-lg font-bold text-brand-light">{formatElapsed(elapsedSec)}</span>
            <button
              onClick={handleFinishClick}
              className="flex items-center gap-2 bg-linear-to-r from-brand to-brand-dark hover:brightness-110 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
            >
              <Square size={14} />
              Закончить развиваться
            </button>
            <button onClick={handleCancel} className="text-sm text-text-muted hover:text-text transition-colors">
              Отмена
            </button>
          </div>

          {(showRestNudge || pastFreeTime) && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm rounded-lg p-3">
              <Coffee size={16} className="shrink-0 mt-0.5" />
              <span>
                {pastFreeTime
                  ? 'Твое свободное время по расписанию уже закончилось — не забудь про план восстановления выше.'
                  : 'Ты в процессе уже больше полутора часов подряд — самое время сделать паузу.'}
              </span>
            </div>
          )}

          {pendingSteps.length > 0 && (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {pendingSteps.map((step) => (
                <li key={step.stepId} className="flex items-start gap-2 bg-surface-2 border border-border-subtle rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={checkedThisSession.has(step.stepId)}
                    onChange={() => handleToggleStep(step)}
                    className="mt-1 w-4 h-4 rounded text-brand shrink-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-[10px] font-medium text-brand-light/80 uppercase tracking-wide">{step.goalTitle}</span>
                    <p className={`font-medium text-sm ${checkedThisSession.has(step.stepId) ? 'text-text-muted line-through' : 'text-text'}`}>
                      {step.title}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sessionState === 'finishing' && (
        <div className="space-y-3 bg-surface-2 p-4 rounded-lg border border-border-subtle">
          <div className="flex items-center justify-between">
            <h4 className="heading-caps text-sm font-medium text-text">Как прошла сессия?</h4>
            <button onClick={handleCancel} className="text-text-muted hover:text-text" aria-label="Отменить">
              <X size={16} />
            </button>
          </div>

          {completedCount > 0 ? (
            <p className="text-sm text-green-300 bg-green-500/10 border border-green-500/20 rounded-lg p-2">
              Отмечено выполненными: {completedCount} {completedCount === 1 ? 'шаг' : 'шага'}
            </p>
          ) : categories.length > 0 ? (
            <label className="text-sm text-text-muted flex items-center gap-2">
              Категория:
              <select
                value={fallbackCategoryId}
                onChange={(e) => setFallbackCategoryId(e.target.value)}
                className="flex-1 border border-border-subtle bg-surface text-text text-sm p-1.5 rounded-lg"
              >
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          ) : (
            <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
              Нет ни одной категории — сессия сохранится только как заметка настроения. Категории можно создать во вкладке «Цели и категории».
            </p>
          )}

          <label className="text-sm text-text-muted flex items-center gap-2">
            Потрачено минут:
            <input
              type="number"
              min="1"
              max="1440"
              value={durationOverride}
              onChange={(e) => setDurationOverride(e.target.value)}
              className="w-20 border border-border-subtle bg-surface text-text p-1.5 rounded-lg"
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="text-sm text-text-muted">Настроение (1-5):</label>
            <input
              type="number"
              min="1"
              max="5"
              value={moodScore}
              onChange={(e) => setMoodScore(e.target.value)}
              className="w-16 border border-border-subtle bg-surface text-text p-1.5 rounded-lg"
            />
          </div>

          <textarea
            placeholder="Как прошло? Что делал, что было непонятно (необязательно)"
            value={reflectionNote}
            onChange={(e) => setReflectionNote(e.target.value)}
            rows={3}
            className="w-full border border-border-subtle bg-surface text-text placeholder-text-muted p-2 rounded-lg text-sm resize-none"
          />

          <button
            onClick={handleSubmitFinish}
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              isSubmitting ? 'bg-brand/40 cursor-wait' : 'bg-linear-to-r from-brand to-brand-dark hover:brightness-110'
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
