import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { OnboardingPage } from './OnboardingPage';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import { NextStepCard } from '../components/NextStepCard';
import type { Category, Activity, Mood, DailyInsightResponse, NextStep } from '../types';

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
  const [showFreeformActivity, setShowFreeformActivity] = useState(false);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [nextStep, setNextStep] = useState<NextStep | null>(null);

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

  const loadNextStep = async () => {
    try {
      const response = await apiClient.get<NextStep | null>('/analytics/next-step');
      setNextStep(response.data);
    } catch (error) {
      console.error('Ошибка загрузки следующего шага плана:', error);
    }
  };

  useEffect(() => {
    // Эти функции переиспользуются после сабмита форм, а не только на маунте, поэтому определены на уровне компонента
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchProfile();
    loadDashboardData();
    loadCachedInsight();
    loadNextStep();
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
      toast.error(getApiErrorMessage(error) || 'Не удалось сохранить настроение.');
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
      toast.error(getApiErrorMessage(error) || 'Не удалось сохранить активность.');
    }
  };

  const handleGetInsight = async () => {
    setIsAiLoading(true);
    try {
      const response = await apiClient.post<DailyInsightResponse>('/analytics/daily');
      setAiInsight(response.data.insight);
    } catch (error) {
      console.error('Ошибка получения совета от ИИ:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось получить совет от ИИ.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleStepCompleted = () => {
    loadNextStep();
    loadDashboardData();
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-9 w-72 bg-gray-200 rounded" />
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-56 bg-gray-100 rounded-xl" />
          <div className="h-32 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }
  if (!profile) return <OnboardingPage />;

  const todayDateString = new Date().toLocaleDateString();
  const todayActivities = activities.filter(a => new Date(a.createdAt).toLocaleDateString() === todayDateString);
  const todayMoods = moods.filter(m => new Date(m.createdAt).toLocaleDateString() === todayDateString);

  // Форму "другая активность" прячем по умолчанию, если есть шаг плана — чтобы не отвлекать
  // от основного сценария "выполнил шаг -> отметил". Без активного плана она открыта сразу.
  const isFreeformActivityVisible = !nextStep || showFreeformActivity;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-2">С возвращением! 👋</h1>

      {/* ИИ: план на вечер + следующий шаг — один общий блок на всю ширину */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-purple-900">✨ Твой план на вечер</h2>
            <button
              onClick={handleGetInsight}
              disabled={isAiLoading}
              className={`text-sm font-bold px-4 py-2 rounded-lg text-white transition-colors ${
                isAiLoading ? 'bg-purple-300 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isAiLoading ? 'Анализирую день...' : aiInsight ? 'Обновить' : 'Получить совет от ИИ'}
            </button>
          </div>

          {aiInsight ? (
            <div className="whitespace-pre-wrap text-gray-800 leading-relaxed mt-4">{aiInsight}</div>
          ) : (
            <p className="text-purple-700 mt-4">
              Нажми «Получить совет от ИИ», чтобы узнать, чем заняться сегодня вечером.
            </p>
          )}

          {nextStep && <NextStepCard key={nextStep.stepId} step={nextStep} onCompleted={handleStepCompleted} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Итоги дня */}
        <div className="space-y-6">
          {/* Пока есть активный шаг плана — настроение спрашиваем в конце сессии (см. NextStepCard),
              а не отдельной формой, чтобы не задавать один и тот же вопрос дважды */}
          {!nextStep && (
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
          )}

          <div className="bg-green-50 p-6 rounded-xl border border-green-100">
            {nextStep && (
              <button
                onClick={() => setShowFreeformActivity((v) => !v)}
                className="w-full flex items-center justify-between text-left"
              >
                <h2 className="text-xl font-bold text-green-900">Занимался чем-то ещё?</h2>
                {isFreeformActivityVisible ? <ChevronUp size={20} className="text-green-700" /> : <ChevronDown size={20} className="text-green-700" />}
              </button>
            )}
            {!nextStep && <h2 className="text-xl font-bold mb-4 text-green-900">Что сделал полезного?</h2>}

            {isFreeformActivityVisible && (
              categories.length === 0 ? (
                <p className="text-red-500 mt-4">Сначала создай категорию в разделе "Цели и Категории"!</p>
              ) : (
                <form onSubmit={handleActivitySubmit} className="space-y-4 mt-4">
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
              )
            )}
          </div>
        </div>

        {/* Прогресс */}
        <div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
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
