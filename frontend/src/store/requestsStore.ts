import { create } from 'zustand';
import { createRequest, decideRequest, fetchRequests } from '../features/requests/services';
import type { LeaveRequest, RequestStatus, RequestType } from '../types';

interface RequestsState {
  requests: LeaveRequest[];
  loading: boolean;
  loaded: boolean;
  load: (employeeId?: string) => Promise<void>;
  create: (payload: {
    employeeId: string;
    type: RequestType;
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<LeaveRequest>;
  decide: (id: string, status: RequestStatus, comment: string) => Promise<void>;
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  requests: [],
  loading: false,
  loaded: false,
  load: async (employeeId) => {
    if (get().loading) return;
    set({ loading: true });
    const requests = await fetchRequests(employeeId);
    set({ requests, loading: false, loaded: true });
  },
  create: async (payload) => {
    const request = await createRequest(payload);
    set((state) => ({ requests: [request, ...state.requests] }));
    return request;
  },
  decide: async (id, status, comment) => {
    const updated = await decideRequest(id, status, comment);
    set((state) => ({ requests: state.requests.map((item) => (item.id === id ? updated : item)) }));
  },
}));
