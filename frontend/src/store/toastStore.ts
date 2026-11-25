import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  duration: number;
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, tone?: ToastTone, duration?: number) => void;
  dismiss: (id: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success', duration = 4200) => {
    toastCounter += 1;
    const id = `toast-${toastCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, tone, duration, createdAt: Date.now() }].slice(-4),
    }));
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) })),
}));
