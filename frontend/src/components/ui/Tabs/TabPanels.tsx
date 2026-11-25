import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Children, isValidElement, useRef, type ReactElement, type ReactNode } from 'react';
import { DURATION, EASE } from '../../../constants';

export interface TabPanelsProps {
  value: string;
  children: ReactNode;
}

export function TabPanels({ value, children }: TabPanelsProps) {
  const reduce = useReducedMotion();
  const orderRef = useRef<string[]>([]);
  const prevRef = useRef<string>(value);

  const panels = Children.toArray(children).filter(isValidElement) as Array<ReactElement<{ value: string }>>;
  if (!orderRef.current.length) {
    orderRef.current = panels.map((p) => p.props.value);
  }

  const prev = prevRef.current;
  const prevIndex = orderRef.current.indexOf(prev);
  const nextIndex = orderRef.current.indexOf(value);
  const dir = prevIndex === -1 || nextIndex === -1 ? 0 : Math.sign(nextIndex - prevIndex);
  prevRef.current = value;

  const variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.01 } }, exit: { opacity: 0, transition: { duration: 0.01 } } }
    : {
        hidden: { opacity: 0, x: dir >= 0 ? 12 : -12 },
        show: { opacity: 1, x: 0, transition: { duration: DURATION.base, ease: EASE.out } },
        exit: { opacity: 0, x: dir >= 0 ? -12 : 12, transition: { duration: DURATION.fast, ease: EASE.in } },
      };

  const active = panels.find((p) => p.props.value === value) ?? null;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {active ? (
        <motion.div key={value} variants={variants} initial="hidden" animate="show" exit="exit">
          {active}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export interface TabPanelProps {
  value: string;
  children: ReactNode;
}

export function TabPanel({ children }: TabPanelProps) {
  return <>{children}</>;
}
