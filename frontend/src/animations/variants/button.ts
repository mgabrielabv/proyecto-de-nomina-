import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } },
  tap: { scale: 0.985 },
};

export const contentSwapVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const shimmerVariants: Variants = {
  rest: { x: '-160%' },
  hover: { x: '380%', transition: { duration: 0.9, ease: 'easeInOut' } },
};

export const successCheckVariants: Variants = {
  hidden: { scale: 0, rotate: -90 },
  show: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 18, delay: 0.1 } },
};
