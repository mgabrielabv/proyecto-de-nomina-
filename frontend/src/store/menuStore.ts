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
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { SecurityService, type MenuOption } from '../features/payroll/services';
import { useSessionStore } from './sessionStore';
import type { NavItem, NavSection } from '../constants';

export interface DynamicNavOption extends MenuOption {
  path: string;
  icon: LucideIcon;
}

const MENU_ROUTE_MAP: Record<string, { path: string; icon: LucideIcon }> = {
  Periodos: { path: '/payroll/periodos', icon: CalendarCheck },
  Horas: { path: '/payroll/horas', icon: Clock },
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
      let options = Array.isArray(rawOptions) ? [...rawOptions] : [];

      // La opción "Permisos" aparece en el menú solo para Superusuario
      const user = useSessionStore.getState().user;
      const isSuperuser = user?.profiles?.some((p) => p.nombre === 'Superusuario');

      if (isSuperuser) {
        if (!options.some((o) => o.nombre === 'Permisos')) {
          options.push({
            id: 9999,
            nombre: 'Permisos',
            descripcion: 'Asignación de permisos por método',
            subsistema: 'Security',
          });
        }
      } else {
        options = options.filter((o) => o.nombre !== 'Permisos');
      }

      // Agrupar por subsistema
      const groups = new Map<string, NavItem[]>();

      options.forEach((opt) => {
        const config = MENU_ROUTE_MAP[opt.nombre] ?? {
          path: `/payroll/${opt.nombre.toLowerCase()}`,
          icon: FileText,
        };
        const subsistema = opt.subsistema || 'Nómina';
        const items = groups.get(subsistema) ?? [];
        items.push({
          label: opt.nombre,
          path: config.path,
          icon: config.icon,
        });
        groups.set(subsistema, items);
      });

      const sections: NavSection[] = Array.from(groups.entries()).map(([sub, items], idx) => ({
        id: `subsystem-${idx}-${sub.toLowerCase()}`,
        label: sub === 'Payroll' ? 'Nómina' : sub,
        items,
        roles: ['user', 'rrhh', 'superuser'],
      }));

      set({ options, sections, loading: false });
    } catch (err: any) {
      set({
        options: [],
        sections: [],
        loading: false,
        error: err?.message ?? 'No se pudo cargar el menú',
      });
    }
  },

  clearMenu: () => set({ options: [], sections: [], loading: false, error: null }),
}));


