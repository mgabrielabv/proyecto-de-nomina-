export type UserRole = 'user' | 'superuser';

export type EmployeeStatus = 'active' | 'inactive';

export type ContractType = 'indefinido' | 'temporal' | 'practicas' | 'becario';

export type RequestType = 'vacaciones' | 'permiso';

export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada';

export type AttendanceStatus = 'presente' | 'ausente' | 'permiso' | 'feriado' | 'retardo';

export type PayrollStatus = 'borrador' | 'aprobada' | 'pagada';

export type PayrollPeriodType = 'mensual' | 'quincenal';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  jobTitle: string;
  departmentId: string;
}

export interface Department {
  id: string;
  name: string;
  manager: string;
}

export interface Position {
  id: string;
  title: string;
  departmentId: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string;
  role: UserRole;
  status: EmployeeStatus;
  hireDate: string;
  contractType: ContractType;
  baseSalary: number;
}

export interface EmployeeDraft extends Omit<Employee, 'id'> {
  password: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  tag: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface PayrollReceipt {
  id: string;
  employeeId: string;
  periodKey: string;
  periodLabel: string;
  periodType: PayrollPeriodType;
  baseSalary: number;
  bonus: number;
  overtimeHours: number;
  overtimePay: number;
  taxDeduction: number;
  insuranceDeduction: number;
  otherDeductions: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
}

export interface AttendanceEntry {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  lateMinutes: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: RequestType;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  reviewComment: string;
  days: number;
}

export interface PayrollPeriod {
  key: string;
  label: string;
  type: PayrollPeriodType;
  rangeLabel: string;
}
