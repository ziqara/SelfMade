import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { OnboardingPage } from './OnboardingPage';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import { DaySessionCard } from '../components/DaySessionCard';
import { DailyCheckinModal } from '../components/DailyCheckinModal';
import type { Category, Activity, Mood, DailyInsightResponse, PendingStep } from '../types';

export const DashboardPage = () => {
  const { profile, fetchProfile, isLoading } = useAuthStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [duration, setDuration] = useState('60');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showFreeformActivity, setShowFreeformActivity] = useState(false);
  const [checkinDismissed, setCheckinDismissed] = useState(false);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pendingSteps, setPendingSteps] = useState<PendingStep[]>([]);

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

  const loadPendingSteps = async () => {
    try {
      const response = await apiClient.get<PendingStep[]>('/analytics/pending-steps');
      setPendingSteps(response.data);
    } catch (error) {
      console.error('Ошибка загрузки шагов плана:', error);
    }
  };

  useEffect(() => {
    // Эти функции переиспользуются после сабмита форм, а не только на маунте, поэтому определены на уровне компонента
    /* eslint-disable react-hooks/set-state-in-effect */
    fetchProfile();
    loadDashboardData();
    loadCachedInsight();
    loadPendingSteps();
    /* eslint-enable react-hooks/set-state-in-effect */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

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

  const handleSessionFinished = () => {
    loadPendingSteps();
    loadDashboardData();
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
        <div className="h-9 w-72 bg-surface-2 rounded" />
        <div className="h-48 bg-surface-2 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-56 bg-surface-2 rounded-xl" />
          <div className="h-32 bg-surface-2 rounded-xl" />
        </div>
      </div>
    );
  }
  if (!profile) return <OnboardingPage />;

  const todayDateString = new Date().toLocaleDateString();
  const todayActivities = activities.filter(a => new Date(a.createdAt).toLocaleDateString() === todayDateString);
  const todayMoods = moods.filter(m => new Date(m.createdAt).toLocaleDateString() === todayDateString);

  // Разовый вопрос "как прошел день" — если сегодня еще ни одной заметки настроения не было
  const showDailyCheckin = todayMoods.length === 0 && !checkinDismissed;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {showDailyCheckin && (
        <DailyCheckinModal
          onDone={() => { setCheckinDismissed(true); loadDashboardData(); }}
          onSkip={() => setCheckinDismissed(true)}
        />
      )}

      <h1 className="heading-caps text-2xl font-light text-text mb-2">С возвращением</h1>

      {/* ИИ: план на вечер + сессия развития — один общий блок на всю ширину */}
      <div className="rounded-2xl border border-brand/20 bg-surface/60 backdrop-blur-2xl shadow-lg shadow-black/20 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="heading-caps text-sm font-medium text-brand-light">Твой план на вечер</h2>
            <button
              onClick={handleGetInsight}
              disabled={isAiLoading}
              className={`text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors ${
                isAiLoading ? 'bg-brand/40 cursor-wait' : 'bg-gradient-to-r from-brand to-brand-dark hover:brightness-110'
              }`}
            >
              {isAiLoading ? 'Анализирую день…' : aiInsight ? 'Обновить' : 'Получить совет от ИИ'}
            </button>
          </div>

          {aiInsight ? (
            <div className="whitespace-pre-wrap text-text/90 leading-relaxed font-light mt-4">{aiInsight}</div>
          ) : (
            <p className="text-text-muted font-light mt-4">
              Нажми «Получить совет от ИИ», чтобы узнать, чем заняться сегодня вечером.
            </p>
          )}

          <DaySessionCard pendingSteps={pendingSteps} freeTimeEnd={profile.freeTimeEnd} onFinished={handleSessionFinished} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Что-то вне плана */}
        <div className="bg-surface/60 backdrop-blur-2xl p-6 rounded-xl border border-border-subtle md:col-span-2">
          <button
            onClick={() => setShowFreeformActivity((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="heading-caps text-sm font-medium text-text">Занимался чем-то ещё вне плана?</h2>
            {showFreeformActivity ? <ChevronUp size={20} className="text-text-muted" /> : <ChevronDown size={20} className="text-text-muted" />}
          </button>

          {showFreeformActivity && (
            categories.length === 0 ? (
              <p className="text-red-400 font-light mt-4">Сначала создай категорию в разделе «Цели и Категории».</p>
            ) : (
              <form onSubmit={handleActivitySubmit} className="space-y-4 mt-4 max-w-xl">
                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border border-border-subtle bg-surface-2 text-text font-light p-3 rounded-lg">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" placeholder="Что делал?" value={activityTitle} onChange={e => setActivityTitle(e.target.value)} className="w-full border border-border-subtle bg-surface-2 text-text placeholder-text-muted font-light p-3 rounded-lg" required />
                <div className="flex items-center gap-4">
                  <label className="text-text-muted font-light">Минут:</label>
                  <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="border border-border-subtle bg-surface-2 text-text font-light p-2 w-24 rounded-lg" />
                </div>
                <button type="submit" className="w-full bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-500 transition-colors">Добавить активность</button>
              </form>
            )
          )}
        </div>

        {/* Прогресс */}
        <div className="md:col-span-2">
          <div className="bg-surface/60 backdrop-blur-2xl p-6 rounded-xl border border-border-subtle shadow-sm">
            <h3 className="heading-caps text-sm font-medium text-text mb-4">Прогресс за сегодня</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-light">
                <span className="text-text-muted">Задач выполнено</span>
                <span className="font-medium text-green-400">{todayActivities.length}</span>
              </div>
              <div className="flex justify-between text-sm font-light">
                <span className="text-text-muted">Заметок настроения</span>
                <span className="font-medium text-blue-400">{todayMoods.length}</span>
              </div>
              <div className="flex justify-between text-sm font-light pt-2 border-t border-border-subtle">
                <span className="text-text-muted">Потрачено минут</span>
                <span className="font-medium text-text">{todayActivities.reduce((acc, curr) => acc + curr.durationMinutes, 0)} мин</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
