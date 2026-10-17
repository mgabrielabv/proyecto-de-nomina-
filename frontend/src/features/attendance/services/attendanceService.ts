import { MOCK_LATENCY_MAX, MOCK_LATENCY_MIN, MUTATION_LATENCY_MAX, MUTATION_LATENCY_MIN } from '../../../constants';
import { delay, randomLatency } from '../../../utils';
import { buildMonthEntries } from '../../../mocks';
import { toISODate } from '../../../utils';
import type { AttendanceEntry, Employee } from '../../../types';

interface ClockRecord {
  checkIn: string;
  checkOut: string | null;
}

const clockRecords = new Map<string, ClockRecord>();

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function withClockOverride(entry: AttendanceEntry): AttendanceEntry {
  const record = clockRecords.get(entry.id);
  if (!record) return { ...entry };
  return { ...entry, checkIn: record.checkIn, checkOut: record.checkOut };
}

export async function fetchMonthEntries(employeeIds: string[], month: Date): Promise<AttendanceEntry[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  const stubs = employeeIds.map((id) => ({ id }));
  return stubs.flatMap((employee) => buildMonthEntries(employee, month)).map(withClockOverride);
}

export async function fetchTodayEntry(employeeId: string): Promise<AttendanceEntry> {
  await delay(randomLatency(240, 520));
  const today = toISODate(new Date());
  const stub: Pick<Employee, 'id'> = { id: employeeId };
  const entry = buildMonthEntries(stub, new Date()).find((item) => item.date === today);
  if (entry) return withClockOverride(entry);
  return {
    id: `${employeeId}-${today}`,
    employeeId,
    date: today,
    status: 'presente',
    checkIn: clockRecords.get(`${employeeId}-${today}`)?.checkIn ?? null,
    checkOut: clockRecords.get(`${employeeId}-${today}`)?.checkOut ?? null,
    lateMinutes: 0,
  };
}

export async function registerClockIn(employeeId: string): Promise<AttendanceEntry> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const today = toISODate(new Date());
  clockRecords.set(`${employeeId}-${today}`, { checkIn: currentTime(), checkOut: null });
  return fetchTodayEntry(employeeId);
}

export async function registerClockOut(employeeId: string): Promise<AttendanceEntry> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  const today = toISODate(new Date());
  const existing = clockRecords.get(`${employeeId}-${today}`);
  clockRecords.set(`${employeeId}-${today}`, {
    checkIn: existing?.checkIn ?? currentTime(),
    checkOut: currentTime(),
  });
  return fetchTodayEntry(employeeId);
}
