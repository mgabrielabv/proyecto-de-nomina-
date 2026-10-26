// Base URL del backend (Payroll-Backend/.env: PORT=3002 en dev). El CORS del
// backend permite el origen del frontend (FRONTEND_URL) con credentials, y la
// sesión viaja en cookies httpOnly (connect.sid / access_token / refresh_token).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';
const AUTH_BASE = `${API_BASE_URL}/api`;
const EXECUTE_PATH = `${AUTH_BASE}/execute`;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  authRetry?: boolean;
  report401?: boolean;
}

interface ErrorBody {
  error?: unknown;
}

let refreshPromise: Promise<boolean> | null = null;

const dispatch = (event: string) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(event));
};

const refreshSession = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${AUTH_BASE}/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

const errorMessageOf = (body: unknown): string | null => {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const message = (body as ErrorBody).error;
    if (typeof message === 'string') return message;
  }
  return null;
};

async function requestJson<T>(
  url: string,
  init: RequestInit,
  { authRetry = true, report401 = true }: RequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Inténtalo de nuevo.', 0);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Respuesta sin JSON (p. ej. 502): se maneja como error genérico.
  }

  if (response.status === 401 && authRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return requestJson<T>(url, init, { authRetry: false, report401 });
    }
  }

  if (!response.ok) {
    const message = errorMessageOf(body);
    if (response.status === 401 && report401) {
      dispatch('onyx:unauthorized');
    }
    if (response.status === 403 && message?.includes('cambiar tu contraseña')) {
      dispatch('onyx:must-change-password');
    }
    throw new ApiError(
      message ?? 'No se pudo completar la operación. Inténtalo de nuevo.',
      response.status,
    );
  }

  return body as T;
}

export function loginRequest<T>(username: string, password: string): Promise<T> {
  return requestJson<T>(
    `${AUTH_BASE}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    },
    { authRetry: false, report401: false },
  );
}

export function logoutRequest(): Promise<void> {
  return requestJson<void>(
    `${AUTH_BASE}/logout`,
    { method: 'POST', credentials: 'include' },
    { authRetry: false, report401: false },
  );
}

// Cliente del endpoint único de reflexión del backend: todo se invoca como
// { subsystem, class, method, params } vía POST /execute con la sesión en las
// cookies, por eso credentials: 'include' es obligatorio.
export async function execute<T>(
  subsystem: string,
  className: string,
  method: string,
  params: unknown[] = [],
): Promise<T> {
  const isLogin = subsystem === 'Session' && className === 'Session' && method === 'login';
  const isPasswordChange =
    subsystem === 'Security' && className === 'User' && method === 'cambiarClave';
  const shouldHandleSession = !isLogin && !isPasswordChange;

  return requestJson<T>(
    EXECUTE_PATH,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subsystem, class: className, method, params }),
    },
    { authRetry: shouldHandleSession, report401: shouldHandleSession },
  );
}
