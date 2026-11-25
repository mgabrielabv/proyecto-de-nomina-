import type { Variants } from 'framer-motion';
import { DURATION, EASE, SPRING } from '../../constants';

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -12, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING.snappy,
  },
  exit: { opacity: 0, x: 40, scale: 0.96, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const badgePopVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: SPRING.snappy },
};

export const emptyStateVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
};
