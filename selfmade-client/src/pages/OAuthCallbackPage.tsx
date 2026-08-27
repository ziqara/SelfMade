import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

// Сюда бэкенд редиректит браузер после успешного (или неуспешного) входа
// через Google/GitHub: либо ?token=..., либо ?error=... в query-строке.
export const OAuthCallbackPage = () => {
  const [params] = useSearchParams();
  const setToken = useAuthStore((state) => state.setToken);
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      setToken(token);
      toast.success('Успешный вход!');
    } else {
      toast.error(error || 'Не удалось войти. Попробуйте еще раз.');
    }

    navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-muted font-light">
      Входим...
    </div>
  );
};
