export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  profile: '/profile',
  payslips: '/payroll',
  attendance: '/attendance',
  requests: '/requests',
  settings: '/settings',
  adminHome: '/admin',
  adminRegistration: '/admin/registration',
  adminEmployees: '/admin/employees',
  adminPayroll: '/admin/payroll',
  adminAttendance: '/admin/attendance',
  adminRequests: '/admin/requests',
  adminDepartments: '/admin/departments',
  adminReports: '/admin/reports',
} as const;

export const PROTECTED_BASE = ROUTES.dashboard;
export const ADMIN_BASE = ROUTES.adminHome;

export const PAGE_TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Inicio',
  [ROUTES.profile]: 'Mi perfil',
  [ROUTES.payslips]: 'Mis recibos de nómina',
  [ROUTES.attendance]: 'Mi asistencia',
  [ROUTES.requests]: 'Mis solicitudes',
  [ROUTES.settings]: 'Configuración',
  [ROUTES.adminHome]: 'Panel administrativo',
  [ROUTES.adminRegistration]: 'Registrar personas',
  [ROUTES.adminEmployees]: 'Empleados',
  [ROUTES.adminPayroll]: 'Nómina',
  [ROUTES.adminAttendance]: 'Asistencia',
  [ROUTES.adminRequests]: 'Solicitudes',
  [ROUTES.adminDepartments]: 'Departamentos y cargos',
  [ROUTES.adminReports]: 'Reportes',
};
