import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { GradientBackground } from './GradientBackground';
import { Dock } from './Dock';

export const Layout = () => {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const location = useLocation();
  // useOutlet() (в отличие от <Outlet/>) отдает снимок текущего элемента маршрута на момент
  // рендера — это нужно, чтобы уходящая (exit) карточка так и держала СТАРУЮ страницу, пока
  // играет анимация, а не мгновенно подменялась новой (из-за чего раньше был эффект
  // "страница уже открылась -> потом потухла -> потом только начала анимация")
  const element = useOutlet();

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
        {/* key={pathname} заставляет AnimatePresence увидеть смену страницы как выход/вход
            нового элемента, даже когда меняется только Outlet внутри одного и того же Layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            {element}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dock-навигация снизу — спрятана по умолчанию, выезжает по наведению */}
      <Dock />
    </div>
  );
};
