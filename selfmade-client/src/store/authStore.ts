import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { UserProfile } from '../types';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  isLoading: boolean;
  setToken: (token: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('selfmade_token'),
  isAuthenticated: !!localStorage.getItem('selfmade_token'),
  profile: null,
  isLoading: false,

  setToken: (token: string) => {
    localStorage.setItem('selfmade_token', token);
    // На случай входа другим пользователем без явного logout (например, забытая сессия
    // в общем браузере) — не должно остаться чужого "активного" таймера дня.
    localStorage.removeItem('selfmade_day_session');
    set({ token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('selfmade_token');
    // Таймер дневной сессии живет в localStorage без привязки к конкретному пользователю —
    // если этого не почистить, следующий вошедший на этом же браузере увидит чужой "активный" таймер.
    localStorage.removeItem('selfmade_day_session');
    set({ token: null, isAuthenticated: false, profile: null });
  },

  fetchProfile: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.get<UserProfile>('/profile');
      set({ profile: response.data, isLoading: false });
    } catch {
      set({ profile: null, isLoading: false });
    }
  },

  setProfile: (profile: UserProfile) => {
    set({ profile });
  },
}));