import { useState } from 'react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

export const OnboardingPage = () => {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const [learningTrack, setLearningTrack] = useState('');
  const [currentLevel, setCurrentLevel] = useState('');
  const [freeTimeStart, setFreeTimeStart] = useState('19:30');
  const [freeTimeEnd, setFreeTimeEnd] = useState('23:00');
  const [sleepTime, setSleepTime] = useState('23:30');
  const [preferredRest, setPreferredRest] = useState('');
  const [dislikedRest, setDislikedRest] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post('/profile', {
        learningTrack,
        currentLevel,
        freeTimeStart: freeTimeStart + ':00', // Добавляем секунды для C# TimeOnly
        freeTimeEnd: freeTimeEnd + ':00',
        sleepTime: sleepTime + ':00',
        preferredRest,
        dislikedRest
      });

      alert('Профиль успешно сохранен!');
      await fetchProfile(); // Обновляем данные в хранилище
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Не удалось сохранить профиль');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-2">Настройка профиля</h2>
      <p className="text-gray-600 mb-6">Заполни данные, чтобы ИИ мог составить расписание.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Вектор развития (что учим?):</label>
          <input type="text" value={learningTrack} onChange={e => setLearningTrack(e.target.value)} required className="mt-1 w-full border p-2 rounded" placeholder="Например: C# ASP.NET Core" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Текущий уровень:</label>
          <input type="text" value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} className="mt-1 w-full border p-2 rounded" placeholder="Например: Junior+" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Своб. время (от):</label>
            <input type="time" value={freeTimeStart} onChange={e => setFreeTimeStart(e.target.value)} required className="mt-1 w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Своб. время (до):</label>
            <input type="time" value={freeTimeEnd} onChange={e => setFreeTimeEnd(e.target.value)} required className="mt-1 w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Время сна:</label>
            <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} required className="mt-1 w-full border p-2 rounded" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Любимый отдых:</label>
          <input type="text" value={preferredRest} onChange={e => setPreferredRest(e.target.value)} required className="mt-1 w-full border p-2 rounded" placeholder="Например: Sci-Fi, прогулки" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Нежелательный отдых (опционально):</label>
          <input type="text" value={dislikedRest} onChange={e => setDislikedRest(e.target.value)} className="mt-1 w-full border p-2 rounded" placeholder="Например: Бег, клубы" />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">
          Сохранить настройки
        </button>
      </form>
    </div>
  );
};