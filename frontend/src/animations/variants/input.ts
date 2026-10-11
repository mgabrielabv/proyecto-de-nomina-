import type { Variants } from 'framer-motion';
import { INPUT_FLOATING_OFFSET } from '../../constants';

export const inputShellVariants: Variants = {
  rest: { y: 0 },
  shake: { x: [0, -9, 9, -6, 6, -3, 0], transition: { duration: 0.45, ease: 'easeInOut' } },
};

export const floatingLabelVariants: Variants = {
  rest: { y: 0, scale: 1, color: 'var(--color-text-muted)' },
  floated: {
    y: INPUT_FLOATING_OFFSET,
    scale: 0.72,
    color: 'var(--color-text-secondary)',
    transition: { type: 'spring', stiffness: 320, damping: 26 },
  },
};

export const focusLineVariants: Variants = {
  rest: { scaleX: 0.4, opacity: 0 },
  focused: { scaleX: 1, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
};
