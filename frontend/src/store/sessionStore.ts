import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SESSION_STORAGE_KEY } from '../constants';
import { signOut } from '../features/auth/services';
import type { SessionUser } from '../types';

interface SessionState {
  user: SessionUser | null;
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (user) => set({ user }),
      clearSession: () => {
        void signOut();
        set({ user: null });
      },
    }),
    { name: SESSION_STORAGE_KEY },
  ),
);
