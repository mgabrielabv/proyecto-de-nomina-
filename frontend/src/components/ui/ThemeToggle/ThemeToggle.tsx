import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useRef } from 'react';
import { themeIconSwapVariants } from '../../../animations/variants';
import { useTheme } from '../../../hooks';
import { cn } from '../../../utils';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const reduce = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
    toggleTheme(origin);
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      whileHover={reduce ? undefined : { scale: 1.04 }}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={isDark}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/70 text-text-secondary shadow-sm backdrop-blur-md transition-colors duration-base hover:border-border-strong hover:text-text',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          variants={reduce ? undefined : themeIconSwapVariants}
          initial={reduce ? false : 'hidden'}
          animate={reduce ? undefined : 'show'}
          exit={reduce ? undefined : 'exit'}
          className="flex"
        >
          {isDark ? <Moon className="h-[18px] w-[18px]" aria-hidden /> : <Sun className="h-[18px] w-[18px]" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
