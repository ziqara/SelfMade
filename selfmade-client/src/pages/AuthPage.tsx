import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../api/client'; // Твой настроенный axios
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
