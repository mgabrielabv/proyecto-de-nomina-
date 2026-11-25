export interface OrbConfig {
  id: string;
  size: number;
  left: string;
  top: string;
  duration: number;
  driftX: number;
  driftY: number;
  scale: number;
  token: string;
}

export const ORB_CONFIGS: OrbConfig[] = [
  { id: 'orb-a', size: 520, left: '-10%', top: '-16%', duration: 30, driftX: 70, driftY: 46, scale: 1.1, token: 'var(--orb-a)' },
  { id: 'orb-b', size: 440, left: '58%', top: '24%', duration: 24, driftX: -60, driftY: 80, scale: 1.14, token: 'var(--orb-b)' },
  { id: 'orb-c', size: 420, left: '22%', top: '66%', duration: 34, driftX: 52, driftY: -60, scale: 1.08, token: 'var(--orb-c)' },
];
