export type AuthMode = 'login' | 'register';
export type SubmitState = 'idle' | 'loading' | 'success';

// Perfil del usuario tal como lo expone el backend en la respuesta de login:
// el id autoriza en los mapas del servidor y el nombre es el que decide el rol
// (y por tanto las rutas/menú) en el frontend.
export type { ProfileRef } from '../../../types';

export interface LoginValues {
  username: string;
  password: string;
}

export interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type AuthResult = { ok: true; user: import('../../../types').SessionUser } | { ok: false; error: string };
