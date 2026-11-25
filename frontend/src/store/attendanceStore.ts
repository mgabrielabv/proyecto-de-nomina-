import { create } from 'zustand';
import {
  fetchMonthEntries,
  fetchTodayEntry,
  registerClockIn,
  registerClockOut,
} from '../features/attendance/services';
import type { AttendanceEntry } from '../types';

interface AttendanceState {
  entries: AttendanceEntry[];
  today: AttendanceEntry | null;
  loading: boolean;
  loaded: boolean;
  clockBusy: boolean;
  loadMonth: (employeeIds: string[], month: Date) => Promise<void>;
  loadToday: (employeeId: string) => Promise<void>;
  clockIn: (employeeId: string) => Promise<void>;
  clockOut: (employeeId: string) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  entries: [],
  today: null,
  loading: false,
  loaded: false,
  clockBusy: false,
  loadMonth: async (employeeIds, month) => {
    set({ loading: true });
    const entries = await fetchMonthEntries(employeeIds, month);
    set({ entries, loading: false, loaded: true });
  },
  loadToday: async (employeeId) => {
    const today = await fetchTodayEntry(employeeId);
    set({ today });
  },
  clockIn: async (employeeId) => {
    set({ clockBusy: true });
    const today = await registerClockIn(employeeId);
    set({ today, clockBusy: false });
  },
  clockOut: async (employeeId) => {
    set({ clockBusy: true });
    const today = await registerClockOut(employeeId);
    set({ today, clockBusy: false });
  },
}));
