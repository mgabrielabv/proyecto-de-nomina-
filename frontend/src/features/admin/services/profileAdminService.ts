import { execute } from '../../auth/services/apiClient';
import type { PersonaItem } from '../../payroll/services';

/* ==============================================================================
 * ADMINISTRACIÓN DE PERFILES (spec 010)
 * Ciclo de vida de perfiles y asignación de perfiles a usuarios vía
 * Security/Admin y Security/User en POST /api/execute.
 * ============================================================================== */

export interface PerfilAdminItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  protegido: boolean;
  usuarios: number;
  usuariosActivos: number;
}

export interface PerfilBase {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  protegido: boolean;
}

export interface CrearPerfilResult extends PerfilBase {
  permisosBase: number;
  permisosMetodo?: number;
  permisosOpcion?: number;
}

export interface PerfilAsignado {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface PerfilesUsuarioResult {
  usuarioId: string;
  username: string;
  // listarPerfilesUsuario lo devuelve; establecerPerfilesUsuario no.
  activo?: boolean;
  perfiles: PerfilAsignado[];
}

export const ProfileAdminService = {
  listarPerfiles: () =>
    execute<PerfilAdminItem[]>('Security', 'Admin', 'listarPerfilesAdmin', []),

  crearPerfil: (
    nombre: string,
    descripcion: string | null,
    perfilPlantillaId: number | null = null,
  ) =>
    execute<CrearPerfilResult>('Security', 'Admin', 'crearPerfil', [
      nombre,
      descripcion,
      perfilPlantillaId,
    ]),

  editarPerfil: (perfilId: number, nombre: string, descripcion: string | null) =>
    execute<PerfilBase>('Security', 'Admin', 'editarPerfil', [
      perfilId,
      nombre,
      descripcion,
    ]),

  cambiarEstadoPerfil: (perfilId: number, activo: boolean) =>
    execute<PerfilBase & { cambio: boolean }>(
      'Security',
      'Admin',
      'cambiarEstadoPerfil',
      [perfilId, activo],
    ),

  listarPersonas: () =>
    execute<PersonaItem[]>('Security', 'User', 'listarPersonas', []),

  listarPerfilesUsuario: (usuarioId: string) =>
    execute<PerfilesUsuarioResult>('Security', 'User', 'listarPerfilesUsuario', [
      usuarioId,
    ]),

  establecerPerfilesUsuario: (usuarioId: string, perfiles: number[]) =>
    execute<PerfilesUsuarioResult>(
      'Security',
      'User',
      'establecerPerfilesUsuario',
      [usuarioId, perfiles],
    ),
};
