import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { iconFlipVariants } from '../../../animations/variants';
import { useTheme } from '../../../hooks';
import { cn } from '../../../utils';

export interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={isDark}
      style={{ perspective: 500 }}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border border-border bg-surface/70 text-text-secondary shadow-sm backdrop-blur-md transition-colors duration-200 hover:border-border-strong hover:text-text',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} variants={iconFlipVariants} initial="hidden" animate="show" exit="exit" className="flex">
          {isDark ? <Moon className="h-[18px] w-[18px]" aria-hidden /> : <Sun className="h-[18px] w-[18px]" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}