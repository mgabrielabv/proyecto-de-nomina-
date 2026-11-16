import type { Variants } from 'framer-motion';
import { DURATION, EASE, STAGGER } from '../../constants';

export const staggerContainer = (delay: number = STAGGER.base, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay, delayChildren } },
});

export const staggerContainerVariants: Variants = staggerContainer();

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
};

export const fadeUpSmallItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE.in } },
};

export const countUpVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
};
