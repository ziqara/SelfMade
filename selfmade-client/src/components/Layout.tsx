import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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
          {/* Link - это замена обычного тега <a> в React Router (не перезагружает страницу) */}
          <Link to="/" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 font-medium transition-colors">
            🏠 Главная
          </Link>
          <Link to="/history" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 font-medium transition-colors">
            📅 История
          </Link>
          <Link to="/goals" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 font-medium transition-colors">
            🎯 Цели и Категории
          </Link>
          <Link to="/profile" className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-blue-50 font-medium transition-colors">
            ⚙️ Профиль
          </Link>
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