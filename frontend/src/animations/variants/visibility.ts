import type { Variants } from 'framer-motion';

export const iconSwapVariants: Variants = {
  hidden: { opacity: 0, rotateY: -90, scale: 0.4 },
  show: { opacity: 1, rotateY: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 26 } },
  exit: { opacity: 0, rotateY: 90, scale: 0.4, transition: { duration: 0.15, ease: 'easeIn' } },
};

export const iconFlipVariants: Variants = {
  hidden: { opacity: 0, rotate: -120, scale: 0.4 },
  show: { opacity: 1, rotate: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 24 } },
  exit: { opacity: 0, rotate: 120, scale: 0.4, transition: { duration: 0.18, ease: 'easeIn' } },
};
