import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LogOut, Settings } from 'lucide-react';
import { BrandMark } from '../../ui/BrandMark';
import { Avatar } from '../../ui/Avatar';
import { SIDEBAR_EXTRA_ITEMS } from '../../../constants';
import { useSessionStore } from '../../../store';
import { cn, getRoleHomePath } from '../../../utils';
import { useClickOutside } from '../../../hooks';
import { SidebarNav } from './SidebarNav';
import { SidebarItem } from './SidebarItem';

export interface SidebarProps {
  collapsed: boolean;
  variant?: 'desktop' | 'mobile';
}

export function Sidebar({ collapsed, variant = 'desktop' }: SidebarProps) {
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  if (!user) return null;

  const handleSignOut = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

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

      <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
        <SidebarNav
          role={user.role}
          collapsed={variant === 'mobile' ? false : collapsed}
          layoutId={layoutId}
        />
        <div className="mt-6 border-t border-border pt-5">
          <ul className="space-y-1">
            {SIDEBAR_EXTRA_ITEMS.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                collapsed={variant === 'mobile' ? false : collapsed}
                layoutId={`${layoutId}-extra`}
              />
            ))}
          </ul>
        </div>
      </div>

      <div ref={menuRef} className="relative border-t border-border p-3">
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-haspopup="true"
          className={cn(
            'flex w-full items-center rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors duration-200 hover:bg-surface-soft',
            variant !== 'mobile' && collapsed && 'justify-center px-0',
            menuOpen && 'bg-surface-soft',
          )}
        >
          <Avatar name={user.name} size="sm" />
          <div
            aria-hidden={!(variant === 'mobile' || !collapsed) || undefined}
            className={cn(
              'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity,margin] duration-300 ease-sidebar',
              variant === 'mobile' || !collapsed ? 'ml-3 max-w-[12rem] opacity-100' : 'ml-0 max-w-0 opacity-0',
            )}
          >
            <p className="truncate text-sm font-semibold text-text">{user.name}</p>
            <p className="truncate text-xs text-text-muted">{user.jobTitle}</p>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 shrink-0 overflow-hidden text-text-muted transition-[transform,opacity,max-width] duration-300 ease-sidebar',
              menuOpen && 'rotate-90',
              variant === 'mobile' || !collapsed ? 'max-w-[1rem] opacity-100' : 'max-w-0 opacity-0',
            )}
            aria-hidden
          />
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-[calc(100%+6px)] left-3 right-3 z-50 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-card"
          >
            <button
              type="button"
              onClick={() => {
                navigate(getRoleHomePath(user.role));
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-surface-soft hover:text-text"
            >
              <Settings className="h-4 w-4" aria-hidden />
              Mi espacio
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-error transition-colors duration-150 hover:bg-error-soft"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </div>
    </aside>
  );
}
