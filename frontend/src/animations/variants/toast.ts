import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -24, scale: 0.94, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 380, damping: 28 } },
  exit: { opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const toastListVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

export const badgePopVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 18 } },
};

export const emptyStateVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: EASE_OUT } },
};
