import { motion, useMotionTemplate, useSpring, type MotionValue } from 'framer-motion';

export interface CursorSpotlightProps {
  x: MotionValue<number>;
  y: MotionValue<number>;
}

export function CursorSpotlight({ x, y }: CursorSpotlightProps) {
  const smoothX = useSpring(x, { stiffness: 90, damping: 20, mass: 0.5 });
  const smoothY = useSpring(y, { stiffness: 90, damping: 20, mass: 0.5 });
  const background = useMotionTemplate`radial-gradient(520px circle at ${smoothX}px ${smoothY}px, var(--color-spot), transparent 65%)`;

  return <motion.div className="pointer-events-none absolute inset-0 z-[1]" style={{ background }} aria-hidden />;
}