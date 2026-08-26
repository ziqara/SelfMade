import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { OnboardingPage } from './OnboardingPage';
import { apiClient } from '../api/client';

// Описываем тип категории, как он приходит с бэкенда (CategoryResponseDto)
interface Category {
  id: number;
  name: string;
  type: string;
}

export const DashboardPage = () => {
  const { profile, fetchProfile, isLoading, logout } = useAuthStore();
  
  // Состояния для данных с бэкенда
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Состояния для формы настроения
  const [moodScore, setMoodScore] = useState('5');
  const [moodNote, setMoodNote] = useState('');

  // Состояния для формы активности
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [duration, setDuration] = useState('60');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Состояния для ИИ
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    // Загружаем категории при старте страницы
    apiClient.get<Category[]>('/categories')
      .then(res => {
        setCategories(res.data);
        if (res.data.length > 0) {
          setSelectedCategoryId(res.data[0].id.toString());
        }
      })
      .catch(err => console.error('Ошибка загрузки категорий:', err));
  }, [fetchProfile]);

  // Обработчик отправки настроения
  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/moods', {
        score: parseInt(moodScore),
        note: moodNote
      });
      alert('Настроение записано!');
      setMoodNote('');
    } catch (error) {
      alert('Ошибка при сохранении настроения');
    }
  };

  // Обработчик отправки активности
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/activities', {
        categoryId: parseInt(selectedCategoryId),
        title: activityTitle,
        description: activityDesc,
        durationMinutes: parseInt(duration)
      });
      alert('Активность добавлена!');
      setActivityTitle('');
      setActivityDesc('');
    } catch (error) {
      alert('Ошибка при сохранении активности');
    }
  };

  // Обработчик запроса к ИИ
  const handleGetInsight = async () => {
    setIsAiLoading(true);
    try {
      const response = await apiClient.get('/analytics/daily');
      // Бэкенд возвращает JSON: { insight: "текст..." }
      setAiInsight(response.data.insight);
    } catch (error) {
      console.error('Ошибка ИИ:', error);
      alert('Не удалось получить совет от ИИ. Проверь консоль и запущен ли VPN (если Gemini заблокирован).');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading) return <div className="p-10">Загрузка...</div>;
  if (!profile) return <OnboardingPage />;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-md p-6">
        
        {/* Шапка */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold">Рабочий стол</h1>
          <button onClick={logout} className="text-red-500 font-semibold hover:underline">Выйти</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Левая колонка: Формы ввода */}
          <div className="space-y-6">
            
            {/* Блок 1: Настроение */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h2 className="text-xl font-bold mb-3">Как настрой?</h2>
              <form onSubmit={handleMoodSubmit} className="space-y-3">
                <div className="flex items-center gap-4">
                  <label>Оценка (1-5):</label>
                  <input type="number" min="1" max="5" value={moodScore} onChange={e => setMoodScore(e.target.value)} className="border p-1 w-16 rounded" />
                </div>
                <input type="text" placeholder="Короткая заметка..." value={moodNote} onChange={e => setMoodNote(e.target.value)} className="w-full border p-2 rounded" required />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Записать настроение</button>
              </form>
            </div>

            {/* Блок 2: Активность */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h2 className="text-xl font-bold mb-3">Что сделал полезного?</h2>
              {categories.length === 0 ? (
                <p className="text-red-500 text-sm">Сначала нужно создать категорию через Swagger (API) или БД!</p>
              ) : (
                <form onSubmit={handleActivitySubmit} className="space-y-3">
                  <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border p-2 rounded">
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                  <input type="text" placeholder="Что делал? (Например: Учил C#)" value={activityTitle} onChange={e => setActivityTitle(e.target.value)} className="w-full border p-2 rounded" required />
                  <input type="text" placeholder="Детали..." value={activityDesc} onChange={e => setActivityDesc(e.target.value)} className="w-full border p-2 rounded" />
                  <div className="flex items-center gap-4">
                    <label>Минут потрачено:</label>
                    <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="border p-1 w-20 rounded" />
                  </div>
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">Добавить активность</button>
                </form>
              )}
            </div>

          </div>

          {/* Правая колонка: Профиль и ИИ */}
          <div>
            <div className="bg-gray-100 p-4 rounded-lg border mb-6">
              <h2 className="text-xl font-bold mb-2">Настройки ИИ:</h2>
              <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
                <li><strong>Вектор:</strong> {profile.learningTrack}</li>
                <li><strong>Время:</strong> с {profile.freeTimeStart} до {profile.freeTimeEnd}</li>
                <li><strong>Сон:</strong> в {profile.sleepTime}</li>
              </ul>
            </div>

            <button 
              onClick={handleGetInsight}
              disabled={isAiLoading}
              className={`w-full text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all 
                ${isAiLoading ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 hover:scale-105'}`}
            >
              {isAiLoading ? '✨ Анализирую день...' : '✨ Получить совет от ИИ на сегодня'}
            </button>

            {/* Блок для вывода ответа от ИИ */}
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
      </div>
    </div>
  );
};