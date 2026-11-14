import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '../../../utils';

export interface AsyncErrorProps {
  /** Qué no se pudo cargar o completar. */
  message: string;
  /** Si se entrega, la tarjeta muestra el botón de reintento. */
  onRetry?: () => void;
  /** Mientras el reintento está en curso, el botón se deshabilita y gira. */
  retrying?: boolean;
  className?: string;
}

/**
 * Error de datos visible con reintento. Las pantallas que cargan por red no
 * pueden quedarse en blanco ni mostrar solo un toast: el toast desaparece y el
 * usuario no sabe si la pantalla está vacía o rota.
 */
export function AsyncError({ message, onRetry, retrying, className }: AsyncErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl border border-error/30 bg-error/10 p-6 text-center sm:p-8',
        className,
      )}
    >
      <AlertTriangle className="mx-auto h-8 w-8 text-error" aria-hidden />
      <p className="mt-3 text-base font-semibold text-text">No se pudieron cargar los datos</p>
      <p className="mx-auto mt-1.5 max-w-lg break-words text-sm leading-relaxed text-text-secondary">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-button border border-border bg-surface px-4 text-sm font-medium text-text transition-colors duration-200 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCw className={cn('mr-1.5 h-4 w-4', retrying && 'animate-spin')} aria-hidden />
          Reintentar
        </button>
      )}
    </div>
  );
}
