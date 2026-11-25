import type { Variants } from 'framer-motion';
import { DURATION, EASE, SPRING } from '../../constants';

export const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.01, transition: { duration: DURATION.fast, ease: EASE.out } },
  tap: { scale: 0.98 },
};

export const contentSwapVariants: Variants = {
  hidden: { opacity: 0, y: 4, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.fast, ease: EASE.out } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: DURATION.instant, ease: EASE.in } },
};

export const shimmerVariants: Variants = {
  rest: { x: '-160%' },
  hover: { x: '380%', transition: { duration: DURATION.slower, ease: EASE.inOut } },
};

export const successCheckVariants: Variants = {
  hidden: { scale: 0.8, rotate: -45, opacity: 0 },
  show: { scale: 1, rotate: 0, opacity: 1, transition: { ...SPRING.snappy, delay: 0.05 } },
};
