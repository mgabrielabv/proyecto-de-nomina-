import type { Variants } from 'framer-motion';
import type { OrbConfig } from '../../constants';

export const orbFloatVariants = (config: OrbConfig): Variants => ({
  float: {
    x: [0, config.driftX, 0],
    y: [0, config.driftY, 0],
    scale: [1, config.scale, 1],
    transition: { duration: config.duration, times: [0, 0.5, 1], repeat: Infinity, ease: 'easeInOut' },
  },
});
