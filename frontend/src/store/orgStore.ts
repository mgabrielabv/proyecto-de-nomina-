import { create } from 'zustand';
import {
  createDepartment,
  createPosition,
  fetchDepartments,
  fetchPositions,
  updateDepartment,
  updatePosition,
} from '../features/departments/services';
import type { Department, Position } from '../types';

interface OrgState {
  departments: Department[];
  positions: Position[];
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  addDepartment: (name: string, manager: string) => Promise<void>;
  editDepartment: (id: string, patch: Partial<Department>) => Promise<void>;
  addPosition: (title: string, departmentId: string) => Promise<void>;
  editPosition: (id: string, patch: Partial<Position>) => Promise<void>;
}

export const useOrgStore = create<OrgState>((set) => ({
  departments: [],
  positions: [],
  loading: false,
  loaded: false,
  load: async () => {
    set({ loading: true });
    const [departments, positions] = await Promise.all([fetchDepartments(), fetchPositions()]);
    set({ departments, positions, loading: false, loaded: true });
  },
  addDepartment: async (name, manager) => {
    const department = await createDepartment(name, manager);
    set((state) => ({ departments: [...state.departments, department] }));
  },
  editDepartment: async (id, patch) => {
    const updated = await updateDepartment(id, patch);
    set((state) => ({ departments: state.departments.map((item) => (item.id === id ? updated : item)) }));
  },
  addPosition: async (title, departmentId) => {
    const position = await createPosition(title, departmentId);
    set((state) => ({ positions: [...state.positions, position] }));
  },
  editPosition: async (id, patch) => {
    const updated = await updatePosition(id, patch);
    set((state) => ({ positions: state.positions.map((item) => (item.id === id ? updated : item)) }));
  },
}));
