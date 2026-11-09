import { execute } from '../../auth/services/apiClient';
import type { PerfilItem } from '../../payroll/services/payrollService';

export interface MetodoCatalogoItem {
  id: number;
  subsistema: string;
  clase: string;
  metodo: string;
  descripcion?: string | null;
  critico: boolean;
}

export interface PermisoMetodoItem extends MetodoCatalogoItem {
  asignado: boolean;
}

export interface PermisosMetodoResponse {
  perfil: PerfilItem;
  metodos: PermisoMetodoItem[];
}

export interface AsignarPermisoResponse {
  perfilId: number;
  perfil: string;
  metodoId: number;
  subsistema: string;
  clase: string;
  metodo: string;
  asignado: boolean;
  yaEstaba: boolean;
}

export interface QuitarPermisoResponse {
  perfilId: number;
  perfil: string;
  metodoId: number;
  subsistema: string;
  clase: string;
  metodo: string;
  asignado: boolean;
  yaNoEstaba: boolean;
}

export const PermissionService = {
  listarPerfiles: () =>
    execute<PerfilItem[]>('Security', 'User', 'listarPerfiles', []),

  listarMetodos: () =>
    execute<MetodoCatalogoItem[]>('Security', 'Admin', 'listarMetodos', []),

  listarPermisosMetodo: (perfilId: number) =>
    execute<PermisosMetodoResponse>('Security', 'Admin', 'listarPermisosMetodo', [perfilId]),

  asignarPermisoMetodo: (perfilId: number, metodoId: number) =>
    execute<AsignarPermisoResponse>('Security', 'Admin', 'asignarPermisoMetodo', [
      perfilId,
      metodoId,
    ]),

  quitarPermisoMetodo: (perfilId: number, metodoId: number) =>
    execute<QuitarPermisoResponse>('Security', 'Admin', 'quitarPermisoMetodo', [
      perfilId,
      metodoId,
    ]),
};


