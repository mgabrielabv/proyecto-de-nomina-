import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { hoverLiftVariants } from '../../../animations/variants';
import { cn } from '../../../utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: CardPadding;
  hover?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-5',
  md: 'p-6',
  lg: 'p-7 sm:p-8',
};

export function Card({ children, className, padding = 'md', hover = false }: CardProps) {
  const reduce = useReducedMotion();

  if (hover && !reduce) {
    return (
      <motion.article
        variants={hoverLiftVariants}
        initial="rest"
        whileHover="hover"
        animate="rest"
        className={cn('glass-card', paddingClasses[padding], className)}
      >
        {children}
      </motion.article>
    );
  }

  return <article className={cn('glass-card', paddingClasses[padding], className)}>{children}</article>;
}
