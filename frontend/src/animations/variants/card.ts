import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const authCardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97, filter: 'blur(10px)' },
  show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.9, filter: 'blur(8px)', transition: { duration: 0.45, ease: 'easeIn' } },
};

export const successCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const modeSwapVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(5px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: EASE_OUT } },
  exit: { opacity: 0, y: -14, filter: 'blur(5px)', transition: { duration: 0.25, ease: 'easeIn' } },
};
