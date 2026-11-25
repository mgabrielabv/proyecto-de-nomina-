import type { Variants } from 'framer-motion';
import { DURATION, EASE, INPUT_FLOATING_OFFSET, SPRING } from '../../constants';

export const inputShellVariants: Variants = {
  rest: { y: 0 },
  shake: { x: [0, -6, 6, -4, 4, -2, 0], transition: { duration: 0.35, ease: EASE.inOut } },
};

export const floatingLabelVariants: Variants = {
  rest: { y: 0, scale: 1, color: 'var(--color-text-muted)' },
  floated: {
    y: INPUT_FLOATING_OFFSET,
    scale: 0.72,
    color: 'var(--color-text-secondary)',
    transition: SPRING.soft,
  },
};

export const focusLineVariants: Variants = {
  rest: { scaleX: 0.4, opacity: 0 },
  focused: { scaleX: 1, opacity: 1, transition: { duration: DURATION.fast, ease: EASE.out } },
};
