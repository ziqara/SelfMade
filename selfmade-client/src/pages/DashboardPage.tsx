import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { OnboardingPage } from './OnboardingPage';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import { DaySessionCard } from '../components/DaySessionCard';
import { DailyCheckinModal } from '../components/DailyCheckinModal';
import type { Category, Activity, Mood, DailyInsightResponse, PendingStep } from '../types';

// На случай, если ИИ все же вставит markdown-символы вопреки инструкции в промпте — подчищаем на фронте
const stripMarkdown = (text: string) => text.replace(/\*\*/g, '').replace(/`/g, '').replace(/^#+\s*/gm, '');

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
  const [showProgress, setShowProgress] = useState(false);
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-2xl space-y-4 animate-pulse">
          <div className="h-64 bg-surface-2/60 rounded-2xl" />
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {showDailyCheckin && (
        <DailyCheckinModal
          onDone={() => { setCheckinDismissed(true); loadDashboardData(); }}
          onSkip={() => setCheckinDismissed(true)}
        />
      )}

      {/* Единственный главный элемент экрана: ИИ-ассистент */}
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-brand/20 bg-surface/60 backdrop-blur-2xl shadow-2xl shadow-black/30 overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-1">
              <h1 className="heading-caps text-xs font-medium text-brand-light">Твой план на вечер</h1>
              <button
                onClick={handleGetInsight}
                disabled={isAiLoading}
                className={`text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors ${
                  isAiLoading ? 'bg-brand/40 cursor-wait' : 'bg-linear-to-r from-brand to-brand-dark hover:brightness-110'
                }`}
              >
                {isAiLoading ? 'Анализирую день…' : aiInsight ? 'Обновить' : 'Получить совет от ИИ'}
              </button>
            </div>

            {aiInsight ? (
              <div className="max-h-80 overflow-y-auto pr-1 mt-4">
                <div className="whitespace-pre-wrap text-text/90 leading-relaxed font-light">{stripMarkdown(aiInsight)}</div>
              </div>
            ) : (
              <p className="text-text-muted font-light mt-4">
                Нажми «Получить совет от ИИ», чтобы узнать, чем заняться сегодня вечером.
              </p>
            )}

            <DaySessionCard pendingSteps={pendingSteps} categories={categories} freeTimeEnd={profile.freeTimeEnd} onFinished={handleSessionFinished} />
          </div>
        </div>

        {/* Второстепенное — скромно и компактно под главным экраном, не отвлекает от ИИ */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => setShowProgress((v) => !v)}
            className="w-full flex items-center justify-between text-left text-text-muted hover:text-text transition-colors px-1"
          >
            <span className="heading-caps text-xs font-medium">Прогресс и другая активность</span>
            {showProgress ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showProgress && (
            <div className="space-y-4">
              <div className="bg-surface/50 backdrop-blur-2xl p-5 rounded-xl border border-border-subtle">
                <div className="flex justify-between text-sm font-light">
                  <span className="text-text-muted">Задач выполнено</span>
                  <span className="font-medium text-green-400">{todayActivities.length}</span>
                </div>
                <div className="flex justify-between text-sm font-light mt-2">
                  <span className="text-text-muted">Заметок настроения</span>
                  <span className="font-medium text-blue-400">{todayMoods.length}</span>
                </div>
                <div className="flex justify-between text-sm font-light mt-2 pt-2 border-t border-border-subtle">
                  <span className="text-text-muted">Потрачено минут</span>
                  <span className="font-medium text-text">{todayActivities.reduce((acc, curr) => acc + curr.durationMinutes, 0)} мин</span>
                </div>
              </div>

              <div className="bg-surface/50 backdrop-blur-2xl p-5 rounded-xl border border-border-subtle">
                <button
                  onClick={() => setShowFreeformActivity((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="heading-caps text-xs font-medium text-text">Занимался чем-то ещё вне плана?</span>
                  {showFreeformActivity ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
                </button>

                {showFreeformActivity && (
                  categories.length === 0 ? (
                    <p className="text-red-400 font-light text-sm mt-4">Сначала создай категорию в разделе «Цели и Категории».</p>
                  ) : (
                    <form onSubmit={handleActivitySubmit} className="space-y-3 mt-4">
                      <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border border-border-subtle bg-surface-2 text-text font-light text-sm p-2.5 rounded-lg">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <input type="text" placeholder="Что делал?" value={activityTitle} onChange={e => setActivityTitle(e.target.value)} className="w-full border border-border-subtle bg-surface-2 text-text placeholder-text-muted font-light text-sm p-2.5 rounded-lg" required />
                      <div className="flex items-center gap-4">
                        <label className="text-text-muted font-light text-sm">Минут:</label>
                        <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="border border-border-subtle bg-surface-2 text-text font-light text-sm p-2 w-24 rounded-lg" />
                      </div>
                      <button type="submit" className="w-full bg-green-600 text-white p-2.5 rounded-lg font-medium text-sm hover:bg-green-500 transition-colors">Добавить активность</button>
                    </form>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
