import { FORM_MESSAGES, MUTATION_LATENCY_MAX, MUTATION_LATENCY_MIN } from '../../../constants';
import { delay, randomLatency } from '../../../mocks';
import { createEmployee, isEmailTaken } from '../../employees/services';
import type { Employee, EmployeeDraft } from '../../../types';

export interface RegistrationResult {
  ok: boolean;
  error?: string;
  employee?: Employee;
}

export async function registerPerson(draft: EmployeeDraft): Promise<RegistrationResult> {
  if (await isEmailTaken(draft.email)) {
    return { ok: false, error: 'Ya existe una cuenta con ese correo.' };
  }
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const employee = await createEmployee(draft);
  return { ok: true, employee };
}

export function validateDraftStep(draft: EmployeeDraft, step: number): Record<string, string> {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!draft.name.trim()) errors.name = FORM_MESSAGES.required;
    if (!draft.email.trim()) errors.email = FORM_MESSAGES.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim())) errors.email = FORM_MESSAGES.invalidEmail;
    if (!draft.phone.trim()) errors.phone = FORM_MESSAGES.required;
  }
  if (step === 1) {
    if (!draft.jobTitle.trim()) errors.jobTitle = FORM_MESSAGES.required;
    if (!draft.departmentId) errors.departmentId = FORM_MESSAGES.required;
    if (!draft.hireDate) errors.hireDate = FORM_MESSAGES.required;
    if (!draft.contractType) errors.contractType = FORM_MESSAGES.required;
    if (draft.baseSalary <= 0) errors.baseSalary = FORM_MESSAGES.salaryInvalid;
  }
  if (step === 2) {
    if (!draft.email.trim()) errors.email = FORM_MESSAGES.required;
    if (draft.password.length < 8) errors.password = FORM_MESSAGES.shortPassword;
    if (!draft.role) errors.role = FORM_MESSAGES.required;
  }
  return errors;
}
