import { execute } from '../../auth/services/apiClient';

/* ==============================================================================
 * CATÁLOGO DE OPCIONES DE MENÚ Y ASIGNACIÓN PERFIL ↔ OPCIÓN (spec 011)
 * Ocho métodos solo para Superusuario vía Security/Admin en POST /api/execute.
 * ============================================================================== */

export interface SubsistemaAdminItem {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface OpcionAdminItem {
  id: number;
  subsistemaId: number;
  subsistema: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo: boolean;
  protegida: boolean;
  perfiles?: number;
}

export interface PermisoOpcionItem {
  id: number;
  subsistemaId: number;
  subsistema: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  activo?: boolean; // la respuesta actual del backend puede omitirlo
  protegida: boolean;
  asignado: boolean;
}

export interface PermisosOpcionResponse {
  perfil: { id: number; nombre: string; descripcion: string | null };
  opciones: PermisoOpcionItem[];
}

export interface AsignarPermisoOpcionResponse {
  perfilId: number;
  perfil: string;
  opcionId: number;
  subsistema: string;
  opcion: string;
  asignado: boolean;
  yaEstaba: boolean;
}

export interface QuitarPermisoOpcionResponse {
  perfilId: number;
  perfil: string;
  opcionId: number;
  subsistema: string;
  opcion: string;
  asignado: boolean;
  yaNoEstaba: boolean;
}

export const OptionService = {
  listarSubsistemas: () =>
    execute<SubsistemaAdminItem[]>('Security', 'Admin', 'listarSubsistemas', []),

  listarOpciones: () =>
    execute<OpcionAdminItem[]>('Security', 'Admin', 'listarOpciones', []),

  crearOpcion: (
    subsistemaId: number,
    nombre: string,
    descripcion: string | null,
    orden: number,
  ) =>
    execute<OpcionAdminItem>('Security', 'Admin', 'crearOpcion', [
      subsistemaId,
      nombre,
      descripcion,
      orden,
    ]),

  editarOpcion: (
    opcionId: number,
    nombre: string,
    descripcion: string | null,
    orden: number,
  ) =>
    execute<OpcionAdminItem>('Security', 'Admin', 'editarOpcion', [
      opcionId,
      nombre,
      descripcion,
      orden,
    ]),

  cambiarEstadoOpcion: (opcionId: number, activo: boolean) =>
    execute<OpcionAdminItem & { cambio: boolean }>(
      'Security',
      'Admin',
      'cambiarEstadoOpcion',
      [opcionId, activo],
    ),

  listarPermisosOpcion: (perfilId: number) =>
    execute<PermisosOpcionResponse>('Security', 'Admin', 'listarPermisosOpcion', [
      perfilId,
    ]),

  asignarPermisoOpcion: (perfilId: number, opcionId: number) =>
    execute<AsignarPermisoOpcionResponse>(
      'Security',
      'Admin',
      'asignarPermisoOpcion',
      [perfilId, opcionId],
    ),

  quitarPermisoOpcion: (perfilId: number, opcionId: number) =>
    execute<QuitarPermisoOpcionResponse>(
      'Security',
      'Admin',
      'quitarPermisoOpcion',
      [perfilId, opcionId],
    ),
};
