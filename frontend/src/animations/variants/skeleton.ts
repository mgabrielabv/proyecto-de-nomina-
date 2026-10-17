import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const skeletonPulseVariants: Variants = {
  hidden: { opacity: 0.45 },
  show: { opacity: 0.9, transition: { duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' } },
};

export const skeletonGroupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const chartDrawVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.6, transformOrigin: 'bottom' },
  show: { opacity: 1, scaleY: 1, transition: { duration: 0.7, ease: EASE_OUT } },
};

export const countUpVariants: Variants = {
  hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: EASE_OUT } },
};
