import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { type ButtonHTMLAttributes } from 'react';
import {
  buttonVariants,
  contentSwapVariants,
  shimmerVariants,
  successCheckVariants,
} from '../../../animations/variants';
import { cn } from '../../../utils';
import { Spinner } from './Spinner';

export type ButtonState = 'idle' | 'loading' | 'success';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  state?: ButtonState;
  size?: ButtonSize;
  fullWidth?: boolean;
  successLabel?: string;
  shimmer?: boolean;
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function Button(props: ButtonProps) {
  const {
    state = 'idle',
    size = 'md',
    fullWidth = false,
    successLabel = 'Listo',
    shimmer = true,
    className,
    children,
    disabled,
    ...restProps
  } = props;
  const reduce = useReducedMotion();
  const isBusy = state === 'loading';
  const interactive = state === 'idle' && !disabled && !reduce;

  return (
    <motion.button
      {...restProps}
      variants={buttonVariants}
      initial={false}
      whileHover={interactive ? 'hover' : undefined}
      whileTap={interactive ? 'tap' : undefined}
      disabled={disabled || isBusy}
      aria-live="polite"
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-button font-medium tracking-tight transition-colors duration-200',
        state === 'success'
          ? 'border border-success/30 bg-success-soft text-success'
          : 'border border-transparent bg-accent text-accent-text hover:bg-accent-hover',
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || isBusy) && 'cursor-default opacity-90',
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === 'loading' && (
          <motion.span
            key="loading"
            variants={contentSwapVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex items-center justify-center gap-2.5"
          >
            <Spinner />
            {children}
          </motion.span>
        )}
        {state === 'success' && (
          <motion.span
            key="success"
            variants={contentSwapVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex items-center gap-2"
          >
            <motion.span variants={successCheckVariants} initial="hidden" animate="show">
              <Check className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden />
            </motion.span>
            {successLabel}
          </motion.span>
        )}
        {state === 'idle' && (
          <motion.span
            key="idle"
            variants={contentSwapVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex items-center justify-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
      {shimmer && state === 'idle' && !reduce && (
        <motion.span
          aria-hidden
          variants={shimmerVariants}
          initial="rest"
          className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      )}
    </motion.button>
  );
}