import { format, formatDistanceStrict, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DATE_FORMAT_LONG, DATE_FORMAT_MONTH, DATE_FORMAT_SHORT } from '../constants';

/**
 * Extrae las partes locales de una fecha DATE que llega en UTC medianoche ("YYYY-MM-DDT04:00:00.000Z")
 * Retorna siempre "YYYY-MM-DD" para inputs o comparaciones sin desface de zona horaria.
 */
export function fechaLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/**
 * Formatea una fecha DATE del servidor para mostrar en pantalla legible (DD/MM/YYYY).
 */
export function formatFechaLocal(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ymd = fechaLocal(iso);
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Formatea un timestamptz (created_at, fecha_proceso) usando hora y fecha local.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
