import { NavLink, Outlet } from 'react-router-dom';
import { Home, CalendarDays, Target, Settings, LogOut, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
    isActive
      ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg shadow-brand/20'
      : 'text-text-muted hover:bg-surface-2 hover:text-text'
  }`;

export const Layout = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-ink flex">

      {/* Боковое меню (Sidebar) */}
      <aside className="w-64 bg-surface/60 backdrop-blur-xl border-r border-border-subtle flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <Sparkles className="text-brand-light" size={20} />
          <h2 className="text-xl font-black bg-gradient-to-r from-brand-light to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
            SelfMade
          </h2>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {/* NavLink подсвечивает пункт меню, соответствующий текущему пути */}
          <NavLink to="/" end className={navLinkClass}>
            <Home size={18} />
            Главная
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            <CalendarDays size={18} />
            История
          </NavLink>
          <NavLink to="/goals" className={navLinkClass}>
            <Target size={18} />
            Цели и Категории
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            <Settings size={18} />
            Профиль
          </NavLink>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 text-left px-4 py-3 text-red-400 font-medium hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Компонент Outlet означает: "Подставь сюда ту страницу, на которой сейчас находится пользователь" */}
        <Outlet />
      </main>

    </div>
  );
};
