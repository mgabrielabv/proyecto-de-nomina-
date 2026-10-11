import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  errorMessageVariants,
  floatingLabelVariants,
  focusLineVariants,
  inputShellVariants,
} from '../../../animations/variants';
import { cn } from '../../../utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'children'> {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlurField?: () => void;
  error?: string | null;
  success?: boolean;
  trailing?: ReactNode;
}

export function Input(props: InputProps) {
  const { name, label, value, onChange, onBlurField, error, success, trailing, ...restProps } = props;
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [focused, setFocused] = useState(false);
  const previousError = useRef<string | null | undefined>(null);
  const floated = focused || value.length > 0;
  const errorId = `${name}-error`;

  useEffect(() => {
    if (error && error !== previousError.current) {
      void controls.start('shake');
    }
    previousError.current = error ?? null;
  }, [error, controls]);

  const handleFocus = () => {
    setFocused(true);
    if (!reduce) void controls.start('rest');
  };

  const handleBlur = () => {
    setFocused(false);
    onBlurField?.();
    if (!reduce) void controls.start('rest');
  };

  return (
    <div className="relative">
      <motion.div
        variants={inputShellVariants}
        initial="rest"
        animate={controls}
        className={cn(
          'relative h-14 rounded-input border bg-surface-soft transition-all duration-200',
          'focus-within:-translate-y-px focus-within:border-accent focus-within:shadow-input-focus',
          error ? 'border-error' : success ? 'border-success' : 'border-border',
        )}
      >
        <div className="pointer-events-none absolute inset-0 px-4">
          <motion.label
            htmlFor={name}
            variants={floatingLabelVariants}
            initial={false}
            animate={floated ? 'floated' : 'rest'}
            style={{ originX: 0, originY: 0.5 }}
            className="flex h-full items-center text-[15px]"
          >
            <span className="truncate">{label}</span>
            {restProps.required && (
              <span className="ml-0.5 text-error" aria-hidden>
                *
              </span>
            )}
          </motion.label>
        </div>
        <input
          {...restProps}
          id={name}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-full w-full bg-transparent pb-1.5 pl-4 pt-6 text-[15px] text-text caret-accent outline-none placeholder:text-text-muted',
            trailing ? 'pr-12' : 'pr-4',
          )}
        />
        {trailing && <div className="absolute inset-y-0 right-2.5 flex items-center">{trailing}</div>}
        <motion.span
          aria-hidden
          variants={focusLineVariants}
          initial="rest"
          animate={focused ? 'focused' : 'rest'}
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] origin-center rounded-full',
            success && !focused ? 'bg-success' : 'bg-accent',
          )}
        />
      </motion.div>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key={error}
            id={errorId}
            role="alert"
            variants={errorMessageVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex items-center gap-1.5 overflow-hidden text-xs text-error"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}