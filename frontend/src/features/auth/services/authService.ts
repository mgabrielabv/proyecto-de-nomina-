import { AUTH_ERROR_MESSAGES, SESSION_DELAY } from '../../../constants';
import { MOCK_ACCOUNTS, EMPLOYEES } from '../../../mocks';
import { delay } from '../../../utils';
import type { AuthResult, LoginCredentials } from '../types';
import type { SessionUser } from '../../../types';

export async function signIn(payload: LoginCredentials): Promise<AuthResult> {
  await delay(SESSION_DELAY);
  const account = MOCK_ACCOUNTS.find(
    (item) => item.email.toLowerCase() === payload.email.trim().toLowerCase(),
  );
  if (!account || account.password !== payload.password) {
    return { ok: false, error: AUTH_ERROR_MESSAGES.credentialsInvalid };
  }
  return { ok: true, user: account.session };
}

export async function signUp(): Promise<AuthResult> {
  await delay(SESSION_DELAY);
  return { ok: true, user: MOCK_ACCOUNTS[1].session };
}

export async function getCurrentUser(userId: string): Promise<SessionUser | null> {
  const employee = EMPLOYEES.find((item) => item.id === userId);
  if (!employee) return null;
  await delay(200);
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    jobTitle: employee.jobTitle,
    departmentId: employee.departmentId,
  };
}

export async function signOut(): Promise<void> {
  await delay(240);
}
