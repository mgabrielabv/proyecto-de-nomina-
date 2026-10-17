import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, filter: 'blur(6px)', transition: { duration: 0.22, ease: 'easeIn' } },
};

export const layoutVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};

export const stepPanelVariants: Variants = {
  hidden: { opacity: 0, x: 32, filter: 'blur(8px)' },
  show: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: EASE_OUT } },
  exit: { opacity: 0, x: -32, filter: 'blur(8px)', transition: { duration: 0.25, ease: 'easeIn' } },
};
