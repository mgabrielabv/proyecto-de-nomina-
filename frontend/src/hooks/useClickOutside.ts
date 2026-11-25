import { useEffect, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  active = true,
): void {
  useEffect(() => {
    if (!active) return;
    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const node = ref.current;
      if (!node || node.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
    };
  }, [ref, handler, active]);
}
