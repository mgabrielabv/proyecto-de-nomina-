import { API_BASE_URL, AUTH_ERROR_MESSAGES } from '../../../constants';
import type { AuthResult, AuthUser, Credentials, LoginCredentials, SessionUser } from '../types';

async function getErrorMessage(response: Response): Promise<string> {
  if (response.status === 400 || response.status === 401) {
    return response.status === 401
      ? AUTH_ERROR_MESSAGES.credentialsInvalid
      : 'Introduce tu usuario y contraseña.';
  }
  if (response.status >= 500) return 'El servidor no está disponible. Inténtalo más tarde.';
  return AUTH_ERROR_MESSAGES.serverError;
}

export async function signIn(payload: LoginCredentials): Promise<AuthResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) return { ok: false, error: await getErrorMessage(response) };

    const data = (await response.json()) as { user: AuthUser };
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: AUTH_ERROR_MESSAGES.serverError };
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch(`${API_BASE_URL}/api/me`, { credentials: 'include' });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(await getErrorMessage(response));
  return (await response.json()) as SessionUser;
}

export async function signOut(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) throw new Error(await getErrorMessage(response));
}

export function signUp(_payload: Credentials): Promise<AuthResult> {
  return Promise.resolve({ ok: false, error: 'El registro está deshabilitado temporalmente.' });
}