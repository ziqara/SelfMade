import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, CalendarDays, Target, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { GradientBackground } from './GradientBackground';

const NAV_ITEMS = [
  { to: '/', end: true, icon: Home, label: 'Главная' },
  { to: '/history', end: false, icon: CalendarDays, label: 'История' },
  { to: '/goals', end: false, icon: Target, label: 'Цели и категории' },
  { to: '/profile', end: false, icon: Settings, label: 'Профиль' },
];

const COLLAPSED_WIDTH = 76;
const EXPANDED_WIDTH = 248;

export const Layout = () => {
  const logout = useAuthStore((state) => state.logout);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-ink">
      <GradientBackground />

      {/* Боковое меню: узкая иконочная полоса, плавно раскрывается по наведению поверх контента */}
      <motion.aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed inset-y-0 left-0 z-30 bg-surface/70 backdrop-blur-2xl border-r border-border-subtle flex flex-col overflow-hidden"
      >
        <div className="h-20 flex items-center px-6 shrink-0">
          <span className="heading-caps text-lg font-light tracking-widest text-text whitespace-nowrap">
            SM
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-block overflow-hidden"
                >
                  ADE
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-4 h-12 px-3.5 rounded-xl font-normal transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-brand to-brand-dark text-white shadow-lg shadow-brand/20'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                }`
              }
            >
              <Icon size={19} className="shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 h-12 px-3.5 text-red-400 font-normal hover:bg-red-500/10 rounded-xl transition-colors whitespace-nowrap"
          >
            <LogOut size={19} className="shrink-0" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  Выйти
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Основной контент — отступ слева фиксирован под свернутое меню, чтобы раскрытие не двигало контент */}
      <main className="p-8 overflow-y-auto" style={{ marginLeft: COLLAPSED_WIDTH }}>
        {/* Компонент Outlet означает: "Подставь сюда ту страницу, на которой сейчас находится пользователь" */}
        <Outlet />
      </main>
    </div>
  );
};
