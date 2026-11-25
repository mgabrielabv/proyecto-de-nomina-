import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUpItem, staggerContainer } from '../../../animations/variants';
import { cn } from '../../../utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <motion.header
      variants={staggerContainer(0.05)}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <motion.div variants={fadeUpItem} className="min-w-0">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-text sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>}
      </motion.div>
      {actions && (
        <motion.div variants={fadeUpItem} className={cn('flex shrink-0 flex-wrap items-center gap-2.5')}>
          {actions}
        </motion.div>
      )}
    </motion.header>
  );
}
