import { motion, useReducedMotion } from 'framer-motion';
import { ORB_CONFIGS } from '../../../constants';
import { orbFloatVariants } from '../../../animations/variants';

export function FloatingOrbs() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <>
        {ORB_CONFIGS.map((orb) => (
          <div
            key={orb.id}
            aria-hidden
            className="pointer-events-none absolute rounded-full blur-[90px]"
            style={{
              width: orb.size,
              height: orb.size,
              left: orb.left,
              top: orb.top,
              background: `radial-gradient(circle at 30% 30%, ${orb.token}, transparent 70%)`,
            }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {ORB_CONFIGS.map((orb) => (
        <motion.div
          key={orb.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full blur-[90px]"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.left,
            top: orb.top,
            background: `radial-gradient(circle at 30% 30%, ${orb.token}, transparent 70%)`,
          }}
          variants={orbFloatVariants(orb)}
          initial={false}
          animate="float"
        />
      ))}
    </>
  );
}