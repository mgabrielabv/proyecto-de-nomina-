import { useEffect } from 'react';
import { usePageVisibility } from './usePageVisibility';

export function usePauseAnimationsWhenHidden(): void {
  const visible = usePageVisibility();
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.removeAttribute('data-paused');
    else root.setAttribute('data-paused', 'true');
  }, [visible]);
}
