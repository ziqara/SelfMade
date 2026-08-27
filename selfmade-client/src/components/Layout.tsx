import { Outlet } from 'react-router-dom';
import { GradientBackground } from './GradientBackground';
import { Dock } from './Dock';

export const Layout = () => {
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
