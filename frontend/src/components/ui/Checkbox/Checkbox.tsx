import { motion } from 'framer-motion';
import { cn } from '../../../utils';

export interface CheckboxProps {
  name: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  name,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <label
      htmlFor={name}
      className={cn(
        'group flex select-none items-start gap-2.5',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
    >
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <motion.span
        whileTap={disabled ? undefined : { scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
          checked
            ? 'border-accent bg-accent'
            : disabled
              ? 'border-border bg-surface-soft'
              : 'border-border bg-surface-soft group-hover:border-border-strong',
        )}
      >
        <motion.svg viewBox="0 0 12 12" className="h-3 w-3 text-accent-text" initial={false} animate={checked ? 'checked' : 'unchecked'}>
          <motion.path
            d="M2.5 6.5l2.2 2.2 4.8-5.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={{
              unchecked: { pathLength: 0, opacity: 0 },
              checked: { pathLength: 1, opacity: 1, transition: { duration: 0.22, delay: 0.08 } },
            }}
          />
        </motion.svg>
      </motion.span>
      <span className="min-w-0">
        <span className="block text-sm leading-6 text-text-secondary">{label}</span>
        {description && (
          <span className="block text-xs leading-relaxed text-text-muted">{description}</span>
        )}
      </span>
    </label>
  );
}
