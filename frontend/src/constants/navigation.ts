import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  FolderCog,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../types';
import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  roles: UserRole[];
}

// Cada grupo corresponde a un rol: 'personal' es el bloque del usuario estándar
// y 'administracion' el del superusuario. El sidebar muestra abierto el grupo
// del perfil activo y deja el resto plegado (acordeón), para reducir la carga
// visual de la navegación.
export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'personal',
    label: 'Mi espacio',
    roles: ['user', 'superuser'],
    items: [
      { label: 'Inicio', path: ROUTES.dashboard, icon: LayoutDashboard },
      { label: 'Mi perfil', path: ROUTES.profile, icon: UserRound },
      { label: 'Mis recibos', path: ROUTES.payslips, icon: Wallet },
      { label: 'Mi asistencia', path: ROUTES.attendance, icon: CalendarCheck },
      { label: 'Mis solicitudes', path: ROUTES.requests, icon: ClipboardList },
      { label: 'Configuración', path: ROUTES.settings, icon: Settings },
    ],
  },
  {
    id: 'registro',
    label: 'Gestión de personas',
    roles: ['rrhh'],
    items: [
      { label: 'Registrar personas', path: ROUTES.adminRegistration, icon: UserPlus },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    roles: ['superuser'],
    items: [
      { label: 'Panel general', path: ROUTES.adminHome, icon: ShieldCheck },
      { label: 'Registrar personas', path: ROUTES.adminRegistration, icon: UserPlus },
      { label: 'Empleados', path: ROUTES.adminEmployees, icon: Users },
      { label: 'Nómina', path: ROUTES.adminPayroll, icon: Wallet },
      { label: 'Asistencia', path: ROUTES.adminAttendance, icon: CalendarCheck },
      { label: 'Solicitudes', path: ROUTES.adminRequests, icon: ClipboardList },
      { label: 'Departamentos', path: ROUTES.adminDepartments, icon: FolderCog },
      { label: 'Reportes', path: ROUTES.adminReports, icon: BarChart3 },
    ],
  },
];

// Grupo que corresponde a cada rol: se abre por defecto y, en el sidebar
// colapsado, es el único cuyos iconos se muestran.
export const ROLE_SECTION_ID: Record<UserRole, string> = {
  user: 'personal',
  rrhh: 'registro',
  superuser: 'administracion',
};
