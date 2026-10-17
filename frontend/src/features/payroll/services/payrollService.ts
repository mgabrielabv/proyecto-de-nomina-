import {
  MOCK_LATENCY_MAX,
  MOCK_LATENCY_MIN,
  MUTATION_LATENCY_MAX,
  MUTATION_LATENCY_MIN,
} from '../../../constants';
import { buildPeriods, buildReceipts, delay, randomLatency } from '../../../mocks';
import type { Employee, PayrollPeriod, PayrollPeriodType, PayrollReceipt, PayrollStatus } from '../../../types';

const statusOverrides = new Map<string, PayrollStatus>();

export async function fetchPeriods(type: PayrollPeriodType): Promise<PayrollPeriod[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return buildPeriods(type).map((period) => ({ ...period }));
}

export async function fetchReceipts(period: PayrollPeriod, employees: Employee[]): Promise<PayrollReceipt[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return buildReceipts(period, employees).map((receipt) => ({
    ...receipt,
    status: statusOverrides.get(receipt.id) ?? receipt.status,
  }));
}

export async function setReceiptsStatus(ids: string[], status: PayrollStatus): Promise<void> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  ids.forEach((id) => statusOverrides.set(id, status));
}
