import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  showToast: (message, type = 'info') => {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// Небольшие хелперы, чтобы не писать useToastStore.getState().showToast(...) везде
export const toast = {
  success: (message: string) => useToastStore.getState().showToast(message, 'success'),
  error: (message: string) => useToastStore.getState().showToast(message, 'error'),
  info: (message: string) => useToastStore.getState().showToast(message, 'info'),
};
