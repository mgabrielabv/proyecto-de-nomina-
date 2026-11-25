import { useMemo } from 'react';

type NavigatorWithDeviceMemory = Navigator & { deviceMemory?: number };

export function useLowEndDevice(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const nav = navigator as NavigatorWithDeviceMemory;
    const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 8;
    const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
    const prefersReducedData =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-data: reduce)').matches;
    return cores <= 4 || memory <= 4 || prefersReducedData;
  }, []);
}
