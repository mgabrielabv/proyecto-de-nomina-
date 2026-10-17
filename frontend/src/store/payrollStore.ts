import { create } from 'zustand';
import { fetchPeriods, fetchReceipts, setReceiptsStatus } from '../features/payroll/services';
import type { Employee, PayrollPeriod, PayrollPeriodType, PayrollReceipt, PayrollStatus } from '../types';

interface PayrollState {
  periods: PayrollPeriod[];
  receipts: PayrollReceipt[];
  periodType: PayrollPeriodType;
  selectedKey: string | null;
  loading: boolean;
  periodsLoaded: boolean;
  loadPeriods: (type: PayrollPeriodType) => Promise<void>;
  selectPeriod: (type: PayrollPeriodType, key: string, employees: Employee[]) => Promise<void>;
  setStatus: (ids: string[], status: PayrollStatus) => Promise<void>;
}

export const usePayrollStore = create<PayrollState>((set, get) => ({
  periods: [],
  receipts: [],
  periodType: 'mensual',
  selectedKey: null,
  loading: false,
  periodsLoaded: false,
  loadPeriods: async (type) => {
    if (get().loading && get().periodType === type) return;
    set({ loading: true, periodType: type });
    const periods = await fetchPeriods(type);
    set({ periods, periodsLoaded: true, loading: false, selectedKey: periods[0]?.key ?? null });
  },
  selectPeriod: async (type, key, employees) => {
    set({ loading: true, periodType: type, selectedKey: key });
    const period = get().periods.find((item) => item.key === key);
    if (!period) {
      set({ loading: false });
      return;
    }
    const receipts = await fetchReceipts(period, employees);
    set({ receipts, loading: false });
  },
  setStatus: async (ids, status) => {
    await setReceiptsStatus(ids, status);
    set((state) => ({
      receipts: state.receipts.map((receipt) =>
        ids.includes(receipt.id) ? { ...receipt, status } : receipt,
      ),
    }));
  },
}));
