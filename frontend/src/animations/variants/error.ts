import type { Variants } from 'framer-motion';
import { EASE_OUT } from '../../constants';

export const errorMessageVariants: Variants = {
  hidden: { height: 0, opacity: 0, marginTop: 0 },
  show: { height: 'auto', opacity: 1, marginTop: 6, transition: { duration: 0.25, ease: EASE_OUT } },
  exit: { height: 0, opacity: 0, marginTop: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};
