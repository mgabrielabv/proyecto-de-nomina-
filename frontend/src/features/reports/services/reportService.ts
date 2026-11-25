import { MOCK_LATENCY_MAX, MOCK_LATENCY_MIN, MUTATION_LATENCY_MAX, MUTATION_LATENCY_MIN } from '../../../constants';
import { buildPeriods, buildReceipts, delay, randomLatency } from '../../../mocks';
import { formatCurrency } from '../../../utils';
import { fetchEmployees } from '../../employees/services';
import type { Employee, PayrollPeriodType } from '../../../types';

type CsvRow = Record<string, string | number>;

const CSV_FORMULA_PREFIX = /^[=+\-@\t\r]/;

function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number) => {
    const text = String(value);
    // Evita que celdas de texto se interpreten como fórmulas al abrir el CSV
    // en Excel/LibreOffice. Los números se dejan intactos.
    const safe = typeof value === 'string' && CSV_FORMULA_PREFIX.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function buildEmployeesCsv(): Promise<string> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const employees = await fetchEmployees();
  const rows: CsvRow[] = employees.map((employee: Employee) => ({
    nombre: employee.name,
    correo: employee.email,
    cargo: employee.jobTitle,
    departamento: employee.departmentId,
    rol: employee.role,
    estado: employee.status,
    alta: employee.hireDate,
    salario: employee.baseSalary,
  }));
  return toCsv(rows);
}

export async function buildPayrollCsv(type: PayrollPeriodType): Promise<string> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const employees = await fetchEmployees();
  const period = buildPeriods(type)[0];
  const rows: CsvRow[] = buildReceipts(period, employees).map((receipt) => {
    const employee = employees.find((item) => item.id === receipt.employeeId);
    return {
      empleado: employee?.name ?? receipt.employeeId,
      periodo: period.label,
      bruto: formatCurrency(receipt.grossPay),
      deducciones: formatCurrency(receipt.totalDeductions),
      neto: formatCurrency(receipt.netPay),
      estado: receipt.status,
    };
  });
  return toCsv(rows);
}

export async function fetchReportSummary(): Promise<{
  active: number;
  inactive: number;
  payrollTotal: number;
  averageSalary: number;
}> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  const employees = await fetchEmployees();
  const period = buildPeriods('mensual')[0];
  const receipts = buildReceipts(period, employees);
  return {
    active: employees.filter((item) => item.status === 'active').length,
    inactive: employees.filter((item) => item.status === 'inactive').length,
    payrollTotal: receipts.reduce((total, receipt) => total + receipt.netPay, 0),
    averageSalary: Math.round(employees.reduce((total, item) => total + item.baseSalary, 0) / employees.length),
  };
}
