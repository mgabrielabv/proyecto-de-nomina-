// Base URL del backend (Payroll-Backend/.env: PORT=3002 en dev). El CORS del
// backend permite el origen del frontend (FRONTEND_URL) con credentials, y la
// sesión viaja en la cookie connect.sid (httpOnly, sameSite: lax).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';
const EXECUTE_PATH = `${API_BASE_URL}/api/execute`;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Cliente del endpoint único de reflexión del backend: todo se invoca como
// { subsystem, class, method, params } vía POST /api/execute con la sesión en
// la cookie connect.sid, por eso credentials: 'include' es obligatorio.
export async function execute<T>(
  subsystem: string,
  className: string,
  method: string,
  params: unknown[] = [],
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(EXECUTE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subsystem, class: className, method, params }),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Inténtalo de nuevo.', 0);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Respuesta sin JSON (p. ej. 502): se maneja como error genérico.
  }

  if (!response.ok) {
    const mensaje =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'No se pudo completar la operación. Inténtalo de nuevo.';
    throw new ApiError(mensaje, response.status);
  }

  return body as T;
}
