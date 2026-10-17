import {
  BarChart3,
  Building2,
  CalendarCheck,
  ClipboardList,
  FileText,
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
  label: string | null;
  items: NavItem[];
  roles: UserRole[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'personal',
    label: null,
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

export const SIDEBAR_EXTRA_ITEMS: NavItem[] = [
  { label: 'Soporte', path: ROUTES.settings, icon: Building2 },
  { label: 'Documentación', path: ROUTES.settings, icon: FileText },
];
