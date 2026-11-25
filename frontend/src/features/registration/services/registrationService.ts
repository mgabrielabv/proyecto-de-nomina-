import { ApiError, execute } from '../../auth/services/apiClient';

export type MaritalStatus = 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'CONCUBINO';
export type Sex = 'M' | 'F';
export type PaymentType = 'POR_HORA' | 'SALARIO_FIJO';
export type PaymentFrequency = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';

export interface LaborData {
  cargo_id: number;
  fecha_inicio: string;
  tipo_pago: PaymentType;
  frecuencia_pago: PaymentFrequency;
  monto: number;
  horas_semanales?: number;
  fecha_fin?: string;
  vigente_desde?: string;
  vigente_hasta?: string;
  motivo?: string;
}

export interface RegistrationPayload {
  cedula: string;
  primer_nombre: string;
  primer_apellido: string;
  username: string;
  password: string;
  perfiles: number[];
  segundo_nombre?: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  sexo?: Sex;
  estado_civil?: MaritalStatus;
  nro_tlf?: string;
  email?: string;
  direccion?: string;
  laboral?: LaborData;
}

export interface RegistrationResult {
  ok: boolean;
  error?: string;
}

export async function registerPerson(payload: RegistrationPayload): Promise<RegistrationResult> {
  try {
    await execute('Security', 'User', 'registrar', [payload]);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: 'No se pudo registrar la persona. Inténtalo de nuevo.' };
  }
}
