import { execute } from '../../auth/services/apiClient';
import {
  MOCK_LATENCY_MAX,
  MOCK_LATENCY_MIN,
  MUTATION_LATENCY_MAX,
  MUTATION_LATENCY_MIN,
} from '../../../constants';
import { buildPeriods, buildReceipts, delay, randomLatency } from '../../../mocks';
import type { Employee, PayrollPeriod, PayrollPeriodType, PayrollReceipt, PayrollStatus } from '../../../types';

const statusOverrides = new Map<string, PayrollStatus>();

export async function fetchPeriods(type: PayrollPeriodType): Promise<PayrollPeriod[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return buildPeriods(type).map((period) => ({ ...period }));
}

export async function fetchReceipts(period: PayrollPeriod, employees: Employee[]): Promise<PayrollReceipt[]> {
  await delay(randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX));
  return buildReceipts(period, employees).map((receipt) => ({
    ...receipt,
    status: statusOverrides.get(receipt.id) ?? receipt.status,
  }));
}

export async function setReceiptsStatus(ids: string[], status: PayrollStatus): Promise<void> {
  await delay(randomLatency(MUTATION_LATENCY_MIN, MUTATION_LATENCY_MAX));
  ids.forEach((id) => statusOverrides.set(id, status));
}

/* ==============================================================================
 * TIPOS DE DATOS DEL SUBSISTEMA PAYROLL & SECURITY
 * ============================================================================== */


export interface MenuOption {
  id: number;
  nombre: string;
  descripcion: string;
  subsistema: string;
}

export interface PersonaItem {
  id: string; // UUID
  cedula: string;
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  email?: string | null;
  usuario_id?: string | null; // UUID del usuario asociado (o null si no tiene)
  username?: string | null;
  usuario_activo?: boolean | null;
  cargo?: string | null;
  contrato_id?: string | null;
  tipo_pago?: string | null;
  frecuencia_pago?: string | null;
  contrato_estado?: string | null;
  monto_salario?: string | null;
}

export interface PerfilItem {
  id: number;
  nombre: string;
  descripcion: string;
}

// 1. Cargo
export interface CargoTarifa {
  id: number;
  nombre: string;
  descripcion?: string | null;
  valor_hora_base: string; // Decimal string
  activo: boolean;
}

// 2. Hours
export interface RegistroHoras {
  id: string; // UUID
  persona_id: string;
  fecha: string;
  horas_normales: string | number;
  horas_extra: string | number;
  observacion?: string | null;
  created_at: string;
}

export interface RegistroHorasPeriodo extends RegistroHoras {
  cedula: string;
  primer_nombre: string;
  primer_apellido: string;
}

// 3. Affiliation
export interface Afiliacion {
  id: string; // UUID
  persona_id: string;
  tipo_aporte_id: number;
  nro_afiliacion: string;
  fecha_inscripcion: string;
  fecha_baja?: string | null;
  estado: 'ACTIVO' | 'BAJA';
  codigo?: string;
  nombre?: string;
  entidad?: string;
}

// 4. Concept
export interface ConceptoCatalogo {
  id: number;
  codigo: string;
  nombre_concepto: string;
  tipo_concepto: 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL';
  categoria: string;
  unidad: string;
  afecta_base_ley: boolean;
  activo: boolean;
}

export interface ConceptoRecurrente {
  id: string; // UUID
  persona_id: string;
  concepto_id: number;
  tipo_valor: 'MONTO_FIJO' | 'PORCENTAJE_SALARIO';
  valor: string; // Decimal string
  vigente_desde: string;
  vigente_hasta?: string | null;
  observacion?: string | null;
}

export interface ConceptoRecurrenteDetalle extends ConceptoRecurrente {
  codigo: string;
  nombre_concepto: string;
  tipo_concepto: 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL';
  categoria: string;
  unidad: string;
  afecta_base_ley: boolean;
}

// 5. Novedad
export interface Novedad {
  id: string; // UUID
  persona_id: string;
  concepto_id: number;
  periodo_nomina_id: string;
  fecha: string;
  cantidad?: string | number | null;
  monto?: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'APLICADA';
  observacion?: string | null;
  created_at: string;
}

export interface NovedadDetalle extends Novedad {
  cedula: string;
  primer_nombre: string;
  primer_apellido: string;
  codigo: string;
  nombre_concepto: string;
  tipo_concepto: 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL';
  categoria: string;
  unidad: string;
}

// 6. Loan
export interface PrestamoItem {
  id: string; // UUID
  persona_id: string;
  fecha_otorgamiento: string;
  monto_total: string;
  nro_cuotas: number;
  cuota_periodica: string;
  tasa_interes: string;
  estado: 'SOLICITADO' | 'ACTIVO' | 'PAGADO' | 'ANULADO';
  created_at: string;
}

export interface CuotaPrestamo {
  id: string;
  nroCuota: number;
  montoCapital: string;
  montoInteres: string;
  montoCuota: string;
  fechaVencimiento: string;
}

export interface LoanCreateResult {
  prestamo: PrestamoItem;
  cuotas: CuotaPrestamo[];
}

export interface LoanSaldoResult {
  prestamoId: string;
  cuotasPendientes: number;
  saldoPendiente: string;
}

// 7. Period
export interface PeriodoNomina {
  id: string; // UUID
  fecha_inicio: string;
  fecha_fin: string;
  frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  estado: 'BORRADOR' | 'PROCESADO' | 'PAGADO';
  descripcion?: string | null;
  procesado_por?: number | null;
  fecha_proceso?: string | null;
  created_at: string;
  preNominaId?: string | null;
  preNominaVersion?: number | null;
}

export interface ReciboResumen {
  id: string;
  persona_id: string;
  periodo_nomina_id: string;
  total_asignaciones: string;
  total_deducciones: string;
  monto_total: string;
  estado: string;
}

export interface ReciboItem {
  id: string; // UUID
  persona_id: string;
  periodo_nomina_id: string;
  contrato_id?: string;
  fecha_emision: string;
  total_asignaciones: string;
  total_deducciones: string;
  monto_total: string;
  estado: 'BORRADOR' | 'PROCESADO' | 'PAGADO' | 'ANULADO';
  fecha_pago?: string | null;
  metodo_pago?: string | null;
  referencia_pago?: string | null;
  cedula?: string;
  primer_nombre?: string;
  primer_apellido?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  frecuencia?: string;
}

// 8. Receipt
export interface ReciboDetalle extends ReciboItem {
  cuenta_bancaria_id?: string | null;
  pagado_por?: number | null;
}

export interface LineaReciboDetalle {
  id: string;
  recibo_pago_id: string;
  concepto_id?: number;
  cuota_prestamo_id?: string | null;
  novedad_id?: string | null;
  concepto_persona_id?: string | null;
  parametro_aporte_id?: number | null;
  base_calculo: string;
  tasa_aplicada: string;
  cantidad_unidades: string;
  monto: string;
  codigo: string;
  nombre_concepto: string;
  tipo_concepto: 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL';
  categoria: string;
  unidad: string;
}

/* ==============================================================================
 * TIPOS DE PRE-NÓMINA (Payroll/PreNomina)
 * Los montos viajan y se pintan como string: nunca number de coma flotante.
 * ============================================================================== */

export type TipoConcepto = 'ASIGNACION' | 'DEDUCCION' | 'APORTE_PATRONAL';
export type OrigenLinea =
  | 'CALCULADA' | 'RECURRENTE' | 'NOVEDAD' | 'PRESTAMO' | 'LEY' | 'MANUAL';

export interface PreNominaLinea {
  id: string;
  conceptoId: number;
  codigo: string;
  nombreConcepto: string;
  tipoConcepto: TipoConcepto;
  categoria: string;
  unidad: string;
  origen: OrigenLinea;
  editable: boolean;
  editada: boolean;
  cuotaPrestamoId: string | null;
  novedadId: string | null;
  conceptoPersonaId: number | null;
  parametroAporteId: number | null;
  baseCalculo: string | null;
  tasaAplicada: string | null;
  cantidadUnidades: string | null;
  monto: string;
}

export interface PreNominaRecibo {
  id: string;
  personaId: string;
  cedula: string;
  nombre: string;
  contratoId: string;
  totalAsignaciones: string;
  totalDeducciones: string;
  montoTotal: string;
  lineas: PreNominaLinea[];
}

export interface PreNominaDetalle {
  preNomina: {
    id: string;
    periodoId: string;
    periodo: {
      fechaInicio: string;
      fechaFin: string;
      frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
      descripcion: string | null;
    };
    version: number;
    generadoPor: string | null;
    fechaGeneracion: string;
    actualizadoPor: string | null;
    fechaActualizacion: string | null;
    recibos: number;
    totalAsignaciones: string;
    totalDeducciones: string;
    totalAportePatronal: string;
    montoTotal: string;
  };
  recibos: PreNominaRecibo[];
}

/* ==============================================================================
 * SERVICIOS DEL SUBSISTEMA PAYROLL
 * ============================================================================== */

export const CargoService = {
  listarCargosTarifa: () =>
    execute<CargoTarifa[]>('Payroll', 'Cargo', 'listarCargosTarifa', []),

  actualizarValorHora: (cargoId: number, valorHora: number | string) =>
    execute<CargoTarifa>('Payroll', 'Cargo', 'actualizarValorHora', [cargoId, valorHora]),
};

export const HoursService = {
  registrar: (
    personaId: string,
    fecha: string,
    horasNormales: number,
    horasExtra = 0,
    observacion: string | null = null,
  ) =>
    execute<RegistroHoras>('Payroll', 'Hours', 'registrar', [
      personaId,
      fecha,
      horasNormales,
      horasExtra,
      observacion,
    ]),

  listarPorPersona: (personaId: string, fechaInicio: string, fechaFin: string) =>
    execute<RegistroHoras[]>('Payroll', 'Hours', 'listarPorPersona', [
      personaId,
      fechaInicio,
      fechaFin,
    ]),

  listarPorPeriodo: (periodoId: string) =>
    execute<RegistroHorasPeriodo[]>('Payroll', 'Hours', 'listarPorPeriodo', [periodoId]),

  misHoras: (fechaInicio?: string, fechaFin?: string) => {
    const params = fechaInicio
      ? fechaFin
        ? [fechaInicio, fechaFin]
        : [fechaInicio]
      : [];
    return execute<RegistroHoras[]>('Payroll', 'Hours', 'misHoras', params);
  },

  eliminar: (id: string) =>
    execute<{ ok: boolean; id: string }>('Payroll', 'Hours', 'eliminar', [id]),

  registrarExtra: (
    personaId: string,
    fecha: string,
    horasExtra: number,
    observacion: string | null = null,
  ) =>
    execute<RegistroHoras>('Payroll', 'Hours', 'registrarExtra', [
      personaId,
      fecha,
      horasExtra,
      observacion,
    ]),

  listarExtrasPorPeriodo: (periodoId: string) =>
    execute<RegistroHorasPeriodo[]>('Payroll', 'Hours', 'listarExtrasPorPeriodo', [periodoId]),

  quitarExtra: (id: string) =>
    execute<{ ok: boolean; id: string; eliminado: boolean }>('Payroll', 'Hours', 'quitarExtra', [id]),
};

export const AffiliationService = {
  registrar: (
    personaId: string,
    tipoAporteId: number,
    nroAfiliacion: string,
    fechaInscripcion: string,
  ) =>
    execute<Afiliacion>('Payroll', 'Affiliation', 'registrar', [
      personaId,
      tipoAporteId,
      nroAfiliacion,
      fechaInscripcion,
    ]),

  listar: (personaId: string) =>
    execute<Afiliacion[]>('Payroll', 'Affiliation', 'listar', [personaId]),

  darDeBaja: (afiliacionId: string, fechaBaja: string) =>
    execute<Afiliacion>('Payroll', 'Affiliation', 'darDeBaja', [afiliacionId, fechaBaja]),
};

export const ConceptService = {
  listar: () =>
    execute<ConceptoCatalogo[]>('Payroll', 'Concept', 'listar', []),

  asignarRecurrente: (
    personaId: string,
    conceptoId: number,
    valor: string | number,
    vigenteDesde: string,
    tipoValor: 'MONTO_FIJO' | 'PORCENTAJE_SALARIO' = 'MONTO_FIJO',
    vigenteHasta: string | null = null,
    observacion: string | null = null,
  ) =>
    execute<ConceptoRecurrente>('Payroll', 'Concept', 'asignarRecurrente', [
      personaId,
      conceptoId,
      valor,
      vigenteDesde,
      tipoValor,
      vigenteHasta,
      observacion,
    ]),

  quitarRecurrente: (id: string, fechaHasta: string) =>
    execute<{ id: string }>('Payroll', 'Concept', 'quitarRecurrente', [id, fechaHasta]),

  listarRecurrentes: (personaId: string) =>
    execute<ConceptoRecurrenteDetalle[]>('Payroll', 'Concept', 'listarRecurrentes', [personaId]),
};

export const NovedadService = {
  registrar: (
    personaId: string,
    conceptoId: number,
    periodoId: string,
    fecha: string,
    cantidad: number | string | null = null,
    monto: number | string | null = null,
    observacion: string | null = null,
  ) =>
    execute<Novedad>('Payroll', 'Novedad', 'registrar', [
      personaId,
      conceptoId,
      periodoId,
      fecha,
      cantidad,
      monto,
      observacion,
    ]),

  aprobar: (id: string) =>
    execute<{ id: string; estado: 'APROBADA' }>('Payroll', 'Novedad', 'aprobar', [id]),

  rechazar: (id: string) =>
    execute<{ id: string; estado: 'RECHAZADA' }>('Payroll', 'Novedad', 'rechazar', [id]),

  listarPorPeriodo: (periodoId: string) =>
    execute<NovedadDetalle[]>('Payroll', 'Novedad', 'listarPorPeriodo', [periodoId]),
};

export const LoanService = {
  crear: (
    personaId: string,
    fechaOtorgamiento: string,
    montoTotal: number | string,
    nroCuotas: number,
    tasaInteres = 0,
  ) =>
    execute<LoanCreateResult>('Payroll', 'Loan', 'crear', [
      personaId,
      fechaOtorgamiento,
      montoTotal,
      nroCuotas,
      tasaInteres,
    ]),

  listar: (personaId: string) =>
    execute<PrestamoItem[]>('Payroll', 'Loan', 'listar', [personaId]),

  saldos: (prestamoId: string) =>
    execute<LoanSaldoResult>('Payroll', 'Loan', 'saldos', [prestamoId]),

  anular: (prestamoId: string) =>
    execute<{ id: string; estado: 'ANULADO' }>('Payroll', 'Loan', 'anular', [prestamoId]),

  misPrestamos: () =>
    execute<PrestamoItem[]>('Payroll', 'Loan', 'misPrestamos', []),
};

export const PeriodService = {
  crear: (
    frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
    fechaInicio: string,
    fechaFin: string,
    descripcion: string | null = null,
  ) =>
    execute<PeriodoNomina>('Payroll', 'Period', 'crear', [
      frecuencia,
      fechaInicio,
      fechaFin,
      descripcion,
    ]),

  procesar: (periodoId: string) =>
    execute<{ periodo: PeriodoNomina; recibos: ReciboResumen[] }>(
      'Payroll',
      'Period',
      'procesar',
      [periodoId],
    ),

  pagar: (
    periodoId: string,
    fechaPago: string,
    metodoPago: 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'EFECTIVO' | 'CHEQUE',
    referenciaPago: string | null = null,
    cuentaBancariaId: string | null = null,
  ) =>
    execute<{ periodo: PeriodoNomina; recibosPagados: number }>(
      'Payroll',
      'Period',
      'pagar',
      [periodoId, fechaPago, metodoPago, referenciaPago, cuentaBancariaId],
    ),

  anular: (periodoId: string) =>
    execute<{ periodoId: string; estado: 'BORRADOR'; recibosEliminados: number }>(
      'Payroll',
      'Period',
      'anular',
      [periodoId],
    ),

  listar: () =>
    execute<PeriodoNomina[]>('Payroll', 'Period', 'listar', []),

  ver: (periodoId: string) =>
    execute<{
      periodo: PeriodoNomina;
      recibos: ReciboItem[];
      preNomina: { id: string; version: number } | null;
    }>(
      'Payroll',
      'Period',
      'ver',
      [periodoId],
    ),
};

export const PreNominaService = {
  generar: (periodoId: string) =>
    execute<PreNominaDetalle>('Payroll', 'PreNomina', 'generar', [periodoId]),

  ver: (preNominaId: string) =>
    execute<PreNominaDetalle>('Payroll', 'PreNomina', 'ver', [preNominaId]),

  guardar: (
    preNominaId: string,
    version: number,
    body: {
      recibos: {
        reciboId: string;
        lineas: {
          id: string | null;
          conceptoId?: number;
          monto: string;
          cantidadUnidades: string | null;
        }[];
      }[];
    },
  ) =>
    execute<PreNominaDetalle>('Payroll', 'PreNomina', 'guardar', [
      preNominaId,
      version,
      body,
    ]),

  eliminar: (preNominaId: string) =>
    execute<{ eliminada: true; preNominaId: string; periodoId: string }>(
      'Payroll',
      'PreNomina',
      'eliminar',
      [preNominaId],
    ),

  confirmar: (preNominaId: string, version: number) =>
    execute<{
      periodo: { id: string; estado: 'PROCESADO' };
      recibos: { id: string; personaId: string; montoTotal: string }[];
      novedadesAplicadas: number;
      cuotasDescontadas: number;
      prestamosPagados: number;
      preNominaEliminada: true;
    }>('Payroll', 'PreNomina', 'confirmar', [preNominaId, version]),
};

export const ReceiptService = {
  ver: (reciboId: string) =>
    execute<{ recibo: ReciboDetalle; detalle: LineaReciboDetalle[] }>(
      'Payroll',
      'Receipt',
      'ver',
      [reciboId],
    ),

  listarPorPeriodo: (periodoId: string) =>
    execute<ReciboItem[]>('Payroll', 'Receipt', 'listarPorPeriodo', [periodoId]),

  misRecibos: () =>
    execute<ReciboItem[]>('Payroll', 'Receipt', 'misRecibos', []),

  miDesglose: (reciboId: string) =>
    execute<{ recibo: ReciboDetalle; detalle: LineaReciboDetalle[] }>(
      'Payroll',
      'Receipt',
      'miDesglose',
      [reciboId],
    ),
};

/* ==============================================================================
 * SERVICIOS AUXILIARES DE SECURITY
 * ============================================================================== */

export const SecurityService = {
  getMenuOptions: (perfilId?: number) =>
    execute<MenuOption[]>(
      'Security',
      'Menu',
      'getOptions',
      perfilId === undefined ? [] : [perfilId],
    ),

  listarPersonas: () =>
    execute<PersonaItem[]>('Security', 'User', 'listarPersonas', []),

  listarPerfiles: () =>
    execute<PerfilItem[]>('Security', 'User', 'listarPerfiles', []),
};
