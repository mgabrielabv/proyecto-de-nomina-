import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { badgePopVariants } from '../../../animations/variants';
import type { BadgeTone } from '../../../constants';
import { cn } from '../../../utils';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-border bg-surface-soft text-text-secondary',
  success: 'border-success/30 bg-success-soft text-success',
  warning: 'border-warning/35 bg-warning-soft text-warning',
  error: 'border-error/30 bg-error-soft text-error',
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-text-muted',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
};

export function Badge({ children, tone = 'neutral', dot = false, className }: BadgeProps) {
  const reduce = useReducedMotion();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight',
        toneClasses[tone],
        className,
      )}
    >
      {dot && (
        <motion.span
          aria-hidden
          variants={badgePopVariants}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])}
        />
      )}
      {children}
    </span>
  );
}
