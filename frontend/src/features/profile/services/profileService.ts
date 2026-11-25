import { MOCK_LATENCY_MAX, MOCK_LATENCY_MIN, MUTATION_LATENCY_MAX, MUTATION_LATENCY_MIN } from '../../../constants';
import { delay, randomLatency } from '../../../mocks';
import { fetchEmployees, updateEmployee } from '../../employees/services';
import type { Employee } from '../../../types';

export async function fetchProfile(employeeId: string): Promise<Employee> {
  const employees = await fetchEmployees();
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) throw new Error('Perfil no encontrado');
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return { ...employee };
}

export async function updateProfile(
  employeeId: string,
  patch: Partial<Employee>,
): Promise<Employee> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  return updateEmployee(employeeId, patch);
}
