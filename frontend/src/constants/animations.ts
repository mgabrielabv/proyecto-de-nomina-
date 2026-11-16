export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  base: 0.24,
  slow: 0.4,
  slower: 0.6,
} as const;

export const EASE = {
  out: [0.22, 1, 0.36, 1],
  in: [0.4, 0, 1, 1],
  inOut: [0.65, 0, 0.35, 1],
  sidebar: [0.32, 0.72, 0, 1],
} as const;

export const SPRING = {
  soft: { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 },
  snappy: { type: 'spring', stiffness: 420, damping: 32 },
  gentle: { type: 'spring', stiffness: 170, damping: 26 },
} as const;

export const STAGGER = {
  tight: 0.03,
  base: 0.05,
  loose: 0.08,
} as const;

// Aliases legacy (compatibilidad)
export const EASE_IN = EASE.in;
export const EASE_OUT = EASE.out;
export const EASE_SIDEBAR = EASE.sidebar;
export const STAGGER_DELAY = STAGGER.base;

export const INPUT_FLOATING_OFFSET = -16;
export const SUCCESS_EXIT_DELAY = 550;
