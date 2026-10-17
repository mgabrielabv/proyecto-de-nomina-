import { format, formatDistanceStrict, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DATE_FORMAT_LONG, DATE_FORMAT_MONTH, DATE_FORMAT_SHORT } from '../constants';

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDate(value: string): Date {
  return parseISO(value);
}

export function formatDateLong(value: string): string {
  return format(parseISO(value), DATE_FORMAT_LONG, { locale: es });
}

export function formatDateShort(value: string): string {
  return format(parseISO(value), DATE_FORMAT_SHORT, { locale: es });
}

export function formatMonth(date: Date): string {
  return format(date, DATE_FORMAT_MONTH, { locale: es });
}

export function formatDayShort(date: Date): string {
  return format(date, 'EEE d', { locale: es });
}

export function daysBetween(start: string, end: string): number {
  const days = formatDistanceStrict(parseISO(end), parseISO(start), { unit: 'day' });
  const parsed = Number.parseInt(days.split(' ')[0], 10);
  return Number.isNaN(parsed) ? 1 : parsed + 1;
}

export function isSameISODate(a: string, b: Date): boolean {
  return isSameDay(parseISO(a), b);
}
