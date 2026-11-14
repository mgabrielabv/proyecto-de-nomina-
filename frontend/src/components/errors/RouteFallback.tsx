import { Skeleton } from '../ui/Skeleton';

/**
 * Fallback visible para Suspense: nunca `null`. Si en el futuro una pantalla
 * se carga con `lazy()`, el usuario ve la estructura de la página mientras
 * llega el chunk en vez de un área vacía.
 */
export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Cargando pantalla</span>
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
