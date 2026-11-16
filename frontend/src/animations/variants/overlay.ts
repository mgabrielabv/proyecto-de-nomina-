import type { Variants } from 'framer-motion';
import { DURATION, EASE, SPRING } from '../../constants';

export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.fast, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING.soft,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: DURATION.fast, ease: EASE.in },
  },
};

export const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0.98 },
  show: { x: 0, opacity: 1, transition: SPRING.soft },
  exit: { x: '100%', opacity: 0.98, transition: { duration: DURATION.base, ease: EASE.in } },
};

export const drawerLeftVariants: Variants = {
  hidden: { x: '-100%', opacity: 0.98 },
  show: { x: 0, opacity: 1, transition: SPRING.soft },
  exit: { x: '-100%', opacity: 0.98, transition: { duration: DURATION.base, ease: EASE.in } },
};

export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -4, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.fast, ease: EASE.out } },
  exit: { opacity: 0, y: -4, scale: 0.97, transition: { duration: DURATION.instant, ease: EASE.in } },
};

export const overlayVariants = backdropVariants;
export const menuVariants = dropdownVariants;
