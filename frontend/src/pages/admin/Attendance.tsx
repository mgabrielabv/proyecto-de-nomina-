import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Search } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Calendar } from '../../components/ui/Calendar';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { useAttendanceStore, useEmployeesStore } from '../../store';
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_TONE, EMPTY_MESSAGES } from '../../constants';
import { formatDateShort, formatDayShort, toISODate } from '../../utils';
import type { AttendanceEntry, AttendanceStatus } from '../../types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'permiso', label: 'Permiso' },
  { value: 'retardo', label: 'Retardo' },
  { value: 'feriado', label: 'Feriado' },
];

const STATUS_RANK: Record<AttendanceStatus, number> = {
  ausente: 4,
  permiso: 3,
  retardo: 2,
  presente: 1,
  feriado: 0,
};

export function AdminAttendance() {
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => toISODate(new Date()));
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { entries, loading, loadMonth } = useAttendanceStore();
  const { employees, load: loadEmployees } = useEmployeesStore();

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (employees.length === 0) return;
    void loadMonth(
      employees.map((employee) => employee.id),
      month,
    );
  }, [employees, month, loadMonth]);

  const employeeName = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((employee) => map.set(employee.id, employee.name));
    return (id: string) => map.get(id) ?? id;
  }, [employees]);

  const dayStatuses = useMemo(() => {
    const grouped = new Map<string, AttendanceEntry[]>();
    entries.forEach((entry) => {
      const list = grouped.get(entry.date);
      if (list) list.push(entry);
      else grouped.set(entry.date, [entry]);
    });
    const statuses: Record<string, AttendanceStatus> = {};
    grouped.forEach((list, date) => {
      let best: AttendanceEntry = list[0];
      list.forEach((entry) => {
        if (STATUS_RANK[entry.status] > STATUS_RANK[best.status]) best = entry;
      });
      statuses[date] = best.status;
    });
    return statuses;
  }, [entries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesDate = entry.date === selectedDate;
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      const matchesSearch =
        query.length === 0 || employeeName(entry.employeeId).toLowerCase().includes(query);
      return matchesDate && matchesStatus && matchesSearch;
    });
  }, [entries, selectedDate, statusFilter, search, employeeName]);

  const columns: TableColumn<AttendanceEntry>[] = [
    {
      key: 'employee',
      header: 'Persona',
      render: (row) => <span className="font-medium text-text">{employeeName(row.employeeId)}</span>,
      sortValue: (row) => employeeName(row.employeeId),
    },
    {
      key: 'checkIn',
      header: 'Entrada',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-text-secondary">{row.checkIn ?? '—'}</span>
      ),
      sortValue: (row) => row.checkIn ?? '',
    },
    {
      key: 'checkOut',
      header: 'Salida',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-text-secondary">{row.checkOut ?? '—'}</span>
      ),
      sortValue: (row) => row.checkOut ?? '',
      hideOnMobile: true,
    },
    {
      key: 'late',
      header: 'Retardo',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums">
          {row.lateMinutes > 0 ? `${row.lateMinutes} min` : '—'}
        </span>
      ),
      sortValue: (row) => row.lateMinutes,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge tone={ATTENDANCE_STATUS_TONE[row.status]}>{ATTENDANCE_STATUS_LABEL[row.status]}</Badge>
      ),
      sortValue: (row) => row.status,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Asistencia" description="Vista por día y mes con filtros." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={fadeUpItem} className="lg:col-span-2">
          <Card>
            <Calendar month={month} onMonthChange={setMonth} statuses={dayStatuses} onSelectDay={setSelectedDate} selectedDate={selectedDate} />
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem} className="space-y-5">
          <Card className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-soft text-text-secondary">
                <CalendarDays className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">{formatDateShort(selectedDate)}</p>
                <p className="text-xs text-text-muted">{formatDayShort(new Date(`${selectedDate}T00:00:00`))}</p>
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              {(['presente', 'ausente', 'permiso', 'retardo'] as const).map((status) => {
                const total = entries.filter(
                  (entry) => entry.date === selectedDate && entry.status === status,
                ).length;
                return (
                  <div key={status} className="flex items-center justify-between gap-3">
                    <dt className="text-text-secondary">{ATTENDANCE_STATUS_LABEL[status]}</dt>
                    <dd className="tabular-nums font-medium text-text">{total}</dd>
                  </div>
                );
              })}
            </dl>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUpItem} className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-xs">
            <Select
              name="status"
              label="Estado"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={setStatusFilter}
            />
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por persona"
              aria-label="Buscar asistencia"
              className="h-11 w-full rounded-button border border-border bg-surface-soft pl-10 pr-4 text-sm text-text outline-none transition-colors duration-200 placeholder:text-text-muted focus:border-accent"
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            caption={`Asistencia del ${formatDateShort(selectedDate)}`}
            loading={loading}
            emptyMessage={EMPTY_MESSAGES.attendance}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
