import { useEffect, useState } from 'react';
import { ListChecks, Smile, FolderOpen } from 'lucide-react';
import { apiClient } from '../api/client';
import type { Activity, Mood } from '../types';

const moodColor = (score: number) =>
  score >= 4 ? 'bg-green-400' : score === 3 ? 'bg-amber-400' : 'bg-red-400';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [actRes, moodRes] = await Promise.all([
          apiClient.get<Activity[]>('/activities/my'),
          apiClient.get<Mood[]>('/moods/my'),
        ]);

        // Сортируем от новых к старым (по дате создания)
        const sortedActivities = actRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const sortedMoods = moodRes.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setActivities(sortedActivities);
        setMoods(sortedMoods);
      } catch (error) {
        console.error('Ошибка загрузки истории:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-xl shadow-sm p-8 border border-border-subtle animate-pulse">
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
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-xl shadow-sm p-8 border border-border-subtle">
      <h1 className="heading-caps text-2xl font-light text-text mb-8">История прогресса</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

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
                    <h3 className="font-medium text-lg text-text">{act.title}</h3>
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
    </div>
  );
};
