import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useEffect, useRef, useState, type TextareaHTMLAttributes } from 'react';
import { errorMessageVariants, floatingLabelVariants, focusLineVariants, inputShellVariants } from '../../../animations/variants';
import { useToastStore } from '../../../store';
import { cn } from '../../../utils';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'children'> {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlurField?: () => void;
  error?: string | null;
  hint?: string;
  showCounter?: boolean | 'auto';
}

let lastPasteToastAt = 0;

export function Textarea(props: TextareaProps) {
  const { name, label, value, onChange, onBlurField, error, hint, showCounter = 'auto', maxLength, rows = 3, ...rest } = props;
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  const [focused, setFocused] = useState(false);
  const [counterPulse, setCounterPulse] = useState(false);
  const prevErr = useRef<string | null | undefined>(null);
  const prevLen = useRef(0);
  const pushToast = useToastStore((s) => s.push);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const hasValue = value.length > 0;
  const floated = focused || hasValue;
  const errorId = `${name}-error`;

  useEffect(() => {
    if (error && error !== prevErr.current && !reduce) void controls.start('shake');
    prevErr.current = error ?? null;
  }, [error, controls, reduce]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 24;
    const maxH = lineHeight * 6 + 28;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, [value]);

  const currentCount = value.length;
  const counterMax = typeof maxLength === 'number' ? maxLength : undefined;
  const ratio = counterMax ? currentCount / counterMax : 0;
  const showCounterEffective =
    counterMax != null && (showCounter === true || (showCounter === 'auto' && (focused || ratio >= 0.8 || Boolean(error))));
  const counterTone = ratio >= 1 ? 'text-error' : ratio >= 0.9 ? 'text-warning' : 'text-text-muted';

  useEffect(() => {
    if (!counterMax) return;
    const prev = prevLen.current;
    prevLen.current = currentCount;
    if (currentCount >= counterMax && prev < counterMax) {
      setCounterPulse(true);
      window.setTimeout(() => setCounterPulse(false), 200);
    }
  }, [currentCount, counterMax]);

  return (
    <div className="relative">
      <motion.div
        variants={inputShellVariants}
        initial="rest"
        animate={controls}
        className={cn(
          'relative min-h-[5.5rem] rounded-input border bg-surface-soft transition-all duration-200',
          'focus-within:-translate-y-px focus-within:border-accent focus-within:shadow-input-focus',
          error ? 'border-error' : 'border-border',
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-4">
          <motion.label
            htmlFor={name}
            variants={floatingLabelVariants}
            initial={false}
            animate={floated ? 'floated' : 'rest'}
            style={{ originX: 0, originY: 0.5 }}
            className="flex items-center text-[15px]"
          >
            <span className="truncate">{label}</span>
          </motion.label>
        </div>
        <textarea
          {...rest}
          ref={ref}
          id={name}
          name={name}
          value={value}
          rows={rows}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlurField?.();
          }}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            if (typeof maxLength !== 'number') return;
            const el = e.currentTarget;
            const pasted = e.clipboardData.getData('text');
            const start = el.selectionStart ?? value.length;
            const end = el.selectionEnd ?? value.length;
            const next = value.slice(0, start) + pasted + value.slice(end);
            if (next.length > maxLength) {
              e.preventDefault();
              const allowed = Math.max(0, maxLength - (value.length - (end - start)));
              onChange(value.slice(0, start) + pasted.slice(0, allowed) + value.slice(end));
              const now = Date.now();
              if (now - lastPasteToastAt > 3000) {
                lastPasteToastAt = now;
                pushToast('Se recortó el texto pegado al límite permitido.', 'warning');
              }
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'block w-full resize-none bg-transparent px-4 pb-6 pt-6 text-[15px] leading-6 text-text caret-accent outline-none placeholder:text-text-secondary',
            'disabled:cursor-not-allowed disabled:text-text-muted',
          )}
        />
        <motion.span
          aria-hidden
          variants={focusLineVariants}
          initial="rest"
          animate={focused ? 'focused' : 'rest'}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] origin-center rounded-full bg-accent"
        />
      </motion.div>
      <div className="mt-1 flex min-h-[1.25rem] items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
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
              <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-text-muted">
                {hint}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        {showCounterEffective && counterMax != null && (
          <motion.span
            initial={{ opacity: 0, y: 2 }}
            animate={counterPulse && !reduce ? { opacity: 1, y: 0, scale: [1, 1.08, 1] } : { opacity: 1, y: 0, scale: 1 }}
            className={cn('shrink-0 text-[11px] tabular-nums', counterTone)}
            aria-hidden
          >
            {currentCount}/{counterMax}
          </motion.span>
        )}
      </div>
    </div>
  );
}
