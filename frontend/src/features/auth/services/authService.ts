import { AUTH_ERROR_MESSAGES, SESSION_DELAY } from '../../../constants';
import { MOCK_ACCOUNTS, EMPLOYEES } from '../../../mocks';
import { delay, profileToRole, sortProfilesByPriority } from '../../../utils';
import { ApiError, execute, loginRequest, logoutRequest } from './apiClient';
import type { AuthResult, LoginCredentials, ProfileRef } from '../types';
import type { SessionUser } from '../../../types';

// Respuesta de Security/Session/login en el backend. `profiles` trae el id
// (autoriza en el servidor) y el nombre (decide el rol en el frontend). No
// incluye email, cargo ni departamento: esos datos viven en Persona/Empleado.
interface BackendSession {
  userID: number;
  userName: string;
  profiles: ProfileRef[];
  debeCambiarClave: boolean;
}

const AUTH_FAILED_STATUSES = new Set([401, 403, 423]);

// Mapea la sesión del backend al usuario del frontend. El perfil activo es el
// de mayor prioridad (Superusuario primero); el rol se deriva de su nombre.
function toSessionUser(sesion: BackendSession): SessionUser {
  const profiles = sortProfilesByPriority(sesion.profiles ?? []);
  const activeProfile: ProfileRef = profiles[0] ?? { id: 0, nombre: '' };

  return {
    id: String(sesion.userID),
    name: sesion.userName,
    email: '',
    role: profileToRole(activeProfile.nombre),
    profiles,
    activeProfile,
    jobTitle: '',
    departmentId: '',
    mustChangePassword: Boolean(sesion.debeCambiarClave),
  };
}

export async function signIn(payload: LoginCredentials): Promise<AuthResult> {
  try {
    const sesion = await loginRequest<BackendSession>(
      payload.username.trim(),
      payload.password,
    );
    return { ok: true, user: toSessionUser(sesion) };
  } catch (error) {
    if (error instanceof ApiError) {
      const message = AUTH_FAILED_STATUSES.has(error.status)
        ? AUTH_ERROR_MESSAGES.credentialsInvalid
        : error.message || AUTH_ERROR_MESSAGES.credentialsInvalid;
      return { ok: false, error: message };
    }
    return { ok: false, error: AUTH_ERROR_MESSAGES.networkError };
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const sesion = await execute<BackendSession | null>('Session', 'Session', 'getSession', []);
  return sesion ? toSessionUser(sesion) : null;
}

export async function signUp(): Promise<AuthResult> {
  await delay(SESSION_DELAY);
  return { ok: true, user: MOCK_ACCOUNTS[1].session };
}

export async function getCurrentUser(userId: string): Promise<SessionUser | null> {
  const employee = EMPLOYEES.find((item) => item.id === userId);
  if (!employee) return null;
  await delay(200);
  // Mock: se sintetiza un perfil a partir del rol del empleado.
  const activeProfile: ProfileRef = {
    id: employee.role === 'superuser' ? 1 : 2,
    nombre: employee.role === 'superuser' ? 'Superusuario' : 'Empleado',
  };
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    profiles: [activeProfile],
    activeProfile,
    jobTitle: employee.jobTitle,
    departmentId: employee.departmentId,
  };
}

export async function signOut(): Promise<void> {
  // logout es idempotente en el backend; aunque falle (red caída), el store
  // local se limpia igualmente desde sessionStore.
  try {
    await logoutRequest();
  } catch {
    // Se ignora: sin sesión viva no hay nada que destruir del lado servidor.
  }
}
