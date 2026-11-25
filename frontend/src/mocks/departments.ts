import type { Department, Position } from '../types';

export const DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Ingeniería', manager: 'Elena Vargas' },
  { id: 'd2', name: 'Diseño', manager: 'Nuria Palma' },
  { id: 'd3', name: 'Producto', manager: 'Iván Serrat' },
  { id: 'd4', name: 'Operaciones', manager: 'Elena Vargas' },
  { id: 'd5', name: 'Finanzas', manager: 'Rocío Prat' },
  { id: 'd6', name: 'Personas', manager: 'Sara Benet' },
];

export const POSITIONS: Position[] = [
  { id: 'p1', title: 'Directora de Operaciones', departmentId: 'd4' },
  { id: 'p2', title: 'Ingeniero de Software', departmentId: 'd1' },
  { id: 'p3', title: 'Ingeniera de Datos', departmentId: 'd1' },
  { id: 'p4', title: 'Tech Lead', departmentId: 'd1' },
  { id: 'p5', title: 'Diseñadora de Producto', departmentId: 'd2' },
  { id: 'p6', title: 'Diseñadora de Interacción', departmentId: 'd2' },
  { id: 'p7', title: 'Product Manager', departmentId: 'd3' },
  { id: 'p8', title: 'Analista de Producto', departmentId: 'd3' },
  { id: 'p9', title: 'Especialista de Operaciones', departmentId: 'd4' },
  { id: 'p10', title: 'Contable', departmentId: 'd5' },
  { id: 'p11', title: 'FP&A Analyst', departmentId: 'd5' },
  { id: 'p12', title: 'People Partner', departmentId: 'd6' },
  { id: 'p13', title: 'Reclutadora', departmentId: 'd6' },
];
