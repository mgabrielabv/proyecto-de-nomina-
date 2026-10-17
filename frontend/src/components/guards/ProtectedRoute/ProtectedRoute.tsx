import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useSessionStore } from '../../../store';

export function ProtectedRoute() {
  const user = useSessionStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
