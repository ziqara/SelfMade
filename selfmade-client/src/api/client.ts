import axios from 'axios';
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