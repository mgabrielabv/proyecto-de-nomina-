import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ATTENDANCE_STATUS_LABEL } from '../../../constants';
import type { AttendanceStatus } from '../../../types';
import { cn } from '../../../utils';

export interface CalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  statuses?: Record<string, AttendanceStatus>;
  onSelectDay?: (iso: string) => void;
  selectedDate?: string | null;
}

const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const statusDot: Record<AttendanceStatus, string> = {
  presente: 'bg-success',
  ausente: 'bg-error',
  permiso: 'bg-warning',
  feriado: 'bg-text-muted',
  retardo: 'bg-warning',
};

const statusCell: Record<AttendanceStatus, string> = {
  presente: 'bg-success-soft',
  ausente: 'bg-error-soft',
  permiso: 'bg-warning-soft',
  feriado: 'bg-surface-soft',
  retardo: 'bg-warning-soft',
};

export function Calendar({ month, onMonthChange, statuses = {}, onSelectDay, selectedDate }: CalendarProps) {
  const reduce = useReducedMotion();
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const legend = Object.keys(statusDot) as AttendanceStatus[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold capitalize tracking-tight text-text">
          {format(month, 'LLLL yyyy', { locale: es })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, -1))}
            aria-label="Mes anterior"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(month, 1))}
            aria-label="Mes siguiente"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEK_DAYS.map((day) => (
          <span key={day} className="pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {day}
          </span>
        ))}
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const status = statuses[iso];
          const inMonth = isSameMonth(day, month);
          const selected = selectedDate === iso;
          return (
            <motion.button
              key={iso}
              type="button"
              disabled={!onSelectDay}
              onClick={() => onSelectDay?.(iso)}
              whileHover={reduce || !onSelectDay ? undefined : { scale: 1.06 }}
              whileTap={reduce || !onSelectDay ? undefined : { scale: 0.94 }}
              aria-label={`${format(day, 'd MMMM', { locale: es })}${status ? `: ${ATTENDANCE_STATUS_LABEL[status]}` : ''}`}
              aria-pressed={selected}
              className={cn(
                'relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-xl border text-xs transition-colors duration-150',
                inMonth ? 'border-border' : 'border-transparent opacity-40',
                status ? statusCell[status] : inMonth ? 'bg-surface' : 'bg-transparent',
                selected && 'border-accent ring-1 ring-[var(--color-focus)]',
                isToday(day) && !selected && 'border-border-strong',
                onSelectDay && 'cursor-pointer hover:border-border-strong',
              )}
            >
              <span className={cn('tabular-nums', isToday(day) ? 'font-semibold text-text' : 'text-text-secondary')}>
                {format(day, 'd')}
              </span>
              {status && <span aria-hidden className={cn('mt-0.5 h-1.5 w-1.5 rounded-full', statusDot[status])} />}
            </motion.button>
          );
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
        {legend.map((status) => (
          <li key={status} className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', statusDot[status])} />
            {ATTENDANCE_STATUS_LABEL[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
