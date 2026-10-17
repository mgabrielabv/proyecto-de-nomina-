import type { AttendanceStatus, PayrollStatus, RequestStatus } from '../types';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'error';

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export const REQUEST_STATUS_TONE: Record<RequestStatus, BadgeTone> = {
  pendiente: 'warning',
  aprobada: 'success',
  rechazada: 'error',
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  presente: 'Presente',
  ausente: 'Ausente',
  permiso: 'Permiso',
  feriado: 'Feriado',
  retardo: 'Retardo',
};

export const ATTENDANCE_STATUS_TONE: Record<AttendanceStatus, BadgeTone> = {
  presente: 'success',
  ausente: 'error',
  permiso: 'warning',
  feriado: 'neutral',
  retardo: 'warning',
};

export const PAYROLL_STATUS_LABEL: Record<PayrollStatus, string> = {
  borrador: 'Borrador',
  aprobada: 'Aprobada',
  pagada: 'Pagada',
};

export const PAYROLL_STATUS_TONE: Record<PayrollStatus, BadgeTone> = {
  borrador: 'neutral',
  aprobada: 'warning',
  pagada: 'success',
};

export const EMPLOYEE_STATUS_LABEL = { active: 'Activo', inactive: 'Inactivo' } as const;
export const EMPLOYEE_STATUS_TONE = { active: 'success', inactive: 'error' } as const;

export const REQUEST_TYPE_LABEL = { vacaciones: 'Vacaciones', permiso: 'Permiso' } as const;

export const CONTRACT_TYPE_LABEL = {
  indefinido: 'Indefinido',
  temporal: 'Temporal',
  practicas: 'Prácticas',
  becario: 'Becario',
} as const;

export const ROLE_LABEL = { user: 'Usuario', superuser: 'Superusuario' } as const;
