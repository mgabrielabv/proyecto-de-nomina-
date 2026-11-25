import type { Variants } from 'framer-motion';
import { DURATION, EASE } from '../../constants';

export const tabIndicatorTransition = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
};

export const tabPanelVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const accordionVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show: { opacity: 1, height: 'auto', marginTop: 8, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const tabIndicatorVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};
