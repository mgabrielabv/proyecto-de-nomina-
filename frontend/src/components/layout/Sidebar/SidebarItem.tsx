import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { NavItem } from '../../../constants';
import { cn } from '../../../utils';

export interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
  layoutId: string;
  onNavigate?: () => void;
}

export function SidebarItem({ item, collapsed, layoutId, onNavigate }: SidebarItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const active = location.pathname === item.path;
  const Icon = item.icon;

  const handleClick = () => {
    navigate(item.path);
    onNavigate?.();
  };

  return (
    <li>
      <motion.button
        type="button"
        onClick={handleClick}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
        whileHover={reduce ? undefined : { x: 2 }}
        whileTap={reduce ? undefined : { scale: 0.985 }}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
          collapsed ? 'justify-center px-0' : 'px-3',
          active ? 'text-text' : 'text-text-secondary hover:text-text',
        )}
      >
        {active && (
          <motion.span
            layoutId={layoutId}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="absolute inset-0 rounded-xl border border-border bg-surface shadow-sm"
          />
        )}
        <Icon className="relative h-[18px] w-[18px] shrink-0" aria-hidden />
        {!collapsed && <span className="relative truncate">{item.label}</span>}
      </motion.button>
    </li>
  );
}
