import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Импортируем наши страницы и Layout
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { AuthPage } from './pages/AuthPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { GoalsPage } from './pages/GoalsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpPage } from './pages/HelpPage';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Доступен всегда, до момента когда токен появится в сторе */}
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />

        {/* Если пользователь НЕ авторизован */}
        {!isAuthenticated ? (
          // Любой путь (*) ведет на страницу авторизации
          <Route path="*" element={<AuthPage />} />
        ) : (
          // Если авторизован - используем Layout как обертку
          <Route path="/" element={<Layout />}>
            {/* Внутри Layout рисуем конкретную страницу в зависимости от URL */}
            <Route index element={<DashboardPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="help" element={<HelpPage />} />

            {/* Защита от несуществующих страниц: перекидываем на главную */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;