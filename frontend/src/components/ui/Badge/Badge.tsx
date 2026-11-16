import { motion, useReducedMotion } from 'framer-motion';
import { Check, Clock3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { badgePopVariants } from '../../../animations/variants';
import type { BadgeTone } from '../../../constants';
import { cn } from '../../../utils';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  /** Ícono de estado para distinguir sin depender solo del color. */
  statusIcon?: 'processed' | 'paid' | 'none';
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

export function Badge({ children, tone = 'neutral', dot = true, statusIcon = 'none', className }: BadgeProps) {
  const reduce = useReducedMotion();
  const icon =
    statusIcon === 'paid' ? (
      <Check className="h-3 w-3" aria-hidden strokeWidth={2.5} />
    ) : statusIcon === 'processed' ? (
      <Clock3 className="h-3 w-3" aria-hidden strokeWidth={2.25} />
    ) : null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-[13px] font-medium tracking-tight',
        toneClasses[tone],
        className,
      )}
    >
      {icon ? (
        <motion.span
          aria-hidden
          variants={badgePopVariants}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="inline-flex"
        >
          {icon}
        </motion.span>
      ) : dot ? (
        <motion.span
          aria-hidden
          variants={badgePopVariants}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}
