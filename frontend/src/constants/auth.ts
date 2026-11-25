import { LIMITS } from './limits';

export const AUTH_BRAND_NAME = 'Onyx';
export const MIN_PASSWORD_LENGTH = LIMITS.password.min;
export const MAX_PASSWORD_BYTES = LIMITS.password.maxBytes;

export const AUTH_ERROR_MESSAGES = {
  requiredEmail: 'Introduce tu correo electrónico.',
  invalidEmail: 'El formato del correo no es válido.',
  requiredUsername: 'Introduce tu nombre de usuario.',
  usernameNoSpaces: 'El usuario no puede contener espacios.',
  requiredPassword: 'Introduce tu contraseña.',
  whitespaceOnlyPassword: 'La contraseña no puede estar formada solo por espacios.',
  edgeSpacesPassword: 'La contraseña no puede empezar ni terminar con espacios.',
  shortPassword: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  longPassword: 'La contraseña no puede superar los 72 bytes (los caracteres especiales y emojis ocupan más de uno).',
  passwordComplexity: 'Debe incluir al menos una letra y un número.',
  requiredName: 'Introduce tu nombre.',
  requiredConfirmPassword: 'Confirma tu contraseña.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  credentialsInvalid: 'El usuario o la contraseña no son válidos.',
  networkError: 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
} as const;

export const PASSWORD_STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Muy fuerte'] as const;
export const PASSWORD_STRENGTH_HINT = 'Mín. 8 caracteres, con letra y número';
