import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../../../utils';

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  current: number;
  className?: string;
  onSelect?: (index: number) => void;
}

export function Stepper({ steps, current, className, onSelect }: StepperProps) {
  const reduce = useReducedMotion();

  return (
    <ol className={cn('flex w-full items-start gap-2', className)}>
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.label} className="flex flex-1 flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={index > current}
                onClick={() => onSelect?.(index)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors duration-200',
                  done && 'border-accent bg-accent text-accent-text',
                  active && 'border-accent bg-surface text-text',
                  !done && !active && 'border-border bg-surface-soft text-text-muted',
                  index <= current && 'cursor-pointer',
                )}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                {active && !reduce && (
                  <motion.span
                    layoutId="stepper-active"
                    className="absolute inset-0 rounded-full ring-2 ring-[var(--color-focus)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              {index < steps.length - 1 && (
                <span className="relative h-px flex-1 overflow-hidden bg-border">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ originX: 0 }}
                    className="absolute inset-0 bg-text"
                  />
                </span>
              )}
            </div>
            <div className="pr-2">
              <p className={cn('text-xs font-semibold tracking-tight', active ? 'text-text' : 'text-text-muted')}>
                {step.label}
              </p>
              {step.description && <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{step.description}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
