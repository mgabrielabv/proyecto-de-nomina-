import { formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, CheckCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { tableRowVariants, tableContainerVariants } from '../../../animations/variants';
import { useUiStore } from '../../../store';
import { cn } from '../../../utils';

export interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const notifications = useUiStore((state) => state.notifications);
  const markAllRead = useUiStore((state) => state.markAllRead);
  const markRead = useUiStore((state) => state.markRead);
  const reduce = useReducedMotion();
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="glass-card flex max-h-[70vh] flex-col overflow-hidden p-0">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-text">Notificaciones</h3>
          <p className="text-xs text-text-muted">{unreadCount} sin leer</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (unreadCount > 0) void markAllRead();
          }}
          disabled={unreadCount === 0}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors duration-200',
            unreadCount > 0 ? 'text-text-secondary hover:border-border-strong hover:text-text' : 'cursor-default opacity-50',
          )}
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden />
          Marcar todo leído
        </button>
      </header>

      <motion.ul
        variants={tableContainerVariants}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="flex-1 overflow-y-auto divide-y divide-border"
      >
        {notifications.length === 0 && (
          <li className="flex flex-col items-center justify-center py-10 text-center text-sm text-text-secondary">
            <Bell className="mb-2 h-6 w-6 text-text-muted" aria-hidden />
            No tienes notificaciones pendientes
          </li>
        )}
        {notifications.map((item) => (
          <motion.li
            key={item.id}
            variants={tableRowVariants}
            className={cn('flex items-start gap-3 px-5 py-4 transition-colors duration-150', !item.read && 'bg-spot')}
          >
            <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', item.read ? 'bg-border' : 'bg-error')} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{item.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{item.body}</p>
              <p className="mt-1.5 text-xs text-text-muted">
                {formatDistanceStrict(new Date(item.date), new Date(), { addSuffix: true, locale: es })}
              </p>
            </div>
            {!item.read && (
              <button
                type="button"
                onClick={() => {
                  void markRead(item.id);
                  if (notifications.filter((n) => !n.read).length === 1) onClose();
                }}
                className="text-xs font-medium text-text-secondary underline-offset-4 transition-colors duration-200 hover:text-text hover:underline"
              >
                Leer
              </button>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
