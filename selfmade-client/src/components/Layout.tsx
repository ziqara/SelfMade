import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-4 py-3 rounded-lg font-medium transition-colors ${
    isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-blue-50'
  }`;

export const Layout = () => {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Боковое меню (Sidebar) */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-black text-blue-600 tracking-tight">SelfMade.</h2>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {/* NavLink подсвечивает пункт меню, соответствующий текущему пути */}
          <NavLink to="/" end className={navLinkClass}>
            🏠 Главная
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            📅 История
          </NavLink>
          <NavLink to="/goals" className={navLinkClass}>
            🎯 Цели и Категории
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            ⚙️ Профиль
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors"
          >
            🚪 Выйти
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