import type { Variants } from 'framer-motion';
import { DURATION, EASE } from '../../constants';

export const errorMessageVariants: Variants = {
  hidden: { height: 0, opacity: 0, marginTop: 0 },
  show: { height: 'auto', opacity: 1, marginTop: 6, transition: { duration: DURATION.fast, ease: EASE.out } },
  exit: { height: 0, opacity: 0, marginTop: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
};
