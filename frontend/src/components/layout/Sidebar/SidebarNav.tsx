import { NAV_SECTIONS } from '../../../constants';
import type { UserRole } from '../../../types';
import { cn } from '../../../utils';
import { SidebarItem } from './SidebarItem';

export interface SidebarNavProps {
  role: UserRole;
  collapsed: boolean;
  layoutId: string;
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({ role, collapsed, layoutId, onNavigate, className }: SidebarNavProps) {
  const sections = NAV_SECTIONS.filter((section) => section.roles.includes(role));

  return (
    <nav aria-label="Navegación principal" className={cn('space-y-6', className)}>
      {sections.map((section) => (
        <div key={section.id} className="space-y-1.5">
          {section.label && !collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{section.label}</p>
          )}
          {section.label && collapsed && <div aria-hidden className="mx-3 mb-2 h-px bg-border" />}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                collapsed={collapsed}
                layoutId={layoutId}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
