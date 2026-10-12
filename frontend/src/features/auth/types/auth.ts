export type AuthMode = 'login' | 'register';
export type SubmitState = 'idle' | 'loading' | 'success';

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

export interface Credentials {
  email: string;
  password: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  nombre: string;
  perfil: string;
}

export interface SessionUser {
  userID: number;
  userName: string;
  Profile: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type AuthResult = { ok: true; user: AuthUser } | { ok: false; error: string };