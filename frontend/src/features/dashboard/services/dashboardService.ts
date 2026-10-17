import {
  MOCK_LATENCY_MAX,
  MOCK_LATENCY_MIN,
  MUTATION_LATENCY_MAX,
  MUTATION_LATENCY_MIN,
} from '../../../constants';
import {
  ANNOUNCEMENTS,
  LEAVE_REQUESTS,
  NOTIFICATIONS,
  RECENT_ACTIVITY,
  WEEKLY_HOURS,
  EMPLOYEES,
  buildPeriods,
  buildReceipts,
  delay,
  getDepartmentDistribution,
  randomLatency,
} from '../../../mocks';
import type { Announcement, AppNotification, PayrollPeriod } from '../../../types';
import type { ActivityItem } from '../../../mocks';

export async function fetchAnnouncements(): Promise<Announcement[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return ANNOUNCEMENTS.map((item) => ({ ...item }));
}

export async function fetchWeeklyHours(): Promise<Array<{ week: string; horas: number }>> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return WEEKLY_HOURS.map((item) => ({ ...item }));
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  await delay(randomLatency(220, 480));
  return NOTIFICATIONS.map((item) => ({ ...item }));
}

export async function markNotificationRead(_id?: string): Promise<void> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
}

export async function markAllNotificationsRead(): Promise<void> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
}

export async function fetchActivity(): Promise<ActivityItem[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return RECENT_ACTIVITY.map((item) => ({ ...item }));
}

export async function fetchDepartmentDistribution(): Promise<Array<{ name: string; value: number }>> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return getDepartmentDistribution();
}

export async function fetchPayrollCostSeries(): Promise<Array<{ month: string; costo: number }>> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  const periods = buildPeriods('mensual').reverse();
  return periods.map((period: PayrollPeriod) => ({
    month: period.label.slice(0, 3).toUpperCase(),
    costo: buildReceipts(period, EMPLOYEES).reduce((total, receipt) => total + receipt.netPay, 0),
  }));
}

export async function fetchGlobalMetrics(): Promise<{
  headcount: number;
  monthlyPayroll: number;
  pendingRequests: number;
  attendanceToday: number;
}> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  const currentPeriod = buildPeriods('mensual')[0];
  const monthlyPayroll = buildReceipts(currentPeriod, EMPLOYEES).reduce(
    (total, receipt) => total + receipt.netPay,
    0,
  );
  return {
    headcount: EMPLOYEES.length,
    monthlyPayroll,
    pendingRequests: LEAVE_REQUESTS.filter((request) => request.status === 'pendiente').length,
    attendanceToday: EMPLOYEES.filter((employee) => employee.status === 'active').length - 2,
  };
}
