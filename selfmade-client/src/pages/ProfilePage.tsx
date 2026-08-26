import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

export const ProfilePage = () => {
  const { profile, fetchProfile } = useAuthStore();
  
  const [learningTrack, setLearningTrack] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [freeTimeStart, setFreeTimeStart] = useState('');
  const [freeTimeEnd, setFreeTimeEnd] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [preferredRest, setPreferredRest] = useState('');
  const [dislikedRest, setDislikedRest] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Когда страница загружается, подставляем текущие данные в инпуты
  useEffect(() => {
    if (profile) {
      setLearningTrack(profile.learningTrack || '');
      setCurrentLevel(profile.currentLevel || '');
      setPreferredRest(profile.preferredRest || '');
      setDislikedRest(profile.dislikedRest || '');
      
      // Обрезаем секунды "HH:mm:ss" -> "HH:mm" для HTML-инпутов
      setFreeTimeStart(profile.freeTimeStart?.substring(0, 5) || '19:00');
      setFreeTimeEnd(profile.freeTimeEnd?.substring(0, 5) || '22:00');
      setSleepTime(profile.sleepTime?.substring(0, 5) || '23:00');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Используем тот же эндпоинт, что и в анкете
      await apiClient.post('/profile', {
        learningTrack,
        currentLevel,
        freeTimeStart: freeTimeStart.length === 5 ? freeTimeStart + ':00' : freeTimeStart,
        freeTimeEnd: freeTimeEnd.length === 5 ? freeTimeEnd + ':00' : freeTimeEnd,
        sleepTime: sleepTime.length === 5 ? sleepTime + ':00' : sleepTime,
        preferredRest,
        dislikedRest
      });

      alert('Настройки профиля успешно обновлены!');
      await fetchProfile(); // Обновляем данные в глобальном хранилище
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось обновить профиль. Проверьте консоль.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return <div className="p-8">Загрузка профиля...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h1 className="text-3xl font-bold mb-2">Настройки ИИ-наставника ⚙️</h1>
      <p className="text-gray-500 mb-8">Обнови свое расписание и векторы развития, чтобы ИИ давал более точные советы.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">Вектор развития (что учим?)</label>
            <input type="text" value={learningTrack} onChange={e => setLearningTrack(e.target.value)} required className="w-full border p-2 rounded" />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">Текущий уровень</label>
            <input type="text" value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} className="w-full border p-2 rounded" placeholder="Например: Junior+" />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-4">Твое расписание</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Свободное время (от):</label>
              <input type="time" value={freeTimeStart} onChange={e => setFreeTimeStart(e.target.value)} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Свободное время (до):</label>
              <input type="time" value={freeTimeEnd} onChange={e => setFreeTimeEnd(e.target.value)} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Время сна:</label>
              <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} required className="w-full border p-2 rounded" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">Любимый отдых</label>
            <input type="text" value={preferredRest} onChange={e => setPreferredRest(e.target.value)} required className="w-full border p-2 rounded" />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">Нежелательный отдых</label>
            <input type="text" value={dislikedRest} onChange={e => setDislikedRest(e.target.value)} className="w-full border p-2 rounded" />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className={`w-full text-white p-4 rounded-xl font-bold transition-colors ${isSaving ? 'bg-gray-400' : 'bg-gray-800 hover:bg-black'}`}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
};