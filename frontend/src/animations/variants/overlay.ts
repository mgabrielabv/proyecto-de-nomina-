import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 18, filter: 'blur(10px)' },
  show: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: { opacity: 0, scale: 0.96, y: 10, filter: 'blur(8px)', transition: { duration: 0.2, ease: 'easeIn' } },
};

export const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0.4 },
  show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 32 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.24, ease: 'easeIn' } },
};

export const drawerLeftVariants: Variants = {
  hidden: { x: '-100%', opacity: 0.4 },
  show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 32 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.24, ease: 'easeIn' } },
};

export const menuVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, y: 6, scale: 0.97, filter: 'blur(4px)', transition: { duration: 0.14, ease: 'easeIn' } },
};
