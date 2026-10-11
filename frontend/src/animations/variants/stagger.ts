import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export function staggerContainer(staggerChildren = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  };
}

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: EASE_OUT } },
};

export const fadeSwapVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.18, ease: 'easeIn' } },
};
