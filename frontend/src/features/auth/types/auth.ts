export type AuthMode = 'login' | 'register';
export type SubmitState = 'idle' | 'loading' | 'success';

export interface LoginValues {
  email: string;
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

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type AuthResult = { ok: true } | { ok: false; error: string };