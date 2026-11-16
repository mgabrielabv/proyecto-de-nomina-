import type { Variants } from 'framer-motion';
import { DURATION, EASE } from '../../constants';

export const iconSwapVariants: Variants = {
  hidden: { opacity: 0, rotate: -20, scale: 0.8 },
  show: { opacity: 1, rotate: 0, scale: 1, transition: { duration: DURATION.fast, ease: EASE.out } },
  exit: { opacity: 0, rotate: 20, scale: 0.8, transition: { duration: DURATION.instant, ease: EASE.in } },
};

export const themeIconSwapVariants: Variants = {
  hidden: { opacity: 0, rotate: -90, scale: 0.6 },
  show: { opacity: 1, rotate: 0, scale: 1, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, rotate: 90, scale: 0.6, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const iconFlipVariants = themeIconSwapVariants;
