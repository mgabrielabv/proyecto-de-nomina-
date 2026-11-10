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

/* ==============================================================================
 * ETIQUETAS Y TONOS DE LOS ENUMS DEL SUBSISTEMA PAYROLL
 * La UI muestra la etiqueta en español; el valor exacto del enum viaja al backend.
 * ============================================================================== */

export type PeriodoEstado = 'BORRADOR' | 'PROCESADO' | 'PAGADO';

export const PERIODO_ESTADO_LABEL: Record<PeriodoEstado, string> = {
  BORRADOR: 'Borrador',
  PROCESADO: 'Procesado',
  PAGADO: 'Pagado',
};

export const PERIODO_ESTADO_TONE: Record<PeriodoEstado, BadgeTone> = {
  BORRADOR: 'neutral',
  PROCESADO: 'warning',
  PAGADO: 'success',
};

export type NovedadEstado = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'APLICADA';

export const NOVEDAD_ESTADO_LABEL: Record<NovedadEstado, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  APLICADA: 'Aplicada',
};

export const NOVEDAD_ESTADO_TONE: Record<NovedadEstado, BadgeTone> = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  RECHAZADA: 'error',
  APLICADA: 'success',
};

export type PrestamoEstado = 'SOLICITADO' | 'ACTIVO' | 'PAGADO' | 'ANULADO';

export const PRESTAMO_ESTADO_LABEL: Record<PrestamoEstado, string> = {
  SOLICITADO: 'Solicitado',
  ACTIVO: 'Activo',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

export const PRESTAMO_ESTADO_TONE: Record<PrestamoEstado, BadgeTone> = {
  SOLICITADO: 'warning',
  ACTIVO: 'success',
  PAGADO: 'success',
  ANULADO: 'error',
};

export type AfiliacionEstado = 'ACTIVO' | 'BAJA';

export const AFILIACION_ESTADO_LABEL: Record<AfiliacionEstado, string> = {
  ACTIVO: 'Activo',
  BAJA: 'Baja',
};

export const AFILIACION_ESTADO_TONE: Record<AfiliacionEstado, BadgeTone> = {
  ACTIVO: 'success',
  BAJA: 'neutral',
};

export type ReciboEstado = 'BORRADOR' | 'PROCESADO' | 'PAGADO' | 'ANULADO';

export const RECIBO_ESTADO_LABEL: Record<ReciboEstado, string> = {
  BORRADOR: 'Borrador',
  PROCESADO: 'Procesado',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
};

export const RECIBO_ESTADO_TONE: Record<ReciboEstado, BadgeTone> = {
  BORRADOR: 'neutral',
  PROCESADO: 'warning',
  PAGADO: 'success',
  ANULADO: 'error',
};

export const FRECUENCIA_LABEL = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
} as const;

export const METODO_PAGO_LABEL = {
  TRANSFERENCIA: 'Transferencia bancaria',
  PAGO_MOVIL: 'Pago móvil',
  EFECTIVO: 'Efectivo',
  CHEQUE: 'Cheque',
} as const;

export type TipoConcepto = 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL';

export const TIPO_CONCEPTO_LABEL: Record<TipoConcepto, string> = {
  ASIGNACION: 'Asignación',
  DEDUCCION: 'Deducción',
  APORTE_PATRONAL: 'Aporte patronal',
};

export const TIPO_CONCEPTO_TONE: Record<TipoConcepto, BadgeTone> = {
  ASIGNACION: 'success',
  DEDUCCION: 'error',
  APORTE_PATRONAL: 'warning',
};

export const TIPO_VALOR_LABEL = {
  MONTO_FIJO: 'Monto fijo',
  PORCENTAJE_SALARIO: 'Porcentaje del salario',
} as const;

export const REQUEST_TYPE_LABEL = { vacaciones: 'Vacaciones', permiso: 'Permiso' } as const;

export const CONTRACT_TYPE_LABEL = {
  indefinido: 'Indefinido',
  temporal: 'Temporal',
  practicas: 'Prácticas',
  becario: 'Becario',
} as const;

export const ROLE_LABEL = { user: 'Usuario', rrhh: 'RRHH', superuser: 'Superusuario' } as const;
