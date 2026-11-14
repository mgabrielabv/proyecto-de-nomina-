import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ShieldAlert } from 'lucide-react';
import { ROUTES } from '../../constants';
import { useSessionStore } from '../../store';
import { getRoleHomePath } from '../../utils';

export interface ForbiddenPageProps {
  /** A dónde lleva el botón principal. Por defecto, el inicio del rol. */
  fallback?: string;
}

/**
 * Acceso denegado visible. Antes, una guarda de rol redirigía en silencio y el
 * usuario no entendía por qué su ítem del menú no abría la pantalla esperada.
 */
export function ForbiddenPage({ fallback }: ForbiddenPageProps) {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const home = fallback ?? (user ? getRoleHomePath(user.role) : ROUTES.login);

  useEffect(() => {
    document.title = 'Acceso denegado — Onyx';
  }, []);

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 text-text">
      <div className="w-full max-w-lg rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
        <ShieldAlert className="mx-auto h-12 w-12 text-error" aria-hidden />
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-error">Error 403</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Acceso denegado</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          Tu perfil activo no tiene permiso para abrir esta pantalla. Cambia de perfil o vuelve a una
          sección permitida.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 items-center justify-center rounded-button border border-border bg-surface px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
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
