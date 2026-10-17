import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { errorMessageVariants, menuVariants } from '../../../animations/variants';
import { cn } from '../../../utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  name: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select(props: SelectProps) {
  const { name, label, value, options, onChange, error, placeholder = 'Selecciona una opción', disabled, className } = props;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = `${name}-listbox`;
  const errorId = `${name}-select-error`;
  const labelId = `${name}-select-label`;

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;
    const index = options.findIndex((option) => option.value === value);
    setActiveIndex(index >= 0 ? index : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointer);
    return () => document.removeEventListener('mousedown', handlePointer);
  }, [open]);

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((current) => {
        const delta = event.key === 'ArrowDown' ? 1 : -1;
        return (current + delta + options.length) % options.length;
      });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) commit(activeIndex);
      else setOpen(true);
    } else if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)} ref={rootRef}>
      <motion.button
        type="button"
        id={`${name}-select`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        whileTap={{ scale: 0.995 }}
        className={cn(
          'flex h-14 w-full items-center justify-between gap-3 rounded-input border bg-surface-soft px-4 text-left transition-all duration-200',
          'focus-within:-translate-y-px focus-within:border-accent focus-within:shadow-input-focus focus-visible:outline-none',
          open && '-translate-y-px border-accent shadow-input-focus',
          error ? 'border-error' : open ? 'border-accent' : 'border-border',
          disabled && 'cursor-default opacity-60',
        )}
      >
        <span className="flex min-w-0 flex-col items-start gap-0.5">
          <span
            id={labelId}
            className={cn(
              'text-[11px] font-medium uppercase tracking-wider transition-colors duration-200',
              selected || open ? 'text-text-secondary' : 'text-text-muted',
            )}
          >
            {label}
          </span>
          <span className={cn('truncate text-[15px]', selected ? 'text-text' : 'text-text-muted')}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-text-muted">
          <ChevronDown className="h-4 w-4" aria-hidden />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            variants={menuVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-card"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(index)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150',
                      index === activeIndex ? 'bg-surface-soft text-text' : 'text-text-secondary',
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-text" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

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
            className="overflow-hidden text-xs text-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
