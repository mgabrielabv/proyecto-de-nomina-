import {
  MUTATION_LATENCY_MAX,
  MUTATION_LATENCY_MIN,
  MOCK_LATENCY_MAX,
  MOCK_LATENCY_MIN,
} from '../../../constants';
import { LEAVE_REQUESTS, delay, randomLatency } from '../../../mocks';
import { daysBetween } from '../../../utils';
import type { LeaveRequest, RequestStatus, RequestType } from '../../../types';

let dataset: LeaveRequest[] = LEAVE_REQUESTS.map((request) => ({ ...request }));
let idCounter = dataset.length + 1;

export async function fetchRequests(employeeId?: string): Promise<LeaveRequest[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  const source = employeeId ? dataset.filter((request) => request.employeeId === employeeId) : dataset;
  return source.map((request) => ({ ...request }));
}

export async function createRequest(
  payload: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'reviewComment' | 'days'> & {
    employeeId: string;
    type: RequestType;
    startDate: string;
    endDate: string;
    reason: string;
  },
): Promise<LeaveRequest> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const request: LeaveRequest = {
    id: `r${idCounter}`,
    employeeId: payload.employeeId,
    type: payload.type,
    startDate: payload.startDate,
    endDate: payload.endDate,
    reason: payload.reason,
    status: 'pendiente',
    createdAt: new Date().toISOString().slice(0, 10),
    reviewComment: '',
    days: daysBetween(payload.startDate, payload.endDate),
  };
  idCounter += 1;
  dataset = [request, ...dataset];
  return { ...request };
}

export async function decideRequest(
  id: string,
  status: RequestStatus,
  reviewComment: string,
): Promise<LeaveRequest> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const request = dataset.find((item) => item.id === id);
  if (!request) throw new Error('Solicitud no encontrada');
  const updated: LeaveRequest = { ...request, status, reviewComment };
  dataset = dataset.map((item) => (item.id === id ? updated : item));
  return { ...updated };
}
