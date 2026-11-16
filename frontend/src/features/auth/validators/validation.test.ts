import { describe, expect, it } from 'vitest';
import { AUTH_ERROR_MESSAGES } from '../../../constants';
import { getPasswordIssues, getPasswordStrengthScore, validateLogin, validateRegister } from './validation';

describe('getPasswordIssues', () => {
  it('marca requisitos correctamente para contraseña válida', () => {
    const issues = getPasswordIssues('Abcdef12');
    expect(issues.every((i) => i.ok)).toBe(true);
  });

  it('detecta espacios al inicio/final y solo espacios', () => {
    expect(getPasswordIssues(' Abcdef12').find((i) => i.id === 'noEdgeSpaces')?.ok).toBe(false);
    expect(getPasswordIssues('Abcdef12 ').find((i) => i.id === 'noEdgeSpaces')?.ok).toBe(false);
    expect(getPasswordIssues('        ').find((i) => i.id === 'noEdgeSpaces')?.ok).toBe(false);
  });

  it('valida bytes UTF-8', () => {
    expect(getPasswordIssues('ñ'.repeat(37) + 'a1').find((i) => i.id === 'maxBytes')?.ok).toBe(false);
    expect(getPasswordIssues('ñ'.repeat(30) + 'a1').find((i) => i.id === 'maxBytes')?.ok).toBe(true);
  });
});

describe('getPasswordStrengthScore', () => {
  it('no puntúa como aceptable o mejor contraseñas inválidas débiles', () => {
    expect(getPasswordStrengthScore('        ')).toBeLessThan(2);
    expect(getPasswordStrengthScore('abcdefgh')).toBeLessThan(2);
    expect(getPasswordStrengthScore('12345678')).toBeLessThan(2);
  });
});

describe('validateRegister (contraseña)', () => {
  const base = { name: 'Juan Perez', email: 'juan@example.com', confirmPassword: '' };

  it('rechaza vacía', () => {
    const errs = validateRegister({ ...base, password: '', confirmPassword: '' });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.requiredPassword);
  });

  it('rechaza solo espacios (8 espacios)', () => {
    const pwd = '        ';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.whitespaceOnlyPassword);
  });

  it('rechaza 8 tabs', () => {
    const pwd = '\t\t\t\t\t\t\t\t';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.whitespaceOnlyPassword);
  });

  it('rechaza 8 NBSP', () => {
    const pwd = '\u00A0'.repeat(8);
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.whitespaceOnlyPassword);
  });

  it('rechaza espacio inicial', () => {
    const pwd = ' Abcdef12';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.edgeSpacesPassword);
  });

  it('rechaza espacio final', () => {
    const pwd = 'Abcdef12 ';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.edgeSpacesPassword);
  });

  it('rechaza menor a 8 caracteres', () => {
    const pwd = 'Abcdef1';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.shortPassword);
  });

  it('rechaza solo letras', () => {
    const pwd = 'abcdefgh';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.passwordComplexity);
  });

  it('rechaza solo números', () => {
    const pwd = '12345678';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.passwordComplexity);
  });

  it('acepta contraseña válida básica', () => {
    const pwd = 'Abcdef12';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBeUndefined();
    expect(errs.confirmPassword).toBeUndefined();
  });

  it('acepta passphrase con espacios internos', () => {
    const pwd = 'mi clave 2026';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBeUndefined();
  });

  it('rechaza 73+ bytes UTF-8 con ñ', () => {
    const pwd = 'ñ'.repeat(37) + 'a1';
    expect(new TextEncoder().encode(pwd).length).toBeGreaterThan(72);
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.longPassword);
  });

  it('acepta 62 bytes UTF-8 válida', () => {
    const pwd = 'ñ'.repeat(30) + 'a1';
    const bytes = new TextEncoder().encode(pwd).length;
    expect(bytes).toBeLessThanOrEqual(72);
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBeUndefined();
  });

  it('rechaza emoji repetido que excede 72 bytes', () => {
    const pwd = '😀'.repeat(20) + 'a1';
    expect(new TextEncoder().encode(pwd).length).toBeGreaterThan(72);
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.longPassword);
  });

  it('rechaza 200 caracteres (por bytes/longitud permitida en política)', () => {
    const pwd = 'A'.repeat(198) + 'a1';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: pwd });
    expect(errs.password).toBe(AUTH_ERROR_MESSAGES.longPassword);
  });

  it('confirmación compara igualdad estricta sin trim', () => {
    const pwd = 'Abcdef12';
    const errs = validateRegister({ ...base, password: pwd, confirmPassword: ' Abcdef12' });
    expect(errs.confirmPassword).toBe(AUTH_ERROR_MESSAGES.passwordMismatch);
  });
});

describe('validateLogin (contraseña)', () => {
  const base = { username: 'usuario' };

  it('rechaza vacía', () => {
    expect(validateLogin({ ...base, password: '' }).password).toBe(AUTH_ERROR_MESSAGES.requiredPassword);
  });

  it('rechaza solo espacios', () => {
    expect(validateLogin({ ...base, password: '        ' }).password).toBe(
      AUTH_ERROR_MESSAGES.whitespaceOnlyPassword,
    );
  });

  it('rechaza 73+ bytes', () => {
    const pwd = 'ñ'.repeat(37) + 'a1';
    expect(validateLogin({ ...base, password: pwd }).password).toBe(AUTH_ERROR_MESSAGES.longPassword);
  });

  it('no aplica complejidad en login (usuarios antiguos)', () => {
    expect(validateLogin({ ...base, password: 'abcdefgh' }).password).toBeUndefined();
    expect(validateLogin({ ...base, password: '12345678' }).password).toBeUndefined();
  });
});
