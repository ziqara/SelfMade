import { useEffect, useMemo, useState } from 'react';
import { ListChecks, Smile, FolderOpen, GraduationCap, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../api/client';
import { moodColor } from '../utils/moodColor';
import { toDateKey } from '../utils/date';
import { HistoryCalendar } from '../components/HistoryCalendar';
import { GoalProgressRing } from '../components/GoalProgressRing';
import type { Activity, Mood, UserSummary } from '../types';

const MoodDots = ({ score }: { score: number }) => (
  <div className="flex items-center gap-1.5" title={`Оценка: ${score} из 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span
        key={n}
        className={`w-2 h-2 rounded-full ${n <= score ? moodColor(score) : 'bg-border-subtle'}`}
      />
    ))}
  </div>
);

export const HistoryPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [actRes, moodRes, summaryRes] = await Promise.all([
          apiClient.get<Activity[]>('/activities/my'),
          apiClient.get<Mood[]>('/moods/my'),
          apiClient.get<UserSummary>('/analytics/summary'),
        ]);

        // Сортируем от новых к старым (по дате создания)
        const sortedActivities = actRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const sortedMoods = moodRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setActivities(sortedActivities);
        setMoods(sortedMoods);
        setSummary(summaryRes.data);
      } catch (error) {
        console.error('Ошибка загрузки истории:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const selectedDayActivities = useMemo(
    () => (selectedDate ? activities.filter((a) => toDateKey(new Date(a.createdAt)) === selectedDate) : []),
    [activities, selectedDate]
  );
  const selectedDayMoods = useMemo(
    () => (selectedDate ? moods.filter((m) => toDateKey(new Date(m.createdAt)) === selectedDate) : []),
    [moods, selectedDate]
  );

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-xl shadow-sm p-8 border border-border-subtle animate-pulse">
        <div className="h-8 w-64 bg-surface-2 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="h-24 bg-surface-2 rounded-xl" />
            <div className="h-24 bg-surface-2 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-surface-2 rounded-xl" />
            <div className="h-24 bg-surface-2 rounded-xl" />
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
    <div className="w-full max-w-6xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-xl shadow-sm p-8 border border-border-subtle">
      <h1 className="heading-caps text-2xl font-light text-text mb-8">История прогресса</h1>

      {summary && summary.goalsProgress.length > 0 && (
        <div className="mb-10">
          <h2 className="heading-caps text-sm font-medium text-rose-300 mb-4">Прогресс по целям</h2>
          <div className="flex flex-wrap gap-6">
            {summary.goalsProgress.map((g) => (
              <GoalProgressRing key={g.goalId} title={g.goalTitle} completed={g.completedSteps} total={g.totalSteps} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <div className="bg-surface-2/50 border border-border-subtle rounded-xl p-5">
          <HistoryCalendar activities={activities} moods={moods} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        {selectedDate ? (
          <div className="bg-surface-2/50 border border-border-subtle rounded-xl p-5">
            <h2 className="heading-caps text-sm font-medium text-text mb-4">
              {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            {selectedDayMoods.length === 0 && selectedDayActivities.length === 0 ? (
              <p className="text-text-muted font-light text-sm">В этот день записей нет.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayMoods.map((mood) => (
                  <div key={mood.id} className="bg-surface p-3 rounded-lg border border-border-subtle">
                    <MoodDots score={mood.score} />
                    <p className="text-text-muted font-light text-sm mt-2 whitespace-pre-wrap">{mood.note}</p>
                  </div>
                ))}
                {selectedDayActivities.map((act) => (
                  <div key={act.id} className="bg-surface p-3 rounded-lg border border-border-subtle">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium text-sm text-text">{act.title}</span>
                      <span className="text-xs text-green-300 bg-green-500/15 px-2 py-0.5 rounded-full shrink-0">{act.durationMinutes} мин</span>
                    </div>
                    <span className="text-xs text-text-muted">{act.categoryName ?? 'Без категории'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-2/50 border border-border-subtle rounded-xl p-5">
            <h2 className="heading-caps text-sm font-medium text-text mb-4 flex items-center gap-2">
              <GraduationCap size={15} className="text-brand-light" />
              Чему ты научился
            </h2>

            {summary && (summary.totalActivities > 0 || summary.achievements.length > 0) ? (
              <>
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <div className="font-medium text-text">{summary.totalActivities}</div>
                    <div className="text-text-muted font-light text-xs">задач выполнено</div>
                  </div>
                  <div>
                    <div className="font-medium text-text">{Math.round(summary.totalMinutes / 60)}</div>
                    <div className="text-text-muted font-light text-xs">часов вложено</div>
                  </div>
                  <div>
                    <div className="font-medium text-text">{summary.achievements.length}</div>
                    <div className="text-text-muted font-light text-xs">шагов плана закрыто</div>
                  </div>
                </div>

                {summary.achievements.length > 0 && (
                  <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {summary.achievements.map((a, i) => (
                      <li key={i} className="text-sm bg-surface p-2.5 rounded-lg border border-border-subtle">
                        <span className="text-text font-light">{a.title}</span>
                        <span className="block text-xs text-text-muted mt-0.5">{a.goalTitle}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p className="text-text-muted font-light text-sm">
                Пока рано подводить итоги — отметь несколько шагов плана или задач, и здесь появится сводка.
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowFullHistory((v) => !v)}
        className="w-full flex items-center justify-between text-left text-text-muted hover:text-text transition-colors border-t border-border-subtle pt-5"
      >
        <span className="heading-caps text-xs font-medium">Полный список записей</span>
        {showFullHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showFullHistory && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-5">

        {/* Колонка 1: История активностей */}
        <div>
          <h2 className="heading-caps text-sm font-medium text-green-400 mb-6 flex items-center gap-2">
            <ListChecks size={16} />
            Выполненные задачи
          </h2>

          {activities.length === 0 ? (
            <p className="text-text-muted font-light bg-surface-2 p-4 rounded-lg">История задач пока пуста.</p>
          ) : (
            <div className="space-y-4">
              {activities.map(act => (
                <div key={act.id} className="bg-surface-2 p-5 rounded-xl border border-border-subtle shadow-sm hover:border-brand/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm text-text">{act.title}</h3>
                    <span className="bg-green-500/15 text-green-300 font-medium px-3 py-1 rounded-full text-sm shrink-0">
                      {act.durationMinutes} мин
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-text-muted font-light text-sm mb-3 whitespace-pre-wrap">{act.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-text-muted mt-4 pt-3 border-t border-border-subtle">
                    <span className="flex items-center gap-1.5 bg-surface px-2 py-1 rounded text-text-muted">
                      <FolderOpen size={13} />
                      {act.categoryName ?? 'Без категории'}
                    </span>
                    <span>
                      {new Date(act.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Колонка 2: История настроения */}
        <div>
          <h2 className="heading-caps text-sm font-medium text-blue-400 mb-6 flex items-center gap-2">
            <Smile size={16} />
            Дневник настроения
          </h2>

          {moods.length === 0 ? (
            <p className="text-text-muted font-light bg-surface-2 p-4 rounded-lg">Дневник настроения пуст.</p>
          ) : (
            <div className="space-y-4">
              {moods.map(mood => (
                <div key={mood.id} className="bg-blue-500/10 p-5 rounded-xl border border-blue-500/20 shadow-sm hover:border-blue-400/40 transition-colors">
                  <div className="flex justify-between items-center mb-3">
                    <MoodDots score={mood.score} />
                    <span className="text-xs text-text-muted">
                      {new Date(mood.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-text-muted font-light bg-surface p-3 rounded-lg border border-border-subtle whitespace-pre-wrap">
                    {mood.note}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      )}
    </div>
    </div>
  );
};
