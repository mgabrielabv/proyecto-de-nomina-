import { create } from 'zustand';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../features/dashboard/services';
import type { AppNotification } from '../types';

interface UiState {
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
  searchQuery: string;
  notifications: AppNotification[];
  toggleSidebar: () => void;
  setDrawerOpen: (open: boolean) => void;
  setSearchQuery: (value: string) => void;
  loadNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  drawerOpen: false,
  searchQuery: '',
  notifications: [],
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setDrawerOpen: (open) => set({ drawerOpen: open }),
  setSearchQuery: (value) => set({ searchQuery: value }),
  loadNotifications: async () => set({ notifications: await fetchNotifications() }),
  markAllRead: async () => {
    await markAllNotificationsRead();
    set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, read: true })) }));
  },
  markRead: async (id) => {
    await markNotificationRead(id);
    set((state) => ({ notifications: state.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)) }));
  },
}));
