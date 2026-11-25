import { addMonths, format, startOfMonth } from 'date-fns';
import type { Employee, PayrollPeriod, PayrollPeriodType, PayrollReceipt } from '../types';
import { EMPLOYEES } from './employees';

export const PAYROLL_MONTHS_BACK = 6;

function noise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function buildPeriods(type: PayrollPeriodType, reference: Date = new Date()): PayrollPeriod[] {
  const periods: PayrollPeriod[] = [];
  for (let index = 0; index < PAYROLL_MONTHS_BACK; index += 1) {
    const monthDate = startOfMonth(addMonths(reference, -index));
    if (type === 'mensual') {
      periods.push({
        key: `m-${format(monthDate, 'yyyy-MM')}`,
        label: format(monthDate, 'LLLL yyyy'),
        type,
        rangeLabel: `${format(monthDate, 'dd/MM')} – ${format(addMonths(monthDate, 1), 'dd/MM')}`,
      });
    } else {
      const secondHalfStart = format(monthDate, 'yyyy-MM-16');
      const monthEnd = format(addMonths(monthDate, 1), 'yyyy-MM-01');
      periods.push({
        key: `q2-${format(monthDate, 'yyyy-MM')}`,
        label: `${format(monthDate, 'LLL')} · Quincena 2`,
        type,
        rangeLabel: `${secondHalfStart.slice(8)}/16 – ${monthEnd.slice(8)}/01`,
      });
      periods.push({
        key: `q1-${format(monthDate, 'yyyy-MM')}`,
        label: `${format(monthDate, 'LLL')} · Quincena 1`,
        type,
        rangeLabel: `01 – 15 ${format(monthDate, 'MMM')}`,
      });
    }
  }
  return periods;
}

export function periodLabelFromKey(key: string): string {
  const monthKey = key.split('-').slice(-2).join('-');
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const prefix = key.startsWith('q1') ? 'Quincena 1' : key.startsWith('q2') ? 'Quincena 2' : '';
  const base = format(date, 'LLLL yyyy');
  return prefix ? `${base} · ${prefix}` : base;
}

function divisorFor(type: PayrollPeriodType): number {
  return type === 'quincenal' ? 24 : 12;
}

function statusFor(periodKey: string, type: PayrollPeriodType): PayrollReceipt['status'] {
  const periodMonth = periodKey.split('-').slice(-2).join('-');
  const isCurrentMonth = periodMonth === format(new Date(), 'yyyy-MM');
  if (!isCurrentMonth) return 'pagada';
  if (type === 'quincenal' && periodKey.startsWith('q1')) return 'aprobada';
  return 'borrador';
}

export function buildReceipt(employee: Employee, period: PayrollPeriod): PayrollReceipt {
  const seedBase = Number(employee.id.replace('e', '')) * 97 + period.key.length * 13;
  const monthlyFactor = divisorFor(period.type);
  const baseSalary = round(employee.baseSalary / monthlyFactor);
  const bonus = round(baseSalary * (0.03 + noise(seedBase) * 0.09));
  const overtimeHours = Math.round(noise(seedBase + 3) * 10) / 2;
  const hourly = round(employee.baseSalary / 176);
  const overtimePay = round(hourly * 1.5 * overtimeHours);
  const grossPay = round(baseSalary + bonus + overtimePay);
  const taxDeduction = round(grossPay * (0.17 + noise(seedBase + 5) * 0.04));
  const insuranceDeduction = round(grossPay * 0.065);
  const otherDeductions = round(grossPay * noise(seedBase + 7) * 0.02);
  const totalDeductions = round(taxDeduction + insuranceDeduction + otherDeductions);

  return {
    id: `${period.key}-${employee.id}`,
    employeeId: employee.id,
    periodKey: period.key,
    periodLabel: period.label,
    periodType: period.type,
    baseSalary,
    bonus,
    overtimeHours,
    overtimePay,
    taxDeduction,
    insuranceDeduction,
    otherDeductions,
    grossPay,
    totalDeductions,
    netPay: round(grossPay - totalDeductions),
    status: statusFor(period.key, period.type),
  };
}

export function buildReceipts(period: PayrollPeriod, employees: Employee[] = EMPLOYEES): PayrollReceipt[] {
  return employees.map((employee) => buildReceipt(employee, period));
}
