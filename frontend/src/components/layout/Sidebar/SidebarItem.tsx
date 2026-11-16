import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SPRING } from '../../../constants';
import type { NavItem } from '../../../constants';
import { cn } from '../../../utils';

export interface SidebarItemProps {
  item: NavItem;
  layoutId: string;
  onNavigate?: () => void;
}

export function SidebarItem({ item, layoutId, onNavigate }: SidebarItemProps) {
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
        whileHover={reduce ? undefined : { x: 2 }}
        whileTap={reduce ? undefined : { scale: 0.985 }}
        className={cn(
          'group relative flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200',
          active ? 'text-text' : 'text-text-secondary hover:text-text',
        )}
      >
        {active && (
          <motion.span
            layoutId={layoutId}
            transition={reduce ? { duration: 0.01 } : SPRING.soft}
            className="absolute inset-0 rounded-xl border border-border bg-surface shadow-sm"
          />
        )}
        <Icon className="relative h-[18px] w-[18px] shrink-0" aria-hidden />
        <span className="relative ml-3 truncate">{item.label}</span>
      </motion.button>
    </li>
  );
}
