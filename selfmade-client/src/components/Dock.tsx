import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, CalendarDays, Target, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV_ITEMS = [
  { to: '/', end: true, icon: Home, label: 'Главная' },
  { to: '/history', end: false, icon: CalendarDays, label: 'История' },
  { to: '/goals', end: false, icon: Target, label: 'Цели и категории' },
  { to: '/profile', end: false, icon: Settings, label: 'Профиль' },
  { to: '/help', end: false, icon: HelpCircle, label: 'Как это работает' },
];

// Навигация в стиле Dock macOS: плавающая стеклянная панель внизу экрана, всегда на виду.
export const Dock = () => {
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  return (
    <motion.div
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-surface/80 backdrop-blur-2xl border border-border-subtle rounded-2xl shadow-2xl shadow-black/50 px-3 py-2.5"
    >
      {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => {
        const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <NavLink key={to} to={to} end={end} className="group relative flex flex-col items-center">
            <div
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'bg-linear-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/30 -translate-y-1'
                  : 'text-text-muted hover:text-text hover:bg-surface-2 hover:-translate-y-1'
              }`}
            >
              <Icon size={20} />
            </div>
            <span className="pointer-events-none absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity heading-caps text-[10px] font-medium text-text bg-surface border border-border-subtle rounded-md px-2 py-1 whitespace-nowrap">
              {label}
            </span>
          </NavLink>
        );
      })}

      <div className="w-px h-8 bg-border-subtle mx-1" />

      <button onClick={logout} className="group relative flex flex-col items-center">
        <div className="w-11 h-11 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-500/10 hover:-translate-y-1 transition-all">
          <LogOut size={20} />
        </div>
        <span className="pointer-events-none absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity heading-caps text-[10px] font-medium text-text bg-surface border border-border-subtle rounded-md px-2 py-1 whitespace-nowrap">
          Выйти
        </span>
      </button>
    </motion.div>
  );
};
