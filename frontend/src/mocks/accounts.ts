import type { SessionUser } from '../types';
import { EMPLOYEES } from './employees';

export interface MockAccount {
  email: string;
  password: string;
  session: SessionUser;
}

function toSession(employeeId: string): SessionUser {
  const employee = EMPLOYEES.find((item) => item.id === employeeId);
  if (!employee) throw new Error(`Empleado no encontrado: ${employeeId}`);
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    jobTitle: employee.jobTitle,
    departmentId: employee.departmentId,
  };
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  { email: 'admin@demo.com', password: 'Admin12345', session: toSession('e1') },
  { email: 'user@demo.com', password: 'User12345', session: toSession('e2') },
];
