import type { Variants } from 'framer-motion';
import { DURATION, EASE } from '../../constants';

export const authCardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DURATION.slow, ease: EASE.out } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const successCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE.out } },
};

export const modeSwapVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const fadeSwapVariants = modeSwapVariants;
