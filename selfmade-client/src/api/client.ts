import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5221'; // Твой порт бэкенда

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

// Если токен протух (401) — сбрасываем авторизацию
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('selfmade_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);