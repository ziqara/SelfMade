import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { OnboardingPage } from './OnboardingPage';
import { apiClient } from '../api/client';
import { toast } from '../store/toastStore';
import type { Category, Activity, Mood, DailyInsightResponse } from '../types';

export const DashboardPage = () => {
  const { profile, fetchProfile, isLoading } = useAuthStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [moodScore, setMoodScore] = useState('5');
  const [moodNote, setMoodNote] = useState('');

  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [duration, setDuration] = useState('60');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [catRes, actRes, moodRes] = await Promise.all([
        apiClient.get<Category[]>('/categories'),
        apiClient.get<Activity[]>('/activities/my'),
        apiClient.get<Mood[]>('/moods/my')
      ]);
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catRes.data[0].id.toString());
      }
      setActivities(actRes.data);
      setMoods(moodRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      toast.error('Не удалось загрузить данные дашборда.');
    } finally {
      setIsDataLoading(false);
    }
  };

  const loadCachedInsight = async () => {
    try {
      const response = await apiClient.get<DailyInsightResponse>('/analytics/daily');
      setAiInsight(response.data.insight);
    } catch (error) {
      console.error('Ошибка загрузки совета от ИИ:', error);
    }
  };

  useEffect(() => {
    // Эти функции переиспользуются после сабмита форм, а не только на маунте, поэтому определены на уровне компонента
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchProfile();
    loadDashboardData();
    loadCachedInsight();
    /* eslint-enable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/moods', { score: parseInt(moodScore), note: moodNote });
      setMoodNote('');
      toast.success('Настроение записано!');
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка сохранения настроения:', error);
      toast.error('Не удалось сохранить настроение.');
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/activities', {
        categoryId: parseInt(selectedCategoryId), title: activityTitle, description: activityDesc, durationMinutes: parseInt(duration)
      });
      setActivityTitle(''); setActivityDesc('');
      toast.success('Активность добавлена!');
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка сохранения активности:', error);
      toast.error('Не удалось сохранить активность.');
    }
  };

  const handleGetInsight = async () => {
    setIsAiLoading(true);
    try {
      const response = await apiClient.post<DailyInsightResponse>('/analytics/daily');
      setAiInsight(response.data.insight);
    } catch (error) {
      console.error('Ошибка получения совета от ИИ:', error);
      const message = isAxiosError(error) ? error.response?.data?.message : undefined;
      toast.error(message || 'Не удалось получить совет от ИИ.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-9 w-72 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="h-48 bg-gray-100 rounded-xl" />
            <div className="h-56 bg-gray-100 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="h-32 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!profile) return <OnboardingPage />;

  const todayDateString = new Date().toLocaleDateString();
  const todayActivities = activities.filter(a => new Date(a.createdAt).toLocaleDateString() === todayDateString);
  const todayMoods = moods.filter(m => new Date(m.createdAt).toLocaleDateString() === todayDateString);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">С возвращением! 👋</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Формы */}
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-xl font-bold mb-4 text-blue-900">Как настрой?</h2>
            <form onSubmit={handleMoodSubmit} className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Оценка (1-5):</label>
                <input type="number" min="1" max="5" value={moodScore} onChange={e => setMoodScore(e.target.value)} className="border p-2 w-20 rounded-lg" />
              </div>
              <input type="text" placeholder="Короткая заметка..." value={moodNote} onChange={e => setMoodNote(e.target.value)} className="w-full border p-3 rounded-lg" required />
              <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700">Записать настроение</button>
            </form>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            <h2 className="text-xl font-bold mb-4 text-green-900">Что сделал полезного?</h2>
            {categories.length === 0 ? (
              <p className="text-red-500">Сначала создай категорию в разделе "Цели и Категории"!</p>
            ) : (
              <form onSubmit={handleActivitySubmit} className="space-y-4">
                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" placeholder="Что делал?" value={activityTitle} onChange={e => setActivityTitle(e.target.value)} className="w-full border p-3 rounded-lg" required />
                <div className="flex items-center gap-4">
                  <label className="font-medium">Минут:</label>
                  <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="border p-2 w-24 rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700">Добавить активность</button>
              </form>
            )}
          </div>
        </div>

        {/* ИИ и Сводка */}
        <div className="space-y-6">
          <button
            onClick={handleGetInsight} disabled={isAiLoading}
            className={`w-full text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${isAiLoading ? 'bg-purple-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 hover:-translate-y-1'}`}
          >
            {isAiLoading ? '✨ Анализирую день...' : aiInsight ? '🔄 Обновить совет от ИИ' : '✨ Получить совет от ИИ на сегодня'}
          </button>

          {aiInsight && (
            <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl shadow-sm">
              <h3 className="font-bold text-purple-800 mb-3 text-lg">План на вечер:</h3>
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{aiInsight}</div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Прогресс за сегодня</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Задач выполнено:</span>
                <span className="font-bold text-green-600">{todayActivities.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Заметок настроения:</span>
                <span className="font-bold text-blue-600">{todayMoods.length}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Потрачено минут:</span>
                <span className="font-bold">{todayActivities.reduce((acc, curr) => acc + curr.durationMinutes, 0)} мин</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
