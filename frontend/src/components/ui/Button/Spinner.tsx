import { motion } from 'framer-motion';
import { cn } from '../../../utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={cn('inline-flex h-4 w-4', className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </motion.span>
  );
}