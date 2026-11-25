import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, Home } from 'lucide-react';
import { ROUTES } from '../../constants';
import { useSessionStore } from '../../store';
import { getRoleHomePath } from '../../utils';

/**
 * Ruta inexistente. Reemplaza el redirect silencioso del catch-all: si el
 * usuario llega a una URL que no existe, lo ve y puede volver, en vez de
 * quedar en una pantalla vacía sin explicación.
 */
export function NotFoundPage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const home = user ? getRoleHomePath(user.role) : ROUTES.login;

  useEffect(() => {
    document.title = 'Página no encontrada — Onyx';
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-text">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
        <Compass className="mx-auto h-12 w-12 text-text-muted" aria-hidden />
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-text-muted">Error 404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Esta página no existe</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          La dirección que abriste no corresponde a ninguna pantalla del sistema. Revisa el enlace o
          vuelve al inicio.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 items-center justify-center rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
            Volver atrás
          </button>
          <button
            type="button"
            onClick={() => navigate(home, { replace: true })}
            className="inline-flex h-11 items-center justify-center rounded-button border border-transparent bg-accent px-5 text-sm font-medium text-accent-text transition-colors duration-200 hover:bg-accent-hover"
          >
            <Home className="mr-1.5 h-4 w-4" aria-hidden />
            Ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
