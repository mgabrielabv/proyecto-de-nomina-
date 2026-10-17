import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { skeletonGroupVariants, skeletonPulseVariants } from '../../../animations/variants';
import { cn } from '../../../utils';

export interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      variants={reduce ? undefined : skeletonPulseVariants}
      initial={reduce ? undefined : 'hidden'}
      animate={reduce ? undefined : 'show'}
      className={cn('block rounded-lg bg-surface-soft', className)}
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
