import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants';
import { ProtectedRoute, RoleRoute } from '../components/guards';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../pages/LoginPage';
import {
  UserAttendance,
  UserDashboard,
  UserPayroll,
  UserProfile,
  UserRequests,
  UserSettings,
} from '../pages/user';
import {
  AdminAttendance,
  AdminDashboard,
  AdminDepartments,
  AdminEmployees,
  AdminPayroll,
  AdminRegistration,
  AdminReports,
  AdminRequests,
} from '../pages/admin';
import { useSessionStore } from '../store';
import { getRoleHomePath } from '../utils';

function AppRoutes() {
  const user = useSessionStore((state) => state.user);

  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout title="Inicio" />}>
          <Route path={ROUTES.dashboard} element={<UserDashboard />} />
          <Route path={ROUTES.profile} element={<UserProfile />} />
          <Route path={ROUTES.payslips} element={<UserPayroll />} />
          <Route path={ROUTES.attendance} element={<UserAttendance />} />
          <Route path={ROUTES.requests} element={<UserRequests />} />
          <Route path={ROUTES.settings} element={<UserSettings />} />
        </Route>
        <Route element={<RoleRoute allow={['superuser']} fallback={ROUTES.dashboard} />}>
          <Route element={<DashboardLayout title="Panel administrativo" />}>
            <Route path={ROUTES.adminHome} element={<AdminDashboard />} />
            <Route path={ROUTES.adminEmployees} element={<AdminEmployees />} />
            <Route path={ROUTES.adminPayroll} element={<AdminPayroll />} />
            <Route path={ROUTES.adminAttendance} element={<AdminAttendance />} />
            <Route path={ROUTES.adminRequests} element={<AdminRequests />} />
            <Route path={ROUTES.adminDepartments} element={<AdminDepartments />} />
            <Route path={ROUTES.adminReports} element={<AdminReports />} />
          </Route>
        </Route>
        <Route element={<RoleRoute allow={['superuser', 'rrhh']} fallback={ROUTES.dashboard} />}>
          <Route element={<DashboardLayout title="Registrar personas" />}>
            <Route path={ROUTES.adminRegistration} element={<AdminRegistration />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <Navigate
            to={user ? getRoleHomePath(user.role) : ROUTES.login}
            replace
          />
        }
      />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
