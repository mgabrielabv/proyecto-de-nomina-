import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: { opacity: 0, x: 60, height: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

export const tableContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

export const rowHoverVariants: Variants = {
  rest: { backgroundColor: 'rgba(0,0,0,0)' },
  hover: { backgroundColor: 'var(--color-spot)', transition: { duration: 0.18, ease: 'easeOut' } },
};

export const hoverLiftVariants: Variants = {
  rest: { y: 0, boxShadow: 'var(--shadow-card)' },
  hover: { y: -3, boxShadow: '0 2px 4px rgba(28,25,23,0.05), 0 28px 56px -30px rgba(28,25,23,0.28)', transition: { duration: 0.24, ease: EASE_OUT } },
};
