import {
  MOCK_LATENCY_MAX,
  MOCK_LATENCY_MIN,
  MUTATION_LATENCY_MAX,
  MUTATION_LATENCY_MIN,
} from '../../../constants';
import { EMPLOYEES, delay, randomLatency } from '../../../mocks';
import type { Employee, EmployeeDraft } from '../../../types';

let dataset: Employee[] = EMPLOYEES.map((employee) => ({ ...employee }));
let idCounter = dataset.length + 1;

export async function fetchEmployees(): Promise<Employee[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return dataset.map((employee) => ({ ...employee }));
}

export async function createEmployee(draft: EmployeeDraft): Promise<Employee> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const employee: Employee = {
    id: `e${idCounter}`,
    name: draft.name,
    email: draft.email,
    phone: draft.phone,
    jobTitle: draft.jobTitle,
    departmentId: draft.departmentId,
    role: draft.role,
    status: 'active',
    hireDate: draft.hireDate,
    contractType: draft.contractType,
    baseSalary: draft.baseSalary,
  };
  idCounter += 1;
  dataset = [employee, ...dataset];
  return { ...employee };
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const index = dataset.findIndex((employee) => employee.id === id);
  if (index < 0) throw new Error('Empleado no encontrado');
  const updated: Employee = { ...dataset[index], ...patch, id };
  dataset = dataset.map((employee, position) => (position === index ? updated : employee));
  return { ...updated };
}

export async function toggleEmployeeStatus(id: string): Promise<Employee> {
  const current = dataset.find((employee) => employee.id === id);
  if (!current) throw new Error('Empleado no encontrado');
  return updateEmployee(id, { status: current.status === 'active' ? 'inactive' : 'active' });
}

export async function removeEmployee(id: string): Promise<void> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  dataset = dataset.filter((employee) => employee.id !== id);
}

export async function isEmailTaken(email: string, excludeId?: string): Promise<boolean> {
  await delay(180);
  const normalized = email.trim().toLowerCase();
  return dataset.some(
    (employee) => employee.email.toLowerCase() === normalized && employee.id !== excludeId,
  );
}
