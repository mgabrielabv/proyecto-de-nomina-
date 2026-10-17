import { animate, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { EASE_OUT } from '../constants';

export function useAnimatedCounter(target: number, duration = 1.1): number {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: EASE_OUT,
      onUpdate: (latest) => setValue(latest),
    });
    return () => controls.stop();
  }, [target, duration, reduce]);

  return value;
}
