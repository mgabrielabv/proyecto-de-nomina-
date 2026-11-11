import { create } from 'zustand';
import {
  CalendarCheck,
  Clock,
  ClipboardList,
  PiggyBank,
  Layers,
  Briefcase,
  ShieldCheck,
  Receipt,
  UserPlus,
  UserRound,
  Users,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { SecurityService, type MenuOption } from '../features/payroll/services';
import type { NavItem, NavSection } from '../constants';

export interface DynamicNavOption extends MenuOption {
  path: string;
  icon: LucideIcon;
}

// Mapa de opciones de menú a rutas del frontend. El servidor es la fuente de
// verdad: no se inyectan opciones que el backend no devolvió y una opción sin
// pantalla simplemente se omite del sidebar.
const MENU_ROUTE_MAP: Record<string, { path: string; icon: LucideIcon }> = {
  Periodos: { path: '/payroll/periodos', icon: CalendarCheck },
  Horas: { path: '/payroll/horas', icon: Clock },
  HorasExtras: { path: '/payroll/horas-extras', icon: Clock },
  Novedades: { path: '/payroll/novedades', icon: ClipboardList },
  Prestamos: { path: '/payroll/prestamos', icon: PiggyBank },
  Conceptos: { path: '/payroll/conceptos', icon: Layers },
  Cargos: { path: '/payroll/cargos', icon: Briefcase },
  Afiliaciones: { path: '/payroll/afiliaciones', icon: ShieldCheck },
  MisRecibos: { path: '/payroll/mis-recibos', icon: Receipt },
  registrar: { path: '/admin/registration', icon: UserPlus },
  'Registrar personas': { path: '/admin/registration', icon: UserPlus },
  Registro: { path: '/admin/registration', icon: UserPlus },
  Permisos: { path: '/admin/permissions', icon: ShieldCheck },
  Perfiles: { path: '/admin/perfiles', icon: Users },
  Usuarios: { path: '/admin/usuarios', icon: UserRound },
  Opciones: { path: '/admin/opciones', icon: SlidersHorizontal },
};

// Etiqueta visible distinta del nombre técnico de la opción. El nombre de la
// BD se conserva porque es la llave de los mapas de permisos.
const MENU_LABEL_MAP: Record<string, string> = {
  registrar: 'Registrar personas',
};

// Etiqueta visible por subsistema; el resto se muestra tal cual.
const SUBSISTEMA_LABEL: Record<string, string> = {
  Payroll: 'Nómina',
  Security: 'Seguridad',
  Session: 'Sesión',
};

const SUBSISTEMA_PRIORITY: Record<string, number> = {
  Payroll: 0,
  Security: 1,
};

// El menú se pide por perfil activo, no por rol: 'Superusuario' y
// 'Administrador' comparten el rol 'superuser', y 'RRHH'/'GerenteRRHH'
// comparten 'rrhh'. Filtrar por rol mezclaba perfiles distintos y dejaba ver
// opciones que el perfil activo no tiene asignadas. El backend devuelve solo
// las opciones del perfil que se le manda.
//
// Caché por perfil: al cambiar de perfil se reutiliza la respuesta ya pedida
// y solo se vuelve a consultar al servidor cuando el llamador fuerza el
// refresco (por ejemplo, tras editar una opción en la administración).
const menuCache = new Map<number, { options: MenuOption[]; sections: NavSection[] }>();

interface MenuState {
  options: MenuOption[];
  sections: NavSection[];
  perfilId: number | null;
  loading: boolean;
  error: string | null;
  fetchMenu: (perfilId: number, force?: boolean) => Promise<void>;
  clearMenu: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  options: [],
  sections: [],
  perfilId: null,
  loading: false,
  error: null,

  fetchMenu: async (perfilId, force = false) => {
    // Un refresco forzado (administración de opciones) invalida toda la caché:
    // el cambio pudo afectar a cualquier perfil del usuario, no solo al activo.
    if (force) {
      menuCache.clear();
    }

    const cached = menuCache.get(perfilId);
    if (cached && !force) {
      set({
        options: cached.options,
        sections: cached.sections,
        perfilId,
        loading: false,
        error: null,
      });
      return;
    }

    set({ options: [], sections: [], perfilId, loading: true, error: null });
    try {
      const rawOptions = await SecurityService.getMenuOptions(perfilId);
      const options = Array.isArray(rawOptions) ? [...rawOptions] : [];

      // Agrupar por subsistema conservando el orden de llegada: el backend ya
      // devuelve las opciones filtradas por el perfil activo y ordenadas por
      // subsistema y orden. Las opciones sin ruta conocida se omiten (existen
      // en la BD pero no tienen pantalla en el frontend).
      const groups = new Map<string, NavItem[]>();
      const ignoradas: string[] = [];

      options.forEach((opt) => {
        const config = MENU_ROUTE_MAP[opt.nombre];
        if (!config) {
          ignoradas.push(opt.nombre);
          return;
        }
        const subsistema = opt.subsistema || 'Otros';
        const items = groups.get(subsistema) ?? [];
        items.push({
          label: MENU_LABEL_MAP[opt.nombre] ?? opt.nombre,
          path: config.path,
          icon: config.icon,
        });
        groups.set(subsistema, items);
      });

      if (ignoradas.length > 0) {
        console.warn(
          '[menu] Opciones sin ruta en el frontend, se omiten del sidebar:',
          ignoradas.join(', '),
        );
      }

      const sections: NavSection[] = Array.from(groups.entries())
        .sort(([first], [second]) => {
          const firstPriority = SUBSISTEMA_PRIORITY[first] ?? 2;
          const secondPriority = SUBSISTEMA_PRIORITY[second] ?? 2;
          return firstPriority - secondPriority;
        })
        .map(([sub, items], idx) => ({
          id: `subsystem-${idx}-${sub.toLowerCase()}`,
          label: SUBSISTEMA_LABEL[sub] ?? sub,
          items,
          roles: ['user', 'rrhh', 'superuser'],
        }));

      menuCache.set(perfilId, { options, sections });
      set((state) =>
        state.perfilId === perfilId ? { options, sections, loading: false } : state,
      );
    } catch (err) {
      set((state) =>
        state.perfilId === perfilId
          ? {
              options: [],
              sections: [],
              loading: false,
              error: err instanceof Error ? err.message : 'No se pudo cargar el menú',
            }
          : state,
      );
    }
  },

  clearMenu: () => {
    menuCache.clear();
    set({ options: [], sections: [], perfilId: null, loading: false, error: null });
  },
}));
