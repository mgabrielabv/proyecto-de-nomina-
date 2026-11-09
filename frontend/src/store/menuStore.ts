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
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { SecurityService, type MenuOption } from '../features/payroll/services';
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
  'Registrar personas': { path: '/admin/registration', icon: UserPlus },
  Registro: { path: '/admin/registration', icon: UserPlus },
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
      const options = Array.isArray(rawOptions) ? rawOptions : [];

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

