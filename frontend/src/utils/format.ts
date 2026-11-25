import { CURRENCY, CURRENCY_LOCALE } from '../constants';

const moneyFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat(CURRENCY_LOCALE);

/**
 * Formatea importes monetarios que llegan como TEXTO desde el backend.
 * Nunca realiza operaciones con + sobre estos strings.
 */
export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0,00';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return moneyFormatter.format(num);
}

export function formatCurrency(value: number): string {
  return formatter.format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return decimalFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k €`;
  return formatCurrency(value);
}

