import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Menu, PanelLeft, Search, X } from 'lucide-react';
import { PageHeader } from '../../ui/PageHeader';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { Avatar } from '../../ui/Avatar';
import { useSessionStore, useUiStore } from '../../../store';
import { useClickOutside, useDebouncedValue } from '../../../hooks';
import { cn } from '../../../utils';
import { NotificationPanel } from '../NotificationPanel';

export interface TopbarProps {
  title: string;
  description?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenDrawer: () => void;
}

export function Topbar({ title, description, sidebarCollapsed = false, onToggleSidebar, onOpenDrawer }: TopbarProps) {
  const user = useSessionStore((state) => state.user);
  const notifications = useUiStore((state) => state.notifications);
  const searchQuery = useUiStore((state) => state.searchQuery);
  const setSearchQuery = useUiStore((state) => state.setSearchQuery);
  const loadNotifications = useUiStore((state) => state.loadNotifications);
  const [bellOpen, setBellOpen] = useState(false);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  useClickOutside(bellRef, () => setBellOpen(false), bellOpen);
  useDebouncedValue(searchQuery, 300);

  if (!user) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-2 border-b border-border bg-surface/90 px-4 backdrop-blur-xl sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Abrir menú de navegación"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
          aria-expanded={!sidebarCollapsed}
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:flex"
        >
          <PanelLeft className="h-[18px] w-[18px]" aria-hidden />
        </button>
      )}

      <div className="min-w-0 flex-1">
        <div className="hidden min-w-0 lg:block">
          <PageHeader title={title} description={description} />
        </div>
        <div className="min-w-0 lg:hidden">
          <h1 className="truncate text-base font-semibold tracking-tight text-text">{title}</h1>
          {description && <p className="truncate text-xs text-text-muted">{description}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div
          className={cn(
            'relative h-9 transition-[width] duration-200',
            expandedSearch ? 'w-56 sm:w-72' : 'w-9 lg:w-56 xl:w-72',
          )}
        >
          <button
            type="button"
            onClick={() => setExpandedSearch((current) => !current)}
            aria-label={expandedSearch ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
            className="absolute inset-y-0 left-0 flex h-9 w-9 items-center justify-center text-text-muted transition-colors duration-200 hover:text-text lg:hidden"
          >
            {expandedSearch ? <X className="h-4 w-4" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          </button>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar en la plataforma"
            aria-label="Búsqueda"
            className={cn(
              'h-9 w-full rounded-lg border border-border bg-surface-soft px-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent focus:shadow-input-focus lg:pl-9',
              expandedSearch ? 'pl-9' : 'hidden lg:block',
            )}
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-text-muted lg:block" aria-hidden />
        </div>

        <ThemeToggle className="h-9 w-9 shrink-0" />

        <div className="relative shrink-0" ref={bellRef}>
          <button
            type="button"
            onClick={() => {
              if (!bellOpen) void loadNotifications();
              setBellOpen((current) => !current);
            }}
            aria-label="Notificaciones"
            aria-expanded={bellOpen}
            aria-haspopup="true"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <Bell className="h-[18px] w-[18px]" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-error-soft px-1 text-[10px] font-semibold text-error">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {bellOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute right-0 top-[calc(100%+6px)] z-50 w-[92vw] max-w-sm"
              >
                <NotificationPanel onClose={() => setBellOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label="Perfil"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <Avatar name={user.name} size="sm" />
        </button>
      </div>
    </header>
  );
}
