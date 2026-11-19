import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Play,
  CreditCard,
  RotateCcw,
  Eye,
  ArrowRight,
  Download,
} from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useNavigate } from 'react-router-dom';
import { useToastStore } from '../../store';
import {
  PeriodService,
  ReceiptService,
  type PeriodoNomina,
  type PeriodoConTotales,
  type ResumenNomina,
  type ReciboItem,
  type ReciboResumen,
} from '../../features/payroll/services';
import {
  aCentavos,
  deCentavos,
  formatMoney,
  formatFechaLocal,
  formatDateTime,
  toISODate,
  descargarPdfBase64,
} from '../../utils';
import {
  FRECUENCIA_LABEL,
  PERIODO_ESTADO_LABEL,
  PERIODO_ESTADO_TONE,
  RECIBO_ESTADO_LABEL,
  RECIBO_ESTADO_TONE,
  ROUTES,
  type PeriodoEstado,
  type ReciboEstado,
} from '../../constants';

// Los DECIMAL del backend llegan como texto: sumar en céntimos con enteros y
// dividir solo al mostrar. Nunca `+= Number(...)` sobre strings de dinero.

// Etiqueta visible del tipo de concepto; el orden lo decide el backend.
const TIPO_CONCEPTO_LABEL: Record<string, string> = {
  ASIGNACION: 'Asignación',
  DEDUCCION: 'Deducción',
  APORTE_PATRONAL: 'Aporte patronal',
};


export function PeriodsPage() {
  const [periods, setPeriods] = useState<PeriodoConTotales[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const navigate = useNavigate();
  const [procesar409, setProcesar409] = useState<{
    preNominaId: string;
    periodoId: string;
  } | null>(null);

  // Modal Crear Periodo
  const [createOpen, setCreateOpen] = useState(false);
  const [frecuencia, setFrecuencia] = useState<'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('QUINCENAL');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Ver Detalle de Periodo
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodoNomina | null>(null);
  const [periodReceipts, setPeriodReceipts] = useState<ReciboItem[]>([]);
  const [resumen, setResumen] = useState<ResumenNomina | null>(null);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  // Modal Pagar Periodo
  const [payOpen, setPayOpen] = useState(false);
  const [fechaPago, setFechaPago] = useState(toISODate(new Date()));
  const [metodoPago, setMetodoPago] = useState<'TRANSFERENCIA' | 'PAGO_MOVIL' | 'EFECTIVO' | 'CHEQUE'>('TRANSFERENCIA');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  // Modal Anular Periodo
  const [anularOpen, setAnularOpen] = useState(false);

  // Modal Resumen tras Procesar
  const [processSummary, setProcessSummary] = useState<{
    recibosCount: number;
    totalAsignaciones: number;
    totalDeducciones: number;
    montoTotal: number;
  } | null>(null);

  const pushToast = useToastStore((s) => s.push);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const data = await PeriodService.listarConTotales();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar periodos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPeriods();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!fechaInicio || !fechaFin) {
      setCreateError('Las fechas de inicio y fin son obligatorias');
      return;
    }
    setActionBusy(true);
    try {
      await PeriodService.crear(frecuencia, fechaInicio, fechaFin, descripcion || null);
      pushToast('Periodo creado exitosamente', 'success');
      setCreateOpen(false);
      setFechaInicio('');
      setFechaFin('');
      setDescripcion('');
      await loadPeriods();
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al crear periodo');
    } finally {
      setActionBusy(false);
    }
  };

  const handleVerDetalle = async (periodo: PeriodoNomina) => {
    setSelectedPeriod(periodo);
    setDetailOpen(true);
    setDetailLoading(true);
    setResumenLoading(true);
    setResumen(null);
    try {
      const [res, resumenData] = await Promise.all([
        PeriodService.ver(periodo.id),
        PeriodService.resumen(periodo.id),
      ]);
      setSelectedPeriod(res.periodo ?? periodo);
      setPeriodReceipts(res.recibos ?? []);
      setResumen(resumenData ?? null);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar detalle del periodo', 'error');
    } finally {
      setDetailLoading(false);
      setResumenLoading(false);
    }
  };

  const handleDescargarPdf = async (recibo: ReciboItem) => {
    setPdfBusyId(recibo.id);
    try {
      const pdf = await ReceiptService.generarPdf(recibo.id);
      descargarPdfBase64(pdf);
      pushToast('Recibo descargado', 'success');
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudo descargar el recibo', 'error');
    } finally {
      setPdfBusyId(null);
    }
  };

  const handleProcesar = async () => {
    if (!selectedPeriod) return;
    setActionBusy(true);
    try {
      const res = await PeriodService.procesar(selectedPeriod.id);
      pushToast('Nómina procesada exitosamente', 'success');

      // Calcular resumen. El dinero llega como texto decimal: se suma en
      // céntimos con enteros y se divide solo para mostrar.
      const recibos: ReciboResumen[] = res.recibos ?? [];
      let centAsig = 0;
      let centDed = 0;
      let centNet = 0;
      recibos.forEach((r: ReciboResumen) => {
        centAsig += aCentavos(r.total_asignaciones);
        centDed += aCentavos(r.total_deducciones);
        centNet += aCentavos(r.monto_total);
      });

      setProcessSummary({
        recibosCount: recibos.length,
        totalAsignaciones: deCentavos(centAsig),
        totalDeducciones: deCentavos(centDed),
        montoTotal: deCentavos(centNet),
      });

      await loadPeriods();
      // Refrescar detalle
      await handleVerDetalle({ ...selectedPeriod, estado: 'PROCESADO' });
    } catch (err: any) {
      const msg = err?.message ?? 'Error al procesar periodo';
      if (err.status === 409 && msg.includes('pre-nómina sin confirmar')) {
        setProcesar409({ preNominaId: selectedPeriod!.preNominaId!, periodoId: selectedPeriod.id });
      } else {
        pushToast(msg, 'error');
      }
    } finally {
      setActionBusy(false);
    }
  };

  const handlePagar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriod) return;
    setPayError(null);
    setActionBusy(true);
    try {
      const res = await PeriodService.pagar(
        selectedPeriod.id,
        fechaPago,
        metodoPago,
        referenciaPago || null,
        // Sin catálogo de cuentas bancarias todavía: null hace que el backend
        // use la cuenta principal activa. Ver Anexo D del prompt.
        null,
      );
      pushToast(`Periodo pagado con éxito (${res.recibosPagados} recibos actualizados)`, 'success');
      setPayOpen(false);
      await loadPeriods();
      await handleVerDetalle({ ...selectedPeriod, estado: 'PAGADO' });
    } catch (err: any) {
      setPayError(err?.message ?? 'Error al registrar pago');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAnular = async () => {
    if (!selectedPeriod) return;
    setActionBusy(true);
    try {
      const res = await PeriodService.anular(selectedPeriod.id);
      pushToast(`Periodo anulado. ${res.recibosEliminados} recibos eliminados.`, 'success');
      setAnularOpen(false);
      await loadPeriods();
      await handleVerDetalle({ ...selectedPeriod, estado: 'BORRADOR' });
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al anular periodo', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<PeriodoConTotales>[] = [
    {
      key: 'frecuencia',
      header: 'Frecuencia',
      render: (row) => (
        <span className="font-semibold text-text">
          {FRECUENCIA_LABEL[row.frecuencia] ?? row.frecuencia}
        </span>
      ),
      sortValue: (row) => row.frecuencia,
    },
    {
      key: 'fechas',
      header: 'Rango de fechas',
      render: (row) => (
        <span className="tabular-nums text-text">
          {formatFechaLocal(row.fecha_inicio)} — {formatFechaLocal(row.fecha_fin)}
        </span>
      ),
      sortValue: (row) => row.fecha_inicio,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (row) => (
        <span className="text-text-secondary">{row.descripcion || '—'}</span>
      ),
    },
    {
      key: 'personas',
      header: 'Personas',
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <span className="num text-text-secondary">{row.personas}</span>
      ),
      sortValue: (row) => row.personas,
    },
    {
      key: 'total_asignaciones',
      header: 'Asignaciones',
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <span className="num text-success">+{formatMoney(row.total_asignaciones)}</span>
      ),
      sortValue: (row) => aCentavos(row.total_asignaciones),
    },
    {
      key: 'total_deducciones',
      header: 'Deducciones',
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <span className="num text-error">−{formatMoney(row.total_deducciones)}</span>
      ),
      sortValue: (row) => aCentavos(row.total_deducciones),
    },
    {
      key: 'total_neto',
      header: 'Neto',
      align: 'right',
      render: (row) => (
        <span className="num font-semibold text-text">{formatMoney(row.total_neto)}</span>
      ),
      sortValue: (row) => aCentavos(row.total_neto),
    },
    {
      key: 'costo_total',
      header: 'Costo total',
      align: 'right',
      hideOnMobile: true,
      render: (row) => (
        <span className="num text-text-secondary">{formatMoney(row.costo_total)}</span>
      ),
      sortValue: (row) => aCentavos(row.costo_total),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => {
        const estado = row.estado as PeriodoEstado;
        return (
          <Badge
            tone={PERIODO_ESTADO_TONE[estado] ?? 'neutral'}
            statusIcon={estado === 'PAGADO' ? 'paid' : estado === 'PROCESADO' ? 'processed' : 'none'}
          >
            {PERIODO_ESTADO_LABEL[estado] ?? row.estado}
          </Badge>
        );
      },
      sortValue: (row) => row.estado,
    },
    {
      key: 'fecha_proceso',
      header: 'Procesado',
      render: (row) => {
        if (!row.fecha_proceso) {
          return (
            <span className="text-sm text-text-muted" aria-label="Sin procesar">
              —
            </span>
          );
        }
        const full = formatDateTime(row.fecha_proceso);
        const [datePart, timePart] = full.split(',').map((s) => s.trim());
        return (
          <span className="flex flex-col leading-tight">
            <span className="num text-sm text-text-secondary">{datePart || full}</span>
            {timePart ? <span className="num text-xs text-text-muted">{timePart}</span> : null}
          </span>
        );
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void handleVerDetalle(row);
          }}
          aria-label={`Ver detalle del período ${row.descripcion || row.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 text-sm font-medium text-text-secondary transition-colors duration-150 hover:border-border-strong hover:bg-spot hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-9"
        >
          <Eye className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Ver detalle</span>
          <span className="sm:hidden">Detalle</span>
        </button>
      ),
    },
  ];

  const receiptColumns: TableColumn<ReciboItem>[] = [
    {
      key: 'persona',
      header: 'Empleado',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            {row.primer_nombre} {row.primer_apellido}
          </p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
    },
    {
      key: 'asignaciones',
      header: 'Asignaciones',
      align: 'right',
      render: (row) => (
        <span className="num text-success">
          +{formatMoney(row.total_asignaciones)}
        </span>
      ),
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      align: 'right',
      render: (row) => (
        <span className="num text-error">
          −{formatMoney(row.total_deducciones)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Neto a cobrar',
      align: 'right',
      render: (row) => (
        <span className="num font-semibold text-text">
          {formatMoney(row.monto_total)}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => {
        const estado = row.estado as ReciboEstado;
        return (
          <Badge
            tone={RECIBO_ESTADO_TONE[estado] ?? 'neutral'}
            statusIcon={estado === 'PAGADO' ? 'paid' : estado === 'PROCESADO' ? 'processed' : 'none'}
          >
            {RECIBO_ESTADO_LABEL[estado] ?? row.estado}
          </Badge>
        );
      },
    },
    {
      key: 'acciones',
      header: 'PDF',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          disabled={pdfBusyId === row.id}
          onClick={(e) => {
            e.stopPropagation();
            void handleDescargarPdf(row);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          title="Descargar el recibo en PDF"
        >
          <Download className="h-3.5 w-3.5" />
          {pdfBusyId === row.id ? 'Generando...' : 'PDF'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Períodos de nómina"
        description="Creación, procesamiento, pago y anulación de periodos de nómina."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo periodo
          </Button>
        }
      />

      {procesar409 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <p>
            Este periodo tiene una pre-nómina sin confirmar. Confírmala o elimínala antes de procesar.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setProcesar409(null);
                void navigate(ROUTES.payrollPreNomina);
              }}
              className="h-9 rounded-button border border-border bg-surface-soft px-3 text-xs font-medium text-text-secondary hover:text-text"
            >
              <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
              Abrir borrador de pre-nómina
            </button>
            <button
              type="button"
              onClick={() => setProcesar409(null)}
              className="h-9 rounded-button border border-border bg-surface-soft px-3 text-xs font-medium text-text-secondary hover:text-text"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}


      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={periods}
            rowKey={(r) => r.id}
            caption="Historial de periodos de nómina"
            loading={loading}
            emptyMessage="No hay periodos registrados."
            onRowClick={(r) => void handleVerDetalle(r)}
          />
        </motion.div>
      </motion.div>

      {/* Modal Crear Periodo */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear nuevo periodo de nómina"
        description="Configura las fechas y frecuencia del periodo. El estado inicial será BORRADOR."
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setCreateOpen(false)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleCreate}>
              Crear periodo
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {createError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
              {createError}
            </div>
          )}

          <Select
            name="frecuencia"
            label="Frecuencia"
            value={frecuencia}
            onChange={(val) => setFrecuencia(val as 'SEMANAL' | 'QUINCENAL' | 'MENSUAL')}
            options={[
              { value: 'QUINCENAL', label: 'Quincenal' },
              { value: 'MENSUAL', label: 'Mensual' },
              { value: 'SEMANAL', label: 'Semanal' },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="date"
              name="fechaInicio"
              label="Fecha de inicio"
              value={fechaInicio}
              onChange={(val) => setFechaInicio(val)}
              required
            />
            <Input
              type="date"
              name="fechaFin"
              label="Fecha de fin"
              value={fechaFin}
              onChange={(val) => setFechaFin(val)}
              required
            />
          </div>

          <Input
            name="descripcion"
            label="Descripción u observación (opcional)"
            placeholder="Ej: Primera quincena de noviembre"
            value={descripcion}
            onChange={(val) => setDescripcion(val)}
          />
        </form>
      </Modal>


      {/* Modal Ver Detalle de Periodo */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Periodo: ${selectedPeriod?.frecuencia ?? ''} (${formatFechaLocal(selectedPeriod?.fecha_inicio)} — ${formatFechaLocal(selectedPeriod?.fecha_fin)})`}
        description={selectedPeriod?.descripcion || 'Detalle del periodo y recibos generados.'}
        size="lg"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Estado actual:</span>
              <Badge
                tone={
                  selectedPeriod
                    ? PERIODO_ESTADO_TONE[selectedPeriod.estado as PeriodoEstado] ?? 'neutral'
                    : 'neutral'
                }
              >
                {selectedPeriod
                  ? PERIODO_ESTADO_LABEL[selectedPeriod.estado as PeriodoEstado] ?? selectedPeriod.estado
                  : '—'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedPeriod?.estado === 'BORRADOR' && (
                <Button
                  state={actionBusy ? 'loading' : 'idle'}
                  onClick={handleProcesar}
                >
                  <Play className="mr-1.5 h-4 w-4" />
                  Procesar nómina
                </Button>
              )}

              {selectedPeriod?.estado === 'PROCESADO' && (
                <>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setAnularOpen(true)}
                    className="inline-flex h-11 items-center gap-1.5 rounded-button border border-error/40 bg-error/10 px-4 text-sm font-medium text-error transition hover:bg-error/20 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Anular a borrador
                  </button>
                  <Button
                    state={actionBusy ? 'loading' : 'idle'}
                    onClick={() => setPayOpen(true)}
                  >
                    <CreditCard className="mr-1.5 h-4 w-4" />
                    Pagar periodo
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => setDetailOpen(false)}
                className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
              >
                Cerrar
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Totales del período (spec 013) */}
          {resumenLoading ? (
            <div className="flex h-20 items-center justify-center rounded-xl border border-border/60 bg-surface-soft text-sm text-text-muted">
              Calculando totales del período...
            </div>
          ) : resumen ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface-soft p-3">
                  <span className="text-xs text-text-muted uppercase">Personas</span>
                  <p className="mt-1 text-xl font-bold text-text">{resumen.totales.personas}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-soft p-3">
                  <span className="text-xs text-text-muted uppercase">Asignaciones</span>
                  <p className="mt-1 text-xl font-bold text-success">
                    +{formatMoney(resumen.totales.total_asignaciones)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-soft p-3">
                  <span className="text-xs text-text-muted uppercase">Deducciones</span>
                  <p className="mt-1 text-xl font-bold text-error">
                    −{formatMoney(resumen.totales.total_deducciones)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-soft p-3">
                  <span className="text-xs text-text-muted uppercase">Neto a pagar</span>
                  <p className="mt-1 text-xl font-bold text-accent">
                    {formatMoney(resumen.totales.total_neto)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-soft p-3">
                  <span className="text-xs text-text-muted uppercase">Aporte patronal</span>
                  <p className="mt-1 text-xl font-bold text-text-secondary">
                    {formatMoney(resumen.totales.total_aporte_patronal)}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-text-muted">
                    Costo del patrono, no se descuenta al empleado.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-soft p-3">
                  <span className="text-xs text-text-muted uppercase">Costo total</span>
                  <p className="mt-1 text-xl font-bold text-text">
                    {formatMoney(resumen.totales.costo_total)}
                  </p>
                </div>
              </div>

              {resumen.por_concepto.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-border/60 bg-surface-soft">
                  <div className="border-b border-border/60 px-4 py-3">
                    <h3 className="text-sm font-semibold text-text">Desglose por concepto</h3>
                    <p className="mt-0.5 text-xs text-text-muted">
                      El aporte patronal se reporta aparte del neto.
                    </p>
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface-soft">
                        <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                          <th className="px-4 py-2 font-medium">Código</th>
                          <th className="px-4 py-2 font-medium">Concepto</th>
                          <th className="px-4 py-2 font-medium">Tipo</th>
                          <th className="px-4 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resumen.por_concepto.map((linea) => (
                          <tr
                            key={`${linea.codigo}-${linea.tipo_concepto}`}
                            className="border-t border-border/40"
                          >
                            <td className="num px-4 py-2 text-text-secondary">{linea.codigo}</td>
                            <td className="px-4 py-2 text-text">{linea.nombre_concepto}</td>
                            <td className="px-4 py-2 text-xs text-text-muted">
                              {TIPO_CONCEPTO_LABEL[linea.tipo_concepto] ?? linea.tipo_concepto}
                            </td>
                            <td className="num px-4 py-2 text-right text-text">
                              {formatMoney(linea.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Recibos del período */}
          {detailLoading ? (
            <div className="flex h-36 items-center justify-center text-text-muted">
              Cargando recibos del periodo...
            </div>
          ) : periodReceipts.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-surface-soft p-6 text-center text-sm text-text-secondary">
              {selectedPeriod?.estado === 'BORRADOR'
                ? 'El periodo está en BORRADOR. Presiona "Procesar nómina" para calcular salarios, horas, conceptos y generar los recibos correspondientes.'
                : 'No se encontraron recibos generados.'}
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <ResponsiveTable
                columns={receiptColumns}
                rows={periodReceipts}
                rowKey={(r) => r.id}
                caption="Recibos generados en este periodo"
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Pagar Periodo */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Registrar pago del periodo"
        description="Marca todos los recibos procesados como pagados registrando el método y fecha de pago."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setPayOpen(false)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handlePagar}>
              Confirmar pago
            </Button>
          </>
        }
      >
        <form onSubmit={handlePagar} className="space-y-4">
          {payError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
              {payError}
            </div>
          )}

          <Input
            type="date"
            name="fechaPago"
            label="Fecha de pago"
            value={fechaPago}
            onChange={(val) => setFechaPago(val)}
            required
          />

          <Select
            name="metodoPago"
            label="Método de pago"
            value={metodoPago}
            onChange={(val) => setMetodoPago(val as 'TRANSFERENCIA' | 'PAGO_MOVIL' | 'EFECTIVO' | 'CHEQUE')}
            options={[
              { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
              { value: 'PAGO_MOVIL', label: 'Pago móvil' },
              { value: 'EFECTIVO', label: 'Efectivo' },
              { value: 'CHEQUE', label: 'Cheque' },
            ]}
          />

          <Input
            name="referenciaPago"
            label="Referencia o comprobante (opcional)"
            placeholder="Ej: TRANSF-849201"
            value={referenciaPago}
            onChange={(val) => setReferenciaPago(val)}
          />

        </form>
      </Modal>

      {/* Modal Confirmar Anular Periodo */}
      <Modal
        open={anularOpen}
        onClose={() => setAnularOpen(false)}
        title="¿Anular periodo a borrador?"
        description="Esta acción eliminará todos los recibos calculados y revertirá cuotas de préstamos y novedades a su estado previo para que puedan recalcularse. Esta acción no se puede deshacer."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setAnularOpen(false)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button
              state={actionBusy ? 'loading' : 'idle'}
              onClick={handleAnular}
            >
              Sí, anular periodo
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          El periodo volverá al estado <strong>BORRADOR</strong>.
        </p>
      </Modal>

      {/* Modal Resumen tras Procesar */}
      {processSummary && (
        <Modal
          open={Boolean(processSummary)}
          onClose={() => setProcessSummary(null)}
          title="Resumen del Procesamiento de Nómina"
          description="Se ha completado el cálculo de recibos del periodo."
          size="md"
          footer={
            <Button onClick={() => setProcessSummary(null)}>
              Entendido
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <span className="text-xs text-text-muted uppercase">Recibos generados</span>
              <p className="mt-1 text-2xl font-bold text-text">
                {processSummary.recibosCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <span className="text-xs text-text-muted uppercase">Total asignaciones</span>
              <p className="mt-1 text-2xl font-bold text-success">
                +{formatMoney(processSummary.totalAsignaciones)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <span className="text-xs text-text-muted uppercase">Total deducciones</span>
              <p className="mt-1 text-2xl font-bold text-error">
                −{formatMoney(processSummary.totalDeducciones)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-4">
              <span className="text-xs text-text-muted uppercase">Neto a pagar</span>
              <p className="mt-1 text-2xl font-bold text-accent">
                {formatMoney(processSummary.montoTotal)}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
