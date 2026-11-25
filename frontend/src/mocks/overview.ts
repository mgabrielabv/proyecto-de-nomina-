import type { Announcement, AppNotification, Department } from '../types';
import { DEPARTMENTS } from './departments';
import { EMPLOYEES } from './employees';

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Revisión anual de compensación',
    body: 'El ciclo de revisión salarial abre el lunes 20. Revisa tu perfil antes del cierre.',
    date: '2026-10-14',
    tag: 'Personas',
  },
  {
    id: 'a2',
    title: 'Nuevo horario flexible',
    body: 'A partir de noviembre, la franja central pasa a ser de 10:00 a 16:00.',
    date: '2026-10-09',
    tag: 'Política',
  },
  {
    id: 'a3',
    title: 'Mantenimiento del portal de nómina',
    body: 'El sábado entre las 02:00 y las 05:00 el portal no estará disponible.',
    date: '2026-10-03',
    tag: 'Sistema',
  },
  {
    id: 'a4',
    title: 'Jornada de bienvenida',
    body: 'Nos vemos el 24 de octubre en la planta 3 para presentar a las nuevas incorporaciones.',
    date: '2026-09-28',
    tag: 'Eventos',
  },
  {
    id: 'a5',
    title: 'Beneficio de formación 2026',
    body: 'Ya puedes solicitar hasta 1.200 € anuales para cursos y certificaciones.',
    date: '2026-09-21',
    tag: 'Beneficios',
  },
];

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Recibo de nómina disponible',
    body: 'Tu recibo de la primera quincena de octubre ya está listo.',
    date: '2026-10-15',
    read: false,
  },
  {
    id: 'n2',
    title: 'Solicitud pendiente de revisión',
    body: 'Hay solicitudes de vacaciones esperando aprobación.',
    date: '2026-10-14',
    read: false,
  },
  {
    id: 'n3',
    title: 'Recordatorio de asistencia',
    body: 'No has registrado la salida del día de ayer.',
    date: '2026-10-13',
    read: false,
  },
  {
    id: 'n4',
    title: 'Actualización de perfil',
    body: 'Rocío Prat actualizó su número de contacto.',
    date: '2026-10-11',
    read: true,
  },
  {
    id: 'n5',
    title: 'Nueva política de gastos',
    body: 'Se ha publicado la versión 3 de la política de viáticos.',
    date: '2026-10-08',
    read: true,
  },
  {
    id: 'n6',
    title: 'Bienvenida a Alba Serrano',
    body: 'Se ha unido al equipo de Ingeniería como becario.',
    date: '2026-10-06',
    read: true,
  },
];

export interface ActivityItem {
  id: string;
  text: string;
  date: string;
  meta: string;
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: 'ac1', text: 'Elena Vargas aprobó la nómina de septiembre', date: '2026-10-15', meta: 'Nómina' },
  { id: 'ac2', text: 'Alba Serrano registró entrada a las 09:04', date: '2026-10-15', meta: 'Asistencia' },
  { id: 'ac3', text: 'Marcos Ferrer solicitó 4 días de vacaciones', date: '2026-10-14', meta: 'Solicitudes' },
  { id: 'ac4', text: 'Sara Benet creó el cargo Reclutadora', date: '2026-10-13', meta: 'Estructura' },
  { id: 'ac5', text: 'Tomás Aguirre marcó un retardo de 18 min', date: '2026-10-13', meta: 'Asistencia' },
  { id: 'ac6', text: 'Rocío Prat exportó el reporte de nómina', date: '2026-10-12', meta: 'Reportes' },
  { id: 'ac7', text: 'Hugo Salas fue desactivado del sistema', date: '2026-10-11', meta: 'Empleados' },
  { id: 'ac8', text: 'Clara Ibáñez actualizó sus datos bancarios', date: '2026-10-10', meta: 'Perfil' },
];

export const WEEKLY_HOURS = [
  { week: 'S 36', horas: 38.5 },
  { week: 'S 37', horas: 40 },
  { week: 'S 38', horas: 37.5 },
  { week: 'S 39', horas: 41 },
  { week: 'S 40', horas: 39.5 },
  { week: 'S 41', horas: 36 },
  { week: 'S 42', horas: 40.5 },
  { week: 'S 43', horas: 32 },
];

export function getDepartmentDistribution(): Array<{ name: string; value: number }> {
  return DEPARTMENTS.map((department: Department) => ({
    name: department.name,
    value: EMPLOYEES.filter((employee) => employee.departmentId === department.id).length,
  }));
}
