import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { OnboardingPage } from './OnboardingPage';
import { apiClient } from '../api/client';

// Информационные интерфейсы
interface Category {
  id: number;
  name: string;
  type: string;
}

interface Activity {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  createdAt: string;
}

interface Mood {
  id: number;
  score: number;
  note: string;
  createdAt: string;
}

interface UserInterest {
  id: number;
  categoryId: number;
  title: string;
  isDevelopmentGoal: boolean;
}

export const DashboardPage = () => {
  const { profile, fetchProfile, isLoading, logout } = useAuthStore();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  
  // Состояния для формы категории (НОВОЕ)
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryType, setCategoryType] = useState('Обучение');

  const [moodScore, setMoodScore] = useState('5');
  const [moodNote, setMoodNote] = useState('');

  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [duration, setDuration] = useState('60');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [interestTitle, setInterestTitle] = useState('');
  const [isDevGoal, setIsDevGoal] = useState(true);

  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [catRes, actRes, moodRes, intRes] = await Promise.all([
        apiClient.get<Category[]>('/categories'),
        apiClient.get<Activity[]>('/activities/my'),
        apiClient.get<Mood[]>('/moods/my'),
        apiClient.get<UserInterest[]>('/userinterests/my')
      ]);

      setCategories(catRes.data);
      if (catRes.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catRes.data[0].id.toString());
      }

      setActivities(actRes.data);
      setMoods(moodRes.data);
      setInterests(intRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  // ОБРАБОТЧИК: Создание категории (НОВОЕ)
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/categories', {
        name: categoryName,
        description: categoryDesc,
        type: categoryType
      });
      setCategoryName('');
      setCategoryDesc('');
      setCategoryType('Обучение');
      loadDashboardData(); // Обновляем списки категорий везде
      alert('Категория успешно создана!');
    } catch (error) {
      alert('Ошибка при создании категории');
    }
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/moods', { score: parseInt(moodScore), note: moodNote });
      setMoodNote('');
      loadDashboardData();
    } catch (error) {
      alert('Ошибка при сохранении настроения');
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/activities', {
        categoryId: parseInt(selectedCategoryId),
        title: activityTitle,
        description: activityDesc,
        durationMinutes: parseInt(duration)
      });
      setActivityTitle('');
      setActivityDesc('');
      loadDashboardData();
    } catch (error) {
      alert('Ошибка при сохранении активности');
    }
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/userinterests', {
        categoryId: parseInt(selectedCategoryId),
        title: interestTitle,
        isDevelopmentGoal: isDevGoal
      });
      setInterestTitle('');
      loadDashboardData();
    } catch (error) {
      alert('Ошибка при добавлении цели');
    }
  };

  const handleGetInsight = async () => {
    setIsAiLoading(true);
    try {
      const response = await apiClient.get('/analytics/daily');
      setAiInsight(response.data.insight);
    } catch (error) {
      console.error('Ошибка ИИ:', error);
      alert('Не удалось получить совет от ИИ.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) return <div className="p-10">Загрузка...</div>;
  if (!profile) return <OnboardingPage />;

  const todayDateString = new Date().toLocaleDateString();
  const todayActivities = activities.filter(a => new Date(a.createdAt).toLocaleDateString() === todayDateString);
  const todayMoods = moods.filter(m => new Date(m.createdAt).toLocaleDateString() === todayDateString);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6">
        
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold">Рабочий стол</h1>
          <button onClick={logout} className="text-red-500 font-semibold hover:underline">Выйти</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Левая колонка: Формы ввода */}
          <div className="space-y-6">

            {/* НОВЫЙ БЛОК: Форма создания категории */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-3 text-gray-700">1. Создать категорию</h2>
              <form onSubmit={handleCategorySubmit} className="space-y-3">
                <input type="text" placeholder="Название (напр. Программирование)" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full border p-2 rounded" required />
                <input type="text" placeholder="Описание (опционально)" value={categoryDesc} onChange={e => setCategoryDesc(e.target.value)} className="w-full border p-2 rounded" />
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Тип:</label>
                  <select value={categoryType} onChange={e => setCategoryType(e.target.value)} className="border p-2 rounded w-full bg-white">
                    <option value="Обучение">Обучение</option>
                    <option value="Спорт">Спорт</option>
                    <option value="Отдых">Отдых</option>
                    <option value="Работа">Работа</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>
                <button type="submit" className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-700">Создать</button>
              </form>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h2 className="text-xl font-bold mb-3">Как настрой?</h2>
              <form onSubmit={handleMoodSubmit} className="space-y-3">
                <div className="flex items-center gap-4">
                  <label>Оценка (1-5):</label>
                  <input type="number" min="1" max="5" value={moodScore} onChange={e => setMoodScore(e.target.value)} className="border p-1 w-16 rounded" />
                </div>
                <input type="text" placeholder="Короткая заметка..." value={moodNote} onChange={e => setMoodNote(e.target.value)} className="w-full border p-2 rounded" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700">Записать настроение</button>
              </form>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h2 className="text-xl font-bold mb-3">Что сделал полезного?</h2>
              {categories.length === 0 ? (
                <p className="text-red-500 text-sm">Сначала создай категорию выше!</p>
              ) : (
                <form onSubmit={handleActivitySubmit} className="space-y-3">
                  <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border p-2 rounded bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="text" placeholder="Что делал?" value={activityTitle} onChange={e => setActivityTitle(e.target.value)} className="w-full border p-2 rounded" required />
                  <input type="text" placeholder="Детали..." value={activityDesc} onChange={e => setActivityDesc(e.target.value)} className="w-full border p-2 rounded" />
                  <div className="flex items-center gap-4">
                    <label>Минут:</label>
                    <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="border p-1 w-20 rounded" />
                  </div>
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700">Добавить активность</button>
                </form>
              )}
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <h2 className="text-xl font-bold mb-3">Добавить глобальную цель</h2>
              <form onSubmit={handleInterestSubmit} className="space-y-3">
                {categories.length > 0 && (
                  <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border p-2 rounded bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <input type="text" placeholder="Например: Сделать аутентификацию" value={interestTitle} onChange={e => setInterestTitle(e.target.value)} className="w-full border p-2 rounded" required />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isDevGoal} onChange={e => setIsDevGoal(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm">Это цель для развития (увидит ИИ)</span>
                </label>
                <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-600">Сохранить цель</button>
              </form>
            </div>

          </div>

          {/* Правая колонка: Профиль, Цели и ИИ */}
          <div className="space-y-6">
            <div className="bg-gray-100 p-4 rounded-lg border">
              <h2 className="text-xl font-bold mb-2">Настройки ИИ:</h2>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li><strong>Вектор:</strong> {profile.learningTrack}</li>
                <li><strong>Время:</strong> с {profile.freeTimeStart} до {profile.freeTimeEnd}</li>
                <li><strong>Сон:</strong> в {profile.sleepTime}</li>
              </ul>
            </div>

            <div className="bg-white border p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-bold mb-2 text-orange-700">Мои фокусные цели</h2>
              {interests.length === 0 ? (
                <p className="text-sm text-gray-500">Цели пока не добавлены.</p>
              ) : (
                <ul className="space-y-2">
                  {interests.map(interest => (
                    <li key={interest.id} className="text-sm flex items-start gap-2">
                      <span className={interest.isDevelopmentGoal ? 'text-orange-500' : 'text-gray-400'}>
                        {interest.isDevelopmentGoal ? '🎯' : '📌'}
                      </span>
                      <span>{interest.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button 
              onClick={handleGetInsight}
              disabled={isAiLoading}
              className={`w-full text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all 
                ${isAiLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'}`}
            >
              {isAiLoading ? '✨ Анализирую день...' : '✨ Получить совет от ИИ на сегодня'}
            </button>

            {aiInsight && (
              <div className="mt-6 p-5 bg-purple-50 border border-purple-200 rounded-xl">
                <h3 className="font-bold text-purple-800 mb-2">План на вечер:</h3>
                <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                  {aiInsight}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ИСТОРИЯ ЗА СЕГОДНЯ */}
        <div className="border-t pt-6">
          <h2 className="text-2xl font-bold mb-4">Твой прогресс за сегодня</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div>
              <h3 className="font-bold text-green-700 mb-2 flex items-center gap-2">Выполненные задачи</h3>
              {todayActivities.length === 0 ? (
                <p className="text-gray-500 text-sm">Задач пока нет. Пора что-то сделать!</p>
              ) : (
                <ul className="space-y-2">
                  {todayActivities.map(act => (
                    <li key={act.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>{act.title}</span>
                        <span className="text-green-600">{act.durationMinutes} мин</span>
                      </div>
                      {act.description && <p className="text-sm text-gray-600 mt-1">{act.description}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2">Отметки настроения</h3>
              {todayMoods.length === 0 ? (
                <p className="text-gray-500 text-sm">Ты еще не отмечал настроение сегодня.</p>
              ) : (
                <ul className="space-y-2">
                  {todayMoods.map(mood => (
                    <li key={mood.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex justify-between">
                        <span className="font-bold">Оценка: {mood.score}/5</span>
                        <span className="text-xs text-gray-400">
                          {new Date(mood.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">«{mood.note}»</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};