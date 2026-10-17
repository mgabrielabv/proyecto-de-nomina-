import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, LogOut } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Calendar } from '../../components/ui/Calendar';
import { useAttendanceStore, useSessionStore, useToastStore } from '../../store';
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_STATUS_TONE, TOAST_MESSAGES } from '../../constants';
import { formatDateShort, toISODate } from '../../utils';
import type { AttendanceStatus } from '../../types';

export function UserAttendance() {
  const user = useSessionStore((state) => state.user);
  const push = useToastStore((state) => state.push);
  const { entries, today, clockBusy, loadMonth, loadToday, clockIn, clockOut } = useAttendanceStore();

  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => toISODate(new Date()));

  useEffect(() => {
    if (!user) return;
    void loadToday(user.id);
  }, [user, loadToday]);

  useEffect(() => {
    if (!user) return;
    void loadMonth([user.id], month);
  }, [user, month, loadMonth]);

  const statuses = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {};
    entries.forEach((entry) => {
      map[entry.date] = entry.status;
    });
    return map;
  }, [entries]);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.date === selectedDate) ?? null,
    [entries, selectedDate],
  );

  if (!user) return null;

  const hasCheckIn = Boolean(today?.checkIn);
  const hasCheckOut = Boolean(today?.checkOut);

  const handleClockIn = async () => {
    await clockIn(user.id);
    push(TOAST_MESSAGES.clockIn);
  };

  const handleClockOut = async () => {
    await clockOut(user.id);
    push(TOAST_MESSAGES.clockOut);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mi asistencia" description="Calendario mensual y registro de entrada/salida." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={fadeUpItem} className="lg:col-span-2">
          <Card>
            <Calendar
              month={month}
              onMonthChange={setMonth}
              statuses={statuses}
              onSelectDay={setSelectedDate}
              selectedDate={selectedDate}
            />
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem} className="space-y-5">
          <Card className="space-y-4">
            <header>
              <h3 className="text-sm font-semibold tracking-tight text-text">Estado del día</h3>
              <p className="mt-1 text-xs text-text-muted">{formatDateShort(toISODate(new Date()))}</p>
            </header>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {today ? ATTENDANCE_STATUS_LABEL[today.status] : 'Sin registro'}
              </span>
              {today && <Badge tone={ATTENDANCE_STATUS_TONE[today.status]}>{ATTENDANCE_STATUS_LABEL[today.status]}</Badge>}
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-border bg-surface-soft/70 p-3">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Entrada</dt>
                <dd className="mt-1 tabular-nums text-text">{today?.checkIn ?? '—'}</dd>
              </div>
              <div className="rounded-xl border border-border bg-surface-soft/70 p-3">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Salida</dt>
                <dd className="mt-1 tabular-nums text-text">{today?.checkOut ?? '—'}</dd>
              </div>
            </dl>

            <div className="flex gap-2.5">
              <Button fullWidth state={clockBusy ? 'loading' : 'idle'} disabled={hasCheckIn} onClick={() => void handleClockIn()}>
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" aria-hidden />
                  Registrar entrada
                </span>
              </Button>
              <button
                type="button"
                disabled={clockBusy || !hasCheckIn || hasCheckOut}
                onClick={() => void handleClockOut()}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-button border border-border bg-surface-soft text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Salida
              </button>
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-text">Detalle seleccionado</h3>
            <p className="text-xs text-text-muted">{formatDateShort(selectedDate)}</p>
            {selectedEntry ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  {selectedEntry.checkIn ?? '—'} – {selectedEntry.checkOut ?? '—'}
                </span>
                <Badge tone={ATTENDANCE_STATUS_TONE[selectedEntry.status]}>
                  {ATTENDANCE_STATUS_LABEL[selectedEntry.status]}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Sin registro para este día.</p>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
