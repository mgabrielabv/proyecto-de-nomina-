import type { Variants } from 'framer-motion';
import { DURATION, EASE } from '../../constants';

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'none',
    transition: { duration: DURATION.slow, ease: EASE.out },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: 'none',
    transition: { duration: DURATION.fast, ease: EASE.in },
  },
};

export const layoutVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const stepPanelVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, x: -16, transition: { duration: DURATION.fast, ease: EASE.in } },
};
