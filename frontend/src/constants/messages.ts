export const FORM_MESSAGES = {
  required: 'Este campo es obligatorio.',
  invalidEmail: 'El formato del correo no es válido.',
  shortPassword: 'La contraseña debe tener al menos 8 caracteres.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  endBeforeStart: 'La fecha final debe ser posterior a la inicial.',
  reasonTooShort: 'Describe el motivo con al menos 10 caracteres.',
  salaryInvalid: 'Introduce un salario base válido.',
} as const;

export const TOAST_MESSAGES = {
  profileSaved: 'Perfil actualizado correctamente.',
  requestCreated: 'Solicitud enviada.',
  requestApproved: 'Solicitud aprobada.',
  requestRejected: 'Solicitud rechazada.',
  employeeCreated: 'Persona registrada correctamente.',
  employeeUpdated: 'Empleado actualizado.',
  employeeToggled: 'Estado del empleado actualizado.',
  employeeRemoved: 'Empleado eliminado.',
  payrollGenerated: 'Nómina generada.',
  payrollApproved: 'Nómina aprobada.',
  payrollPaid: 'Nómina pagada.',
  departmentCreated: 'Departamento creado.',
  departmentUpdated: 'Departamento actualizado.',
  positionCreated: 'Cargo creado.',
  positionUpdated: 'Cargo actualizado.',
  reportExported: 'Reporte exportado.',
  passwordChanged: 'Contraseña actualizada.',
  settingsSaved: 'Preferencias guardadas.',
  clockIn: 'Entrada registrada.',
  clockOut: 'Salida registrada.',
  searchEmpty: 'Sin resultados para esa búsqueda.',
  confirmSent: 'Confirmación enviada.',
} as const;

export const CONFIRM_MESSAGES = {
  deleteEmployee: 'Esta acción elimina de forma permanente al empleado y sus datos.',
  rejectRequest: 'La solicitud quedará marcada como rechazada.',
} as const;

export const EMPTY_MESSAGES = {
  employees: 'No hay empleados que coincidan con los filtros.',
  requests: 'No hay solicitudes en esta bandeja.',
  receipts: 'No tienes recibos en este periodo.',
  notifications: 'No tienes notificaciones pendientes.',
  announcements: 'No hay anuncios recientes.',
  attendance: 'Sin registros para este mes.',
} as const;
