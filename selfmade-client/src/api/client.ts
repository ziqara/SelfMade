import axios, { isAxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5221';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматически подставляем Bearer токен в каждый запрос
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('selfmade_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Если токен протух (401) — тихо сбрасываем авторизацию через стор,
// без жесткой перезагрузки страницы (React сам покажет AuthPage)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Достает читаемое сообщение об ошибке из ответа API — как из { message: "..." },
// так и из стандартного ASP.NET Core ValidationProblemDetails ({ errors: { Field: ["..."] } }).
export function getApiErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;

  const data = error.response?.data;
  if (!data || typeof data !== 'object') return undefined;

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (data.errors && typeof data.errors === 'object') {
    const messages = Object.values(data.errors as Record<string, unknown>)
      .flat()
      .filter((m): m is string => typeof m === 'string');
    if (messages.length > 0) {
      return messages.join(' ');
    }
  }

  if (typeof data.title === 'string' && data.title.trim()) {
    return data.title;
  }

  return undefined;
}