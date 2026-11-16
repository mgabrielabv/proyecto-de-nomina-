import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { skeletonGroupVariants, skeletonPulseVariants } from '../../../animations/variants';
import { usePageVisibility } from '../../../hooks';
import { cn } from '../../../utils';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  const reduce = useReducedMotion();
  const visible = usePageVisibility();
  const animatePulse = !reduce && visible;
  return (
    <motion.span
      aria-hidden
      variants={animatePulse ? skeletonPulseVariants : undefined}
      initial={animatePulse ? 'hidden' : undefined}
      animate={animatePulse ? 'show' : undefined}
      className={cn('block rounded-lg bg-surface-soft', className)}
      style={!animatePulse ? { opacity: 0.7 } : undefined}
    />
  );
}

export function SkeletonGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={skeletonGroupVariants} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
