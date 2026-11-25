import { describe, expect, it } from 'vitest';
import { isBlank, normalizeEmail, normalizeSpaces, parseMoneyToCents, sanitizeDecimalInput, trimText } from './sanitize';
import { aCentavos, centsToMoneyString, deCentavos } from './money';

describe('sanitize', () => {
  it('normalizeSpaces trim y colapsa espacios', () => {
    expect(normalizeSpaces('  Juan   Pérez  ')).toBe('Juan Pérez');
  });
  it('trimText conserva saltos internos', () => {
    expect(trimText('  hola\nmundo  ')).toBe('hola\nmundo');
  });
  it('normalizeEmail', () => {
    expect(normalizeEmail('  USER@Mail.COM ')).toBe('user@mail.com');
  });
  it('isBlank', () => {
    expect(isBlank('   \t\n')).toBe(true);
    expect(isBlank('a')).toBe(false);
  });
  it('sanitizeDecimalInput', () => {
    expect(sanitizeDecimalInput('12,345', 2)).toBe('12.34');
    expect(sanitizeDecimalInput('abc1.2x3', 2)).toBe('1.23');
    expect(sanitizeDecimalInput('-10.5', 2)).toBe('10.50'.replace(/0$/, ''));
  });
  it('parseMoneyToCents', () => {
    expect(parseMoneyToCents('10.50')).toBe(1050);
    expect(parseMoneyToCents('10,5')).toBe(1050);
  });
});

describe('money', () => {
  it('aCentavos/deCentavos', () => {
    expect(aCentavos('10.50')).toBe(1050);
    expect(aCentavos('0')).toBe(0);
    expect(deCentavos(1050)).toBe(10.5);
    expect(centsToMoneyString(1050)).toBe('10.50');
  });
});
