import { useMotionValue, useReducedMotion } from 'framer-motion';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { cn } from '../../../utils';
import { CursorSpotlight } from '../CursorSpotlight';
import { FloatingOrbs } from '../FloatingOrbs';

export interface AnimatedBackgroundProps {
  children?: ReactNode;
  className?: string;
}

export function AnimatedBackground({ children, className }: AnimatedBackgroundProps) {
  const reduce = useReducedMotion();
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)} onPointerMove={reduce ? undefined : handlePointerMove}>
      <div className="panel-gradient absolute inset-0" aria-hidden />
      {!reduce && <FloatingOrbs />}
      {!reduce && <CursorSpotlight x={x} y={y} />}
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="grain absolute inset-0" aria-hidden />
      <div className="relative z-10 flex h-full w-full flex-col">{children}</div>
    </div>
  );
}