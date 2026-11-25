import { create } from 'zustand';
import { SESSION_STORAGE_KEY } from '../constants';
import { getSession, signOut } from '../features/auth/services';
import type { ProfileRef, SessionUser } from '../types';
import { profileToRole } from '../utils';
import { resetAppData } from './resetAppData';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionState {
  user: SessionUser | null;
  status: SessionStatus;
  bootstrap: () => Promise<void>;
  setSession: (user: SessionUser) => void;
  setActiveProfile: (profile: ProfileRef) => void;
  setMustChangePassword: (value: boolean) => void;
  clearSession: () => void;
  clearLocalSession: () => void;
}

const AUTH_CHANNEL = 'onyx-auth';
const authChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(AUTH_CHANNEL)
    : null;

let bootstrapping: Promise<void> | null = null;
let loggingOut = false;

const notifyLogout = () => authChannel?.postMessage({ type: 'logout' });

const clearLocalState = () => {
  resetAppData();
};

export const useSessionStore = create<SessionState>()((set) => ({
  user: null,
  status: 'loading',
  bootstrap: () => {
    if (bootstrapping) return bootstrapping;

    bootstrapping = (async () => {
      // La sesión anterior vivía en localStorage. Se elimina para que la
      // autorización dependa exclusivamente de la cookie de sesión del servidor.
      window.localStorage.removeItem(SESSION_STORAGE_KEY);

      try {
        const user = await getSession();
        set(user ? { user, status: 'authenticated' } : { user: null, status: 'anonymous' });
      } catch {
        set({ user: null, status: 'anonymous' });
      }
    })().finally(() => {
      bootstrapping = null;
    });

    return bootstrapping;
  },
  setSession: (user) => set({ user, status: 'authenticated' }),
  setActiveProfile: (profile) =>
    set((state) => {
      if (!state.user || !state.user.profiles.some((item) => item.id === profile.id)) {
        return state;
      }
      return {
        user: {
          ...state.user,
          activeProfile: profile,
          role: profileToRole(profile.nombre),
        },
      };
    }),
  setMustChangePassword: (value) =>
    set((state) =>
      state.user ? { user: { ...state.user, mustChangePassword: value } } : state,
    ),
  clearSession: () => {
    if (loggingOut) return;
    loggingOut = true;
    set({ user: null, status: 'anonymous' });
    clearLocalState();
    notifyLogout();
    void signOut().finally(() => {
      loggingOut = false;
    });
  },
  clearLocalSession: () => {
    set({ user: null, status: 'anonymous' });
    clearLocalState();
  },
}));

if (authChannel) {
  authChannel.addEventListener('message', (event) => {
    if (event.data?.type === 'logout') {
      useSessionStore.getState().clearLocalSession();
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('onyx:unauthorized', () => {
    useSessionStore.getState().clearLocalSession();
    notifyLogout();
  });

  window.addEventListener('onyx:must-change-password', () => {
    useSessionStore.getState().setMustChangePassword(true);
  });
}
