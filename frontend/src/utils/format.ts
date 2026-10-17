import { CURRENCY, CURRENCY_LOCALE } from '../constants';

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
