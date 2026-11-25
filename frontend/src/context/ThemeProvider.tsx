import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { THEME_STORAGE_KEY } from '../constants';
import type { Theme } from '../types';
import { getInitialTheme } from '../utils';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (origin?: { x: number; y: number }) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      document.documentElement.classList.remove('theme-transition');
    };
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next);
  }, []);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const root = document.documentElement;
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const reduce = prefersReducedMotion();
    const canUseViewTransition = !reduce && typeof (document as any).startViewTransition === 'function' && origin;

    const run = () => applyTheme(next);

    if (canUseViewTransition) {
      try {
        const vt = (document as any).startViewTransition(run);
        const x = origin!.x;
        const y = origin!.y;
        const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        vt.ready?.then(() => {
          if (reduce) return;
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
            { duration: 450, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
          );
        }).catch(() => {});
        return;
      } catch {
        // fallback below
      }
    }

    if (!reduce) {
      root.classList.add('theme-transition');
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        root.classList.remove('theme-transition');
        timerRef.current = null;
      }, 240);
    }
    run();
  }, [applyTheme, theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
