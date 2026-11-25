import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useSessionStore } from '../../../store';
import { ForbiddenPage } from '../../../pages/system';
import type { UserRole } from '../../../types';

export interface RoleRouteProps {
  allow: UserRole[];
  fallback?: string;
}

export function RoleRoute({ allow, fallback = ROUTES.dashboard }: RoleRouteProps) {
  const user = useSessionStore((state) => state.user);

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // Un perfil sin permiso ve una pantalla 403 explícita. Antes se redirigía en
  // silencio y el usuario no entendía por qué el ítem del menú no abría la
  // pantalla; ahora hay un mensaje y un botón de salida.
  if (!allow.includes(user.role)) {
    return <ForbiddenPage fallback={fallback} />;
  }

  return <Outlet />;
}
