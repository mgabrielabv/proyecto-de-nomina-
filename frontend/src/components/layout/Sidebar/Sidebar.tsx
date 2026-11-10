import { BrandMark } from '../../ui/BrandMark';
import { useSessionStore } from '../../../store';
import { cn } from '../../../utils';
import { ProfileMenu } from './ProfileMenu';
import { SidebarNav } from './SidebarNav';

export interface SidebarProps {
  collapsed: boolean;
  variant?: 'desktop' | 'mobile';
}

export function Sidebar({ collapsed, variant = 'desktop' }: SidebarProps) {
  const user = useSessionStore((state) => state.user);

  if (!user) return null;

  const isCollapsed = variant === 'mobile' ? false : collapsed;
  const layoutId = variant === 'mobile' ? 'sidebar-active-mobile' : 'sidebar-active';

  return (
    <aside
      className={cn(
        'flex flex-col border-border bg-surface/95 backdrop-blur-xl',
        variant === 'desktop'
          ? 'fixed inset-y-0 left-0 z-40 hidden lg:flex border-r transition-[width] duration-300 ease-sidebar will-change-[width]'
          : 'relative flex h-full w-full border-none bg-transparent',
      )}
      style={variant === 'desktop' ? { width: collapsed ? 84 : 264 } : undefined}
    >
      <div className={cn('flex h-20 items-center px-5', collapsed && variant === 'desktop' && 'justify-center px-0')}>
        <BrandMark collapsed={collapsed && variant === 'desktop'} />
      </div>

      {/* El nav posee su propio scroll: los paneles se deslizan dentro de un
          viewport recortado (overflow: hidden), así que el padding y el
          scroll viven en cada panel, no acá. */}
      <div className="min-h-0 flex-1">
        <SidebarNav
          role={user.role}
          collapsed={isCollapsed}
          layoutId={layoutId}
        />
      </div>

      <ProfileMenu user={user} collapsed={isCollapsed} />
    </aside>
  );
}
