import { AUTH_ERROR_MESSAGES, MIN_PASSWORD_LENGTH } from '../../../constants';
import type { FieldErrors, LoginValues, RegisterValues } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
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

export function getPasswordStrengthScore(password: string): number {
  let score = 0;
  if (hasMinLength(password, MIN_PASSWORD_LENGTH)) score += 1;
  if (hasMixedCase(password)) score += 1;
  if (hasDigit(password)) score += 1;
  if (hasSymbol(password)) score += 1;
  return score;
}

function validatePassword(value: string): string | undefined {
  if (value.trim().length === 0) return AUTH_ERROR_MESSAGES.requiredPassword;
  if (!hasMinLength(value, MIN_PASSWORD_LENGTH)) return AUTH_ERROR_MESSAGES.shortPassword;
  return undefined;
}

function validateEmail(value: string): string | undefined {
  if (value.trim().length === 0) return AUTH_ERROR_MESSAGES.requiredEmail;
  if (!isValidEmail(value)) return AUTH_ERROR_MESSAGES.invalidEmail;
  return undefined;
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  return {
    username: values.username.trim().length === 0 ? AUTH_ERROR_MESSAGES.requiredUsername : undefined,
    password: validatePassword(values.password),
  };
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  return {
    name: values.name.trim().length === 0 ? AUTH_ERROR_MESSAGES.requiredName : undefined,
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword:
      values.confirmPassword.trim().length === 0
        ? AUTH_ERROR_MESSAGES.requiredConfirmPassword
        : values.confirmPassword !== values.password
          ? AUTH_ERROR_MESSAGES.passwordMismatch
          : undefined,
  };
}