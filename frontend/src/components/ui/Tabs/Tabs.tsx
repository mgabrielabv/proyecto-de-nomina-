import { motion, useReducedMotion } from 'framer-motion';
import type { KeyboardEvent, ReactNode } from 'react';
import { tabIndicatorVariants } from '../../../animations/variants';
import { cn } from '../../../utils';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  layoutId?: string;
  className?: string;
}

export function Tabs({ items, value, onChange, layoutId = 'tabs-indicator', className }: TabsProps) {
  const reduce = useReducedMotion();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.value === value);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].value);
  };

  return (
    <div
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-surface-soft/70 p-1',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
              active ? 'text-text' : 'text-text-secondary hover:text-text',
            )}
          >
            {active && !reduce && (
              <motion.span
                layoutId={layoutId}
                variants={tabIndicatorVariants}
                initial="hidden"
                animate="show"
                className="absolute inset-0 rounded-full border border-border bg-surface shadow-sm"
              />
            )}
            {active && reduce && (
              <span className="absolute inset-0 rounded-full border border-border bg-surface shadow-sm" />
            )}
            <span className="relative flex items-center gap-2">
              {item.icon}
              {item.label}
              {typeof item.count === 'number' && (
                <span className="rounded-full bg-surface-soft px-1.5 py-0.5 text-[11px] tabular-nums text-text-muted">
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
