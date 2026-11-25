import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { pageVariants } from '../../../animations/variants';
import { DURATION, EASE } from '../../../constants';
import { useLowEndDevice } from '../../../hooks';

const simplePageVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } },
} as const;

export function PageTransition() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const lowEnd = useLowEndDevice();
  const variants = useMemo(() => (reduce || lowEnd ? simplePageVariants : pageVariants), [reduce, lowEnd]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial={reduce ? false : 'hidden'}
        animate="show"
        exit={reduce ? undefined : 'exit'}
        className="w-full"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
