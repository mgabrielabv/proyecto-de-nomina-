import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const tabIndicatorVariants: Variants = {
  hidden: { opacity: 0, scaleX: 0.6 },
  show: { opacity: 1, scaleX: 1, transition: { type: 'spring', stiffness: 420, damping: 34 } },
};

export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.18, ease: 'easeIn' } },
};

export const listCollapseVariants: Variants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show: { opacity: 1, height: 'auto', marginTop: 8, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.24, ease: 'easeIn' } },
};
