import { create } from 'zustand';
import { apiClient } from '../api/client';
import { UserProfile } from '../types';

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
    set({ token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('selfmade_token');
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