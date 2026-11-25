import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  type AnimationEvent,
  type ClipboardEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  errorMessageVariants,
  floatingLabelVariants,
  focusLineVariants,
  inputShellVariants,
} from '../../../animations/variants';
import { MAX_PASSWORD_BYTES } from '../../../constants';
import { useToastStore } from '../../../store';
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
  showCounter?: boolean | 'auto';
  hint?: string;
}

let lastPasteToastAt = 0;

function getByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, forwardedRef) {
  const {
    name,
    label,
    value,
    onChange,
    onBlurField,
    error,
    success,
    trailing,
    showCounter = 'auto',
    hint,
    onPaste,
    onAnimationStart,
    maxLength,
    type,
    ...restProps
  } = props;
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const innerRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);

  const [focused, setFocused] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const [counterPulse, setCounterPulse] = useState(false);
  const [announce, setAnnounce] = useState('');
  const previousError = useRef<string | null | undefined>(null);
  const prevLenRef = useRef(0);

  const pushToast = useToastStore((s) => s.push);

  const isDateOrTimeType = ['date', 'time', 'datetime-local', 'month', 'week'].includes(type ?? '');
  const hasValue = Boolean(value && String(value).length > 0);
  const floated = isDateOrTimeType || focused || hasValue || autofilled;
  const errorId = `${name}-error`;

  // Autofill detection (webkit animation hook + delayed checks)
  useEffect(() => {
    const syncAutofill = () => {
      const el = innerRef.current;
      if (!el) return;
      try {
        if (el.matches?.(':-webkit-autofill')) {
          setAutofilled(true);
          if (el.value && el.value !== value) onChange(el.value);
        }
      } catch {
        // ignore selector errors
      }
      if (el.value) {
        // Firefox/Safari or delayed fill
        if (!autofilled) setAutofilled(true);
      } else if (!el.matches?.(':-webkit-autofill')) {
        // let cancel handler decide; avoid clearing while focused typing edge cases
      }
    };
    syncAutofill();
    const t1 = window.setTimeout(syncAutofill, 100);
    const t2 = window.setTimeout(syncAutofill, 500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error && error !== previousError.current && !reduce) {
      void controls.start('shake');
    }
    previousError.current = error ?? null;
  }, [error, controls, reduce]);

  const handleAnimationStart = (e: AnimationEvent<HTMLInputElement>) => {
    onAnimationStart?.(e);
    if (e.animationName === 'onAutoFillStart') {
      setAutofilled(true);
      const el = innerRef.current;
      if (el?.value && el.value !== value) onChange(el.value);
    } else if (e.animationName === 'onAutoFillCancel') {
      setAutofilled(false);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    // re-check autofill state
    const el = innerRef.current;
    if (el) {
      let webkit = false;
      try { webkit = !!el.matches?.(':-webkit-autofill'); } catch { /* noop */ }
      setAutofilled(webkit || Boolean(el.value));
    }
    onBlurField?.();
  };

  const isPassword = type === 'password';
  const counterMax = isPassword ? MAX_PASSWORD_BYTES : (typeof maxLength === 'number' ? maxLength : undefined);
  const currentCount = isPassword ? getByteLength(value) : value.length;
  const ratio = counterMax ? currentCount / counterMax : 0;
  const showCounterEffective =
    counterMax != null &&
    (showCounter === true ||
      (showCounter === 'auto' && (focused || ratio >= 0.8 || Boolean(error))));
  const counterTone = ratio >= 1 ? 'text-error' : ratio >= 0.9 ? 'text-warning' : 'text-text-muted';

  useEffect(() => {
    if (!counterMax) return;
    const prev = prevLenRef.current;
    prevLenRef.current = currentCount;
    if (currentCount >= counterMax && prev < counterMax) {
      setCounterPulse(true);
      window.setTimeout(() => setCounterPulse(false), 200);
    }
    if (ratio >= 1 && prev / counterMax < 1) setAnnounce(`Límite alcanzado: ${currentCount} de ${counterMax}.`);
    else if (ratio >= 0.9 && prev / counterMax < 0.9) setAnnounce(`Cerca del límite: ${currentCount} de ${counterMax}.`);
  }, [currentCount, counterMax, ratio]);

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    onPaste?.(e);
    if (e.defaultPrevented) return;
    if (typeof maxLength !== 'number') return;
    const el = innerRef.current;
    if (!el) return;
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + pasted + value.slice(end);
    if (next.length > maxLength) {
      e.preventDefault();
      const allowed = Math.max(0, maxLength - (value.length - (end - start)));
      const clipped = pasted.slice(0, allowed);
      onChange(value.slice(0, start) + clipped + value.slice(end));
      const now = Date.now();
      if (now - lastPasteToastAt > 3000) {
        lastPasteToastAt = now;
        pushToast('Se recortó el texto pegado al límite permitido.', 'warning');
      }
    }
  };

  const hasBelow = Boolean(error) || Boolean(hint) || showCounterEffective;

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
          ref={innerRef}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          onAnimationStart={handleAnimationStart}
          maxLength={maxLength}
          placeholder={floated && !isDateOrTimeType ? restProps.placeholder : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-full w-full truncate bg-transparent pb-1.5 pl-4 pt-6 text-[15px] text-text caret-accent outline-none placeholder:text-text-secondary placeholder:text-ellipsis',
            'disabled:cursor-not-allowed disabled:text-text-muted',
            trailing || showCounterEffective ? 'pr-16' : 'pr-4',
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
        {showCounterEffective && !trailing && (
          <motion.span
            initial={{ opacity: 0, y: 2 }}
            animate={counterPulse && !reduce ? { opacity: 1, y: 0, scale: [1, 1.08, 1] } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'pointer-events-none absolute bottom-1.5 right-3 text-[11px] tabular-nums',
              counterTone,
            )}
            aria-hidden
          >
            {currentCount}/{counterMax}{isPassword ? ' bytes' : ''}
          </motion.span>
        )}
      </motion.div>
      <div className={cn('min-h-[1.25rem]', hasBelow ? 'mt-1' : 'mt-0')}>
        <AnimatePresence initial={false} mode="popLayout">
          {error ? (
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
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              className="text-xs text-text-muted"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
});
