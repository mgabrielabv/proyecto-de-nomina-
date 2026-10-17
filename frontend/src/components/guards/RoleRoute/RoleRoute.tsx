import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useSessionStore } from '../../../store';
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

  if (!allow.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
