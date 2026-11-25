import { execute } from './apiClient';

export interface SystemProfile {
  id: number;
  nombre: string;
  descripcion?: string;
}

export async function listProfiles(): Promise<SystemProfile[]> {
  const result = await execute<SystemProfile[]>('Security', 'User', 'listarPerfiles', []);
  return Array.isArray(result) ? result : [];
}
