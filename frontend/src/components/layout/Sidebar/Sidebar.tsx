import { useEffect, useRef } from 'react';
import { BrandMark } from '../../ui/BrandMark';
import { useSessionStore } from '../../../store';
import { cn } from '../../../utils';
import { ProfileMenu } from './ProfileMenu';
import { SidebarNav } from './SidebarNav';

export interface SidebarProps {
  /** Plegada solo en escritorio: se oculta entera, sin tira de iconos. */
  collapsed?: boolean;
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, variant = 'desktop', onNavigate }: SidebarProps) {
  const user = useSessionStore((state) => state.user);
  const asideRef = useRef<HTMLElement>(null);
  const plegada = variant === 'desktop' && collapsed;

  // La barra oculta no debe seguir recibiendo foco ni clics de teclado.
  useEffect(() => {
    asideRef.current?.toggleAttribute('inert', plegada);
  }, [plegada]);

  if (!user) return null;

  const layoutId = variant === 'mobile' ? 'sidebar-active-mobile' : 'sidebar-active';

  return (
    <aside
      ref={asideRef}
      aria-hidden={plegada || undefined}
      className={cn(
        'flex flex-col overflow-hidden border-border bg-surface',
        variant === 'desktop'
          ? 'fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w,264px)] transition-[width] duration-300 ease-sidebar will-change-[width] lg:flex'
          : 'relative flex h-full w-full border-none bg-transparent',
        variant === 'desktop' && !plegada && 'border-r',
        plegada && 'pointer-events-none',
      )}
    >
      <div className="flex h-20 shrink-0 items-center px-5">
        <BrandMark />
      </div>

      <div className="min-h-0 flex-1">
        <SidebarNav perfilId={user.activeProfile.id} layoutId={layoutId} onNavigate={onNavigate} />
      </div>

      <ProfileMenu user={user} />
    </aside>
  );
}
