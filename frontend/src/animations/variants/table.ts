import type { Variants } from 'framer-motion';
import { DURATION, EASE, STAGGER } from '../../constants';

export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const tableContainerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.tight, delayChildren: 0.02 } },
};

export const rowHoverVariants: Variants = {
  rest: { backgroundColor: 'rgba(0,0,0,0)' },
  hover: { backgroundColor: 'var(--color-spot)', transition: { duration: DURATION.fast, ease: EASE.out } },
};

export const hoverLiftVariants: Variants = {
  rest: { y: 0 },
  hover: { y: -2, transition: { duration: DURATION.fast, ease: EASE.out } },
};
