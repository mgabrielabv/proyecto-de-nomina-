import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { pageVariants } from '../../../animations/variants';

export function PageTransition() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
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
