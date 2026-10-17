import { create } from 'zustand';
import {
  createEmployee,
  fetchEmployees,
  removeEmployee,
  updateEmployee,
} from '../features/employees/services';
import type { Employee, EmployeeDraft } from '../types';

interface EmployeesState {
  employees: Employee[];
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  create: (draft: EmployeeDraft) => Promise<Employee>;
  update: (id: string, patch: Partial<Employee>) => Promise<void>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEmployeesStore = create<EmployeesState>((set, get) => ({
  employees: [],
  loading: false,
  loaded: false,
  load: async () => {
    if (get().loading) return;
    set({ loading: true });
    const employees = await fetchEmployees();
    set({ employees, loading: false, loaded: true });
  },
  create: async (draft) => {
    const employee = await createEmployee(draft);
    set((state) => ({ employees: [employee, ...state.employees] }));
    return employee;
  },
  update: async (id, patch) => {
    const updated = await updateEmployee(id, patch);
    set((state) => ({ employees: state.employees.map((item) => (item.id === id ? updated : item)) }));
  },
  toggle: async (id) => {
    const current = get().employees.find((item) => item.id === id);
    if (!current) return;
    const updated = await updateEmployee(id, {
      status: current.status === 'active' ? 'inactive' : 'active',
    });
    set((state) => ({ employees: state.employees.map((item) => (item.id === id ? updated : item)) }));
  },
  remove: async (id) => {
    await removeEmployee(id);
    set((state) => ({ employees: state.employees.filter((item) => item.id !== id) }));
  },
}));
