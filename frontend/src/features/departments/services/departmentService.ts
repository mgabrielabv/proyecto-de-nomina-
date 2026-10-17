import { MOCK_LATENCY_MAX, MOCK_LATENCY_MIN, MUTATION_LATENCY_MAX, MUTATION_LATENCY_MIN } from '../../../constants';
import { DEPARTMENTS, POSITIONS, delay, randomLatency } from '../../../mocks';
import type { Department, Position } from '../../../types';

let departments: Department[] = DEPARTMENTS.map((item) => ({ ...item }));
let positions: Position[] = POSITIONS.map((item) => ({ ...item }));
let departmentCounter = departments.length + 1;
let positionCounter = positions.length + 1;

export async function fetchDepartments(): Promise<Department[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return departments.map((item) => ({ ...item }));
}

export async function fetchPositions(): Promise<Position[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return positions.map((item) => ({ ...item }));
}

export async function createDepartment(name: string, manager: string): Promise<Department> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const department: Department = { id: `d${departmentCounter}`, name, manager };
  departmentCounter += 1;
  departments = [...departments, department];
  return { ...department };
}

export async function updateDepartment(id: string, patch: Partial<Department>): Promise<Department> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const index = departments.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('Departamento no encontrado');
  const updated: Department = { ...departments[index], ...patch, id };
  departments = departments.map((item, position) => (position === index ? updated : item));
  return { ...updated };
}

export async function createPosition(title: string, departmentId: string): Promise<Position> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const position: Position = { id: `p${positionCounter}`, title, departmentId };
  positionCounter += 1;
  positions = [...positions, position];
  return { ...position };
}

export async function updatePosition(id: string, patch: Partial<Position>): Promise<Position> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const index = positions.findIndex((item) => item.id === id);
  if (index < 0) throw new Error('Cargo no encontrado');
  const updated: Position = { ...positions[index], ...patch, id };
  positions = positions.map((item, position) => (position === index ? updated : item));
  return { ...updated };
}
