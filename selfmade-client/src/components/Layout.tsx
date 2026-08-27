import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { GradientBackground } from './GradientBackground';
import { Dock } from './Dock';

export const Layout = () => {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  // Профиль нужен почти всем страницам (Dashboard, Profile), поэтому грузим его тут,
  // на уровне общего каркаса — а не только при заходе на Dashboard. Иначе прямой переход
  // на /profile (обновление страницы, закладка) навсегда зависал на "Загрузка профиля...".
  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen">
      <GradientBackground />

      {/* Основной контент — на всю ширину, навигация не занимает постоянного места на экране */}
      <main className="min-h-screen p-8 pb-28 overflow-y-auto">
        {/* Компонент Outlet означает: "Подставь сюда ту страницу, на которой сейчас находится пользователь" */}
        <Outlet />
      </main>

      {/* Dock-навигация снизу — спрятана по умолчанию, выезжает по наведению */}
      <Dock />
    </div>
  );
};
