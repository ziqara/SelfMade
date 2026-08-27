import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User } from 'lucide-react';
import { apiClient, getApiErrorMessage, API_BASE_URL } from '../api/client'; // Твой настроенный axios
import { useAuthStore } from '../store/authStore'; // Твой Zustand стор
import { toast } from '../store/toastStore';
import { GradientBackground } from '../components/GradientBackground';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Достаем функцию сохранения токена из хранилища
  const setToken = useAuthStore((state) => state.setToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // apiClient уже знает про http://localhost:5221/api, поэтому пишем коротко:
        const response = await apiClient.post('/auth/login', {
          email,
          password
        });

        // Магия Zustand: сохраняем токен, и приложение понимает, что мы авторизованы
        setToken(response.data.token);
        toast.success('Успешный вход!');

      } else {
        // Просто делаем await без сохранения в переменную
        await apiClient.post('/auth/register', {
          username,
          email,
          password
        });

        toast.success('Аккаунт создан! Теперь можно войти.');
        setIsLogin(true); // Перекидываем на логин
      }
    } catch (error) {
      console.error('Ошибка API:', error);
      toast.error(getApiErrorMessage(error) || 'Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <GradientBackground />

      {/* Вступительный блок: бренд + короткий слоган */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative text-center mb-8"
      >
        <h1 className="heading-caps text-4xl sm:text-5xl font-light tracking-widest text-text">
          SELFMADE
        </h1>
        <p className="heading-caps text-xs text-text-muted mt-3 tracking-[0.2em]">
          Саморазвитие под руководством ИИ
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-surface/70 backdrop-blur-2xl border border-border-subtle rounded-2xl shadow-2xl shadow-black/40 p-8"
      >
        <h2 className="text-xl font-medium text-center text-text mb-7">
          {isLogin ? 'С возвращением' : 'Создать аккаунт'}
        </h2>

        <AnimatePresence mode="wait">
          <motion.form
            key={isLogin ? 'login' : 'register'}
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Имя пользователя (минимум 3 символа)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border-subtle text-text placeholder-text-muted rounded-xl focus:ring-2 focus:ring-brand focus:outline-none transition-all font-light"
                  required
                  minLength={3}
                  maxLength={50}
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border-subtle text-text placeholder-text-muted rounded-xl focus:ring-2 focus:ring-brand focus:outline-none transition-all font-light"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="password"
                placeholder={isLogin ? 'Пароль' : 'Пароль (минимум 6 символов)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface-2 border border-border-subtle text-text placeholder-text-muted rounded-xl focus:ring-2 focus:ring-brand focus:outline-none transition-all font-light"
                required
                minLength={isLogin ? undefined : 6}
                maxLength={100}
              />
            </div>

            <motion.button
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-brand/20 ${
                isSubmitting ? 'bg-brand/50 cursor-wait' : 'bg-linear-to-r from-brand to-brand-dark hover:brightness-110'
              }`}
            >
              {isSubmitting ? 'Секунду...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-text-muted font-light">или</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        <div className="space-y-3">
          <a
            href={`${API_BASE_URL}/api/auth/google/login`}
            className="flex items-center justify-center gap-2.5 w-full bg-surface-2 border border-border-subtle text-text font-medium py-3 rounded-xl hover:border-brand/40 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.62Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33Z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
            </svg>
            Войти через Google
          </a>
          <a
            href={`${API_BASE_URL}/api/auth/github/login`}
            className="flex items-center justify-center gap-2.5 w-full bg-surface-2 border border-border-subtle text-text font-medium py-3 rounded-xl hover:border-brand/40 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.53-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.73 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.21.66.79.55A10.53 10.53 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
            </svg>
            Войти через GitHub
          </a>
        </div>

        <div className="mt-6 text-center text-text-muted text-sm font-light">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-light font-medium hover:underline"
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
