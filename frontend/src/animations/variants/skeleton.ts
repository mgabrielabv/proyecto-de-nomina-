import type { Variants } from 'framer-motion';
import { DURATION, EASE, STAGGER } from '../../constants';

export const skeletonPulseVariants: Variants = {
  hidden: { opacity: 0.45 },
  show: {
    opacity: 0.85,
    transition: { duration: 0.9, ease: EASE.inOut, repeat: Infinity, repeatType: 'reverse' },
  },
};

export const progressBarVariants = (width: string): Variants => ({
  hidden: { width: 0 },
  show: { width, transition: { duration: DURATION.slower, ease: EASE.out, delay: 0.25 } },
});

export const chartRevealVariants: Variants = {
  hidden: { opacity: 0, scaleY: 0.94 },
  show: { opacity: 1, scaleY: 1, transition: { duration: DURATION.slow, ease: EASE.out } },
};

export const contentRevealVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
};

export const chartDrawVariants = chartRevealVariants;

export const skeletonGroupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER.tight } },
};
