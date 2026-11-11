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

// Etiqueta visible por subsistema; el resto se muestra tal cual.
const SUBSISTEMA_LABEL: Record<string, string> = {
  Payroll: 'Nómina',
  Security: 'Seguridad',
  Session: 'Sesión',
};

interface MenuState {
  options: MenuOption[];
  sections: NavSection[];
  loading: boolean;
  error: string | null;
  fetchMenu: () => Promise<void>;
  clearMenu: () => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  options: [],
  sections: [],
  loading: false,
  error: null,

  fetchMenu: async () => {
    set({ loading: true, error: null });
    try {
      const rawOptions = await SecurityService.getMenuOptions();
      const options = Array.isArray(rawOptions) ? [...rawOptions] : [];

      // Agrupar por subsistema conservando el orden de llegada: el backend ya
      // devuelve las opciones filtradas por los perfiles de la sesión y
      // ordenadas por subsistema y orden. Las opciones sin ruta conocida se
      // omiten (existen en la BD pero no tienen pantalla en el frontend).
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
          label: opt.nombre,
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

      const sections: NavSection[] = Array.from(groups.entries()).map(([sub, items], idx) => ({
        id: `subsystem-${idx}-${sub.toLowerCase()}`,
        label: SUBSISTEMA_LABEL[sub] ?? sub,
        items,
        roles: ['user', 'rrhh', 'superuser'],
      }));

      set({ options, sections, loading: false });
    } catch (err) {
      set({
        options: [],
        sections: [],
        loading: false,
        error: err instanceof Error ? err.message : 'No se pudo cargar el menú',
      });
    }
  },

  clearMenu: () => set({ options: [], sections: [], loading: false, error: null }),
}));
