import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { Activity, Mood } from '../types';

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
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-gray-100 rounded-xl" />
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-100 rounded-xl" />
            <div className="h-24 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8">История прогресса ⏳</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Колонка 1: История активностей */}
        <div>
          <h2 className="text-2xl font-bold text-green-700 mb-6 flex items-center gap-2">
            📝 Выполненные задачи
          </h2>

          {activities.length === 0 ? (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">История задач пока пуста.</p>
          ) : (
            <div className="space-y-4">
              {activities.map(act => (
                <div key={act.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{act.title}</h3>
                    <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-sm">
                      {act.durationMinutes} мин
                    </span>
                  </div>
                  {act.description && (
                    <p className="text-gray-600 text-sm mb-3">{act.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                      📂 {act.categoryName ?? 'Без категории'}
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
          <h2 className="text-2xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            🧠 Дневник настроения
          </h2>

          {moods.length === 0 ? (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">Дневник настроения пуст.</p>
          ) : (
            <div className="space-y-4">
              {moods.map(mood => (
                <div key={mood.id} className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-3xl" title={`Оценка: ${mood.score} из 5`}>
                      {/* Простая визуализация оценки с помощью эмодзи */}
                      {mood.score === 5 ? '🤩' : mood.score === 4 ? '🙂' : mood.score === 3 ? '😐' : mood.score === 2 ? '☹️' : '😫'}
                      <span className="text-sm font-bold text-blue-800 ml-2">{mood.score}/5</span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(mood.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 bg-white p-3 rounded-lg border border-blue-50">
                    «{mood.note}»
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
