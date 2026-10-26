import { MUTATION_LATENCY_MAX, MUTATION_LATENCY_MIN } from '../../../constants';
import { delay, randomLatency } from '../../../mocks';
import { ApiError, execute } from '../../auth/services/apiClient';

export interface AppPreferences {
  language: string;
  emailNotifications: boolean;
  desktopNotifications: boolean;
  weeklyDigest: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'es',
  emailNotifications: true,
  desktopNotifications: true,
  weeklyDigest: false,
};

const PREFERENCES_KEY = 'onyx-preferences';

export function readPreferences(): AppPreferences {
  const raw = window.localStorage.getItem(PREFERENCES_KEY);
  if (!raw) return { ...DEFAULT_PREFERENCES };
  try {
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<AppPreferences>) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(preferences: AppPreferences): Promise<AppPreferences> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  return preferences;
}

export async function changePassword(current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await execute('Security', 'User', 'cambiarClave', [current, next]);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}
