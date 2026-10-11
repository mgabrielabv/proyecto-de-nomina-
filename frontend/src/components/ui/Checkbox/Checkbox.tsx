import { motion } from 'framer-motion';
import { cn } from '../../../utils';

export interface CheckboxProps {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Checkbox({ name, label, checked, onChange, className }: CheckboxProps) {
  return (
    <label htmlFor={name} className={cn('group flex cursor-pointer select-none items-center gap-2.5', className)}>
      <input
        id={name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <motion.span
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-150',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
          checked ? 'border-accent bg-accent' : 'border-border bg-surface-soft group-hover:border-border-strong',
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
      <span className="text-sm text-text-secondary">{label}</span>
    </label>
  );
}