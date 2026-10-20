import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SESSION_STORAGE_KEY } from '../constants';
import { signOut } from '../features/auth/services';
import type { ProfileRef, SessionUser } from '../types';
import { profileToRole } from '../utils';

interface SessionState {
  user: SessionUser | null;
  setSession: (user: SessionUser) => void;
  setActiveProfile: (profile: ProfileRef) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      setSession: (user) => set({ user }),
      // Cambia el perfil activo y recalcula el rol: guards, menú y redirección
      // leen user.role, así que basta con esta actualización.
      setActiveProfile: (profile) =>
        set((state) =>
          state.user
            ? { user: { ...state.user, activeProfile: profile, role: profileToRole(profile.nombre) } }
            : state,
        ),
      clearSession: () => {
        void signOut();
        set({ user: null });
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      // v1: SessionUser ahora incluye profiles/activeProfile. Las sesiones
      // guardadas con el formato viejo (sin esos campos) se descartan, para no
      // saltarse el selector de perfil ni crashear por un perfil indefinido.
      version: 1,
      migrate: (persisted) => {
        const estado = persisted as { user?: SessionUser | null } | undefined;
        const user = estado?.user;
        if (!user || !Array.isArray(user.profiles) || !user.activeProfile) {
          return { user: null };
        }
        return { user };
      },
    },
  ),
);
