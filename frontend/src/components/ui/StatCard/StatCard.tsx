import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { countUpVariants, fadeUpItem } from '../../../animations/variants';
import { useAnimatedCounter } from '../../../hooks';
import { cn, formatNumber } from '../../../utils';
import { Skeleton } from '../Skeleton';

export type StatTone = 'neutral' | 'success' | 'warning' | 'error';

export interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  hint?: string;
  tone?: StatTone;
  formatter?: (value: number) => string;
  loading?: boolean;
  className?: string;
}

const toneClasses: Record<StatTone, string> = {
  neutral: 'border-border bg-surface-soft text-text-secondary',
  success: 'border-success/30 bg-success-soft text-success',
  warning: 'border-warning/35 bg-warning-soft text-warning',
  error: 'border-error/30 bg-error-soft text-error',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = 'neutral',
  formatter = formatNumber,
  loading = false,
  className,
}: StatCardProps) {
  const reduce = useReducedMotion();
  const animated = useAnimatedCounter(loading ? 0 : value);
  const displayed = loading ? 0 : reduce ? value : animated;

  return (
    <motion.article
      variants={fadeUpItem}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn('glass-card p-5', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl border', toneClasses[tone])}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {loading && <Skeleton className="h-5 w-12 rounded-full" />}
      </div>
      <div className="mt-4">
        {loading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <motion.p
            variants={countUpVariants}
            initial={reduce ? false : 'hidden'}
            animate="show"
            className="text-2xl font-semibold tabular-nums tracking-tight text-text sm:text-[28px]"
          >
            {formatter(Math.round(displayed))}
          </motion.p>
        )}
        <p className="mt-1.5 text-sm text-text-secondary">{label}</p>
        {hint && !loading && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
      </div>
    </motion.article>
  );
}
