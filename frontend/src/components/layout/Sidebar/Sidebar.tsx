import { BrandMark } from '../../ui/BrandMark';
import { useSessionStore } from '../../../store';
import { cn } from '../../../utils';
import { ProfileMenu } from './ProfileMenu';
import { SidebarNav } from './SidebarNav';

export interface SidebarProps {
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

export function Sidebar({ variant = 'desktop', onNavigate }: SidebarProps) {
  const user = useSessionStore((state) => state.user);

  if (!user) return null;

  const layoutId = variant === 'mobile' ? 'sidebar-active-mobile' : 'sidebar-active';

  return (
    <aside
      className={cn(
        'flex flex-col border-border bg-surface',
        variant === 'desktop'
          ? 'fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-w,264px)] border-r lg:flex'
          : 'relative flex h-full w-full border-none bg-transparent',
      )}
    >
      <div className="flex h-20 items-center px-5">
        <BrandMark />
      </div>

      <div className="min-h-0 flex-1">
        <SidebarNav perfilId={user.activeProfile.id} layoutId={layoutId} onNavigate={onNavigate} />
      </div>

      <ProfileMenu user={user} />
    </aside>
  );
}
