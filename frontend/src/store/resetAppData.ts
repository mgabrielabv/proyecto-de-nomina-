import { useAttendanceStore } from './attendanceStore';
import { useEmployeesStore } from './employeesStore';
import { useOrgStore } from './orgStore';
import { usePayrollStore } from './payrollStore';
import { useRequestsStore } from './requestsStore';
import { useToastStore } from './toastStore';
import { useUiStore } from './uiStore';

export function resetAppData(): void {
  useAttendanceStore.setState({
    entries: [],
    today: null,
    loading: false,
    loaded: false,
    clockBusy: false,
  });
  useEmployeesStore.setState({ employees: [], loading: false, loaded: false });
  useOrgStore.setState({ departments: [], positions: [], loading: false, loaded: false });
  usePayrollStore.setState({
    periods: [],
    receipts: [],
    periodType: 'mensual',
    selectedKey: null,
    loading: false,
    periodsLoaded: false,
  });
  useRequestsStore.setState({ requests: [], loading: false, loaded: false });
  useToastStore.setState({ toasts: [] });
  useUiStore.setState({
    sidebarCollapsed: false,
    drawerOpen: false,
    searchQuery: '',
    notifications: [],
  });
}
