import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from '../constants';
import { ProtectedRoute, RoleRoute } from '../components/guards';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LoginPage } from '../pages/LoginPage';
import {
  UserAttendance,
  UserDashboard,
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
  PermissionsPage,
} from '../pages/admin';

import {
  PeriodsPage,
  HoursPage,
  NovedadesPage,
  LoansPage,
  ConceptsPage,
  CargosPage,
  AffiliationsPage,
  MyReceiptsPage,
} from '../pages/payroll';
import { useSessionStore } from '../store';
import { getRoleHomePath } from '../utils';

function AppRoutes() {
  const user = useSessionStore((state) => state.user);

  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        {/* Rutas compartidas / personales (accesibles para Empleado y demás roles) */}
        <Route element={<DashboardLayout title="Mi Espacio" />}>
          <Route path={ROUTES.dashboard} element={<UserDashboard />} />
          <Route path={ROUTES.profile} element={<UserProfile />} />
          <Route path={ROUTES.payslips} element={<MyReceiptsPage />} />
          <Route path={ROUTES.payrollMisRecibos} element={<MyReceiptsPage />} />
          <Route path={ROUTES.attendance} element={<UserAttendance />} />
          <Route path={ROUTES.requests} element={<UserRequests />} />
          <Route path={ROUTES.settings} element={<UserSettings />} />
        </Route>

        {/* Subsistema Payroll (Superusuario, Administrador, RRHH) */}
        <Route element={<RoleRoute allow={['superuser', 'rrhh']} fallback={ROUTES.payrollMisRecibos} />}>
          <Route element={<DashboardLayout title="Nómina" />}>
            <Route path={ROUTES.payrollPeriodos} element={<PeriodsPage />} />
            <Route path={ROUTES.payrollHoras} element={<HoursPage />} />
            <Route path={ROUTES.payrollNovedades} element={<NovedadesPage />} />
            <Route path={ROUTES.payrollPrestamos} element={<LoansPage />} />
            <Route path={ROUTES.payrollConceptos} element={<ConceptsPage />} />
            <Route path={ROUTES.payrollCargos} element={<CargosPage />} />
            <Route path={ROUTES.payrollAfiliaciones} element={<AffiliationsPage />} />
          </Route>
        </Route>

        {/* Panel administrativo de gestión de personas y sistema */}
        <Route element={<RoleRoute allow={['superuser']} fallback={ROUTES.payrollMisRecibos} />}>
          <Route element={<DashboardLayout title="Panel administrativo" />}>
            <Route path={ROUTES.adminHome} element={<AdminDashboard />} />
            <Route path={ROUTES.adminPermissions} element={<PermissionsPage />} />
            <Route path={ROUTES.adminEmployees} element={<AdminEmployees />} />
            <Route path={ROUTES.adminPayroll} element={<AdminPayroll />} />
            <Route path={ROUTES.adminAttendance} element={<AdminAttendance />} />
            <Route path={ROUTES.adminRequests} element={<AdminRequests />} />
            <Route path={ROUTES.adminDepartments} element={<AdminDepartments />} />
            <Route path={ROUTES.adminReports} element={<AdminReports />} />
          </Route>
        </Route>


        <Route element={<RoleRoute allow={['superuser', 'rrhh']} fallback={ROUTES.payrollMisRecibos} />}>
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
