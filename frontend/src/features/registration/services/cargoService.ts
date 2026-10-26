import { execute } from '../../auth/services/apiClient';

export interface Cargo {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export async function listCargos(): Promise<Cargo[]> {
  const result = await execute<Cargo[]>('Security', 'User', 'listarCargos', []);
  return Array.isArray(result) ? result : [];
}
