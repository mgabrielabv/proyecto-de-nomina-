export const AUTH_BRAND_NAME = 'Onyx';
export const MIN_PASSWORD_LENGTH = 8;

export const AUTH_ERROR_MESSAGES = {
  requiredEmail: 'Introduce tu correo electrónico.',
  invalidEmail: 'El formato del correo no es válido.',
  requiredUsername: 'Introduce tu nombre de usuario.',
  requiredPassword: 'Introduce tu contraseña.',
  shortPassword: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  requiredName: 'Introduce tu nombre.',
  requiredConfirmPassword: 'Confirma tu contraseña.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  credentialsInvalid: 'El usuario o la contraseña no son válidos.',
  networkError: 'No se pudo conectar con el servidor. Inténtalo de nuevo.',
} as const;

export const PASSWORD_STRENGTH_LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Muy fuerte'] as const;
export const PASSWORD_STRENGTH_HINT = 'Mín. 8 caracteres';
