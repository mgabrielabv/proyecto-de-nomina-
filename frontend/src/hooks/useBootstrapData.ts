import { useEffect } from 'react';
import { useEmployeesStore, useOrgStore, useRequestsStore, useUiStore } from '../store';

export function useBootstrapData(): void {
  const loadEmployees = useEmployeesStore((state) => state.load);
  const loadOrg = useOrgStore((state) => state.load);
  const loadRequests = useRequestsStore((state) => state.load);
  const loadNotifications = useUiStore((state) => state.loadNotifications);

  useEffect(() => {
    void loadEmployees();
    void loadOrg();
    void loadRequests();
    void loadNotifications();
  }, [loadEmployees, loadOrg, loadRequests, loadNotifications]);
}
