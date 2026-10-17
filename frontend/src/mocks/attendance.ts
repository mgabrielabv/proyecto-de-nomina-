import { getDate, getDay, getDaysInMonth, startOfMonth } from 'date-fns';
import type { AttendanceEntry, AttendanceStatus, Employee } from '../types';
import { EMPLOYEES } from './employees';

function noise(seed: number): number {
  const value = Math.sin(seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export const FERIADO_DATES = ['2026-10-12', '2026-11-01', '2026-12-06'];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function statusFor(seed: number, weekday: number): AttendanceStatus {
  const roll = noise(seed);
  if (roll > 0.93) return 'ausente';
  if (roll > 0.86) return 'permiso';
  if (roll > 0.78) return 'retardo';
  void weekday;
  return 'presente';
}

export function buildMonthEntries(employee: Pick<Employee, 'id'>, month: Date): AttendanceEntry[] {
  const days = getDaysInMonth(month);
  const monthStart = startOfMonth(month);
  const employeeSeed = Number(employee.id.replace('e', '')) * 31;
  const entries: AttendanceEntry[] = [];

  for (let day = 1; day <= days; day += 1) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const weekday = getDay(date);
    const iso = `${monthStart.getFullYear()}-${pad(monthStart.getMonth() + 1)}-${pad(day)}`;
    if (weekday === 0 || weekday === 6) continue;

    const status: AttendanceStatus = FERIADO_DATES.includes(iso)
      ? 'feriado'
      : statusFor(employeeSeed + getDate(date), weekday);

    const lateMinutes = status === 'retardo' ? Math.round(noise(employeeSeed + day * 3) * 35) + 5 : 0;
    const checkIn = status === 'presente' || status === 'retardo' ? `${lateMinutes > 0 ? '09:' + pad(Math.min(59, lateMinutes)) : '08:' + pad(40 + Math.round(noise(employeeSeed + day) * 19))}` : null;
    const checkOut = status === 'presente' || status === 'retardo' ? `18:${pad(Math.round(noise(employeeSeed + day * 7) * 59))}` : null;

    entries.push({ id: `${employee.id}-${iso}`, employeeId: employee.id, date: iso, status, checkIn, checkOut, lateMinutes });
  }

  return entries;
}

export function buildAllEntries(month: Date, employees: Array<Pick<Employee, 'id'>> = EMPLOYEES): AttendanceEntry[] {
  return employees.flatMap((employee) => buildMonthEntries(employee, month));
}
