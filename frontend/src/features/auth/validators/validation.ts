import { AUTH_ERROR_MESSAGES, LIMITS, MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH } from '../../../constants';
import type { FieldErrors, LoginValues, RegisterValues } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type PasswordIssueId = 'minLength' | 'hasLetter' | 'hasDigit' | 'noEdgeSpaces' | 'maxBytes';

export interface PasswordIssue {
  id: PasswordIssueId;
  label: string;
  ok: boolean;
}

export function isValidEmail(value: string): boolean {
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;
  return true;
}

export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function hasMixedCase(value: string): boolean {
  return /[a-z]/.test(value) && /[A-Z]/.test(value);
}

export function hasDigit(value: string): boolean {
  return /\d/.test(value);
}

export function hasSymbol(value: string): boolean {
  return /[^A-Za-z0-9]/.test(value);
}

export function hasLetter(value: string): boolean {
  return /\p{L}/u.test(value);
}

export function getPasswordBytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function isWhitespaceOnly(value: string): boolean {
  return value.length > 0 && /^\s+$/.test(value);
}

export function hasEdgeSpaces(value: string): boolean {
  return value !== value.trim();
}

export function getPasswordIssues(password: string): PasswordIssue[] {
  return [
    {
      id: 'minLength',
      label: `${MIN_PASSWORD_LENGTH} o más caracteres`,
      ok: password.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: 'hasLetter',
      label: 'Una letra',
      ok: hasLetter(password),
    },
    {
      id: 'hasDigit',
      label: 'Un número',
      ok: hasDigit(password),
    },
    {
      id: 'noEdgeSpaces',
      label: 'Sin espacios al inicio ni al final',
      ok: password.length > 0 && !hasEdgeSpaces(password) && !isWhitespaceOnly(password),
    },
    {
      id: 'maxBytes',
      label: `Máximo ${MAX_PASSWORD_BYTES} bytes`,
      ok: getPasswordBytes(password) <= MAX_PASSWORD_BYTES,
    },
  ];
}

// Puntuación de fortaleza para la barra (0-4). Se basa en longitud, variedad y cumplimiento.
export function getPasswordStrengthScore(password: string): number {
  if (password.length === 0) return 0;
  let score = 0;
  if (hasMinLength(password, MIN_PASSWORD_LENGTH)) score += 1;
  if (hasLetter(password) && hasDigit(password)) score += 1;
  if (hasMinLength(password, 12) || hasMixedCase(password)) score += 1;
  if (hasSymbol(password) || hasMinLength(password, 16)) score += 1;
  // Penaliza incumplimientos duros
  if (isWhitespaceOnly(password) || hasEdgeSpaces(password) || getPasswordBytes(password) > MAX_PASSWORD_BYTES) {
    score = Math.min(score, 1);
  }
  return Math.min(4, Math.max(0, score));
}

function validatePasswordCore(value: string): string | undefined {
  if (value.length === 0) return AUTH_ERROR_MESSAGES.requiredPassword;
  if (isWhitespaceOnly(value)) return AUTH_ERROR_MESSAGES.whitespaceOnlyPassword;
  if (hasEdgeSpaces(value)) return AUTH_ERROR_MESSAGES.edgeSpacesPassword;
  if (value.length < MIN_PASSWORD_LENGTH) return AUTH_ERROR_MESSAGES.shortPassword;
  if (getPasswordBytes(value) > MAX_PASSWORD_BYTES) return AUTH_ERROR_MESSAGES.longPassword;
  if (!hasLetter(value) || !hasDigit(value)) return AUTH_ERROR_MESSAGES.passwordComplexity;
  return undefined;
}

// Registro/cambio: política completa (backend-compatible)
export function validatePassword(value: string): string | undefined {
  return validatePasswordCore(value);
}

// Login: solo no vacía, no solo espacios y máximo 72 bytes (sin revelar complejidad)
export function validateLoginPassword(value: string): string | undefined {
  if (value.length === 0) return AUTH_ERROR_MESSAGES.requiredPassword;
  if (isWhitespaceOnly(value)) return AUTH_ERROR_MESSAGES.whitespaceOnlyPassword;
  if (getPasswordBytes(value) > MAX_PASSWORD_BYTES) return AUTH_ERROR_MESSAGES.longPassword;
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (value.trim().length === 0) return AUTH_ERROR_MESSAGES.requiredEmail;
  if (!isValidEmail(value)) return AUTH_ERROR_MESSAGES.invalidEmail;
  if (value.trim().length > LIMITS.email.max) return `El correo no puede superar los ${LIMITS.email.max} caracteres.`;
  return undefined;
}

function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length === 0) return AUTH_ERROR_MESSAGES.requiredUsername;
  if (/\s/.test(value)) return AUTH_ERROR_MESSAGES.usernameNoSpaces;
  if (trimmed.length < LIMITS.username.min) return `El usuario debe tener al menos ${LIMITS.username.min} caracteres.`;
  if (trimmed.length > LIMITS.username.max) return `El usuario no puede superar los ${LIMITS.username.max} caracteres.`;
  return undefined;
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  return {
    username: validateUsername(values.username),
    password: validateLoginPassword(values.password),
  };
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  const name = values.name.trim();
  return {
    name:
      name.length === 0
        ? AUTH_ERROR_MESSAGES.requiredName
        : name.length < LIMITS.personName.min
          ? `El nombre debe tener al menos ${LIMITS.personName.min} caracteres.`
          : name.length > LIMITS.personName.max
            ? `El nombre no puede superar los ${LIMITS.personName.max} caracteres.`
            : undefined,
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword:
      values.confirmPassword.length === 0
        ? AUTH_ERROR_MESSAGES.requiredConfirmPassword
        : values.confirmPassword !== values.password
          ? AUTH_ERROR_MESSAGES.passwordMismatch
          : undefined,
  };
}
