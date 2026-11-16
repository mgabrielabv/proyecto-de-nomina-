import { Search } from 'lucide-react';
import { LIMITS } from '../../../constants';
import { cn } from '../../../utils';

export interface SearchInputProps {
  /** Identificador del campo; también se usa como `name`. */
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Texto descriptivo que se ve dentro del campo vacío. */
  placeholder: string;
  /** Nombre accesible del buscador; por defecto usa el placeholder. */
  ariaLabel?: string;
  /** `sm` para filtros de tablas (44px) y `md` para filas de formulario (56px). */
  size?: 'sm' | 'md';
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  maxLength?: number;
}

/**
 * Buscador del sistema: sin etiqueta visible, con `aria-label` y placeholder
 * descriptivo. La lupa nunca recibe el puntero y el texto reserva el espacio
 * del icono con `padding-left`, así no se monta encima.
 */
export function SearchInput({
  name,
  value,
  onChange,
  placeholder,
  ariaLabel,
  size = 'sm',
  disabled,
  autoFocus,
  className,
  maxLength = LIMITS.searchQuery.max,
}: SearchInputProps) {
  const isLarge = size === 'md';

  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted',
          isLarge ? 'left-4' : 'left-3.5',
        )}
        aria-hidden
      />
      <input
        id={name}
        name={name}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        className={cn(
          'w-full truncate border border-border bg-surface-soft pr-4 text-text outline-none transition-colors duration-200 placeholder:text-text-secondary placeholder:text-ellipsis focus:border-accent disabled:cursor-not-allowed disabled:opacity-60',
          isLarge
            ? 'h-14 rounded-input pl-11 text-[15px]'
            : 'h-11 rounded-button pl-10 text-sm',
        )}
      />
    </div>
  );
}
