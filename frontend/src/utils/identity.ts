import { ROUTES } from '../constants';
import type { ProfileRef, UserRole } from '../types';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function getRoleHomePath(role: UserRole): string {
  if (role === 'superuser') return ROUTES.adminHome;
  if (role === 'rrhh') return ROUTES.adminRegistration;
  return ROUTES.dashboard;
}

// Traduce el nombre del perfil del backend al rol del frontend.
export function profileToRole(nombre: string): UserRole {
  if (nombre === 'Superusuario') return 'superuser';
  if (nombre === 'RRHH') return 'rrhh';
  return 'user';
}

// Ordena los perfiles por prioridad: Superusuario, RRHH y luego el resto de
// forma estable por id. Se usa para pre-seleccionar el perfil activo y para
// poblar el selector tras el login multi-perfil.
export function sortProfilesByPriority(profiles: ProfileRef[]): ProfileRef[] {
  const prioridad = (nombre: string) => {
    if (nombre === 'Superusuario') return 0;
    if (nombre === 'RRHH') return 1;
    return 2;
  };
  return [...profiles].sort((a, b) => prioridad(a.nombre) - prioridad(b.nombre) || a.id - b.id);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
