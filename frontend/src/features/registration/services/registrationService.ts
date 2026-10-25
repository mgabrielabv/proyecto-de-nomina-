import { ApiError, execute } from '../../auth/services/apiClient';

export type MaritalStatus = 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'CONCUBINO';
export type Sex = 'M' | 'F';

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
