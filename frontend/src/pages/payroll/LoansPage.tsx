import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  DollarSign,
  Ban,
  Filter,
} from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToastStore } from '../../store';
import {
  LoanService,
  SecurityService,
  type PrestamoItem,
  type CuotaPrestamo,
  type PersonaItem,
  type LoanSaldoResult,
} from '../../features/payroll/services';
import { formatMoney, formatFechaLocal, toISODate } from '../../utils';
import { PRESTAMO_ESTADO_LABEL, PRESTAMO_ESTADO_TONE } from '../../constants';


export function LoansPage() {
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [loans, setLoans] = useState<PrestamoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Modal Crear Préstamo
  const [createOpen, setCreateOpen] = useState(false);
  const [targetPersonaId, setTargetPersonaId] = useState('');
  const [fechaOtorgamiento, setFechaOtorgamiento] = useState(
    toISODate(new Date()),
  );
  const [montoTotal, setMontoTotal] = useState('');
  const [nroCuotas, setNroCuotas] = useState('12');
  const [tasaInteres, setTasaInteres] = useState('0'); // %
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Ver Cuotas calculadas
  const [cuotasModalOpen, setCuotasModalOpen] = useState(false);
  const [calculatedCuotas, setCalculatedCuotas] = useState<CuotaPrestamo[]>([]);

  // Modal Saldo de Préstamo
  const [saldoModalOpen, setSaldoModalOpen] = useState(false);
  const [saldoInfo, setSaldoInfo] = useState<LoanSaldoResult | null>(null);
  const [saldoLoading, setSaldoLoading] = useState(false);

  // Modal Confirmar Anulación
  const [anularId, setAnularId] = useState<string | null>(null);

  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const personasList = await SecurityService.listarPersonas();
        if (!active) return;
        setPersonas(personasList ?? []);
        if (personasList && personasList.length > 0) {
          setSelectedPersonaId(personasList[0].id);
          setTargetPersonaId(personasList[0].id);
        }
      } catch (err: any) {
        pushToast(err?.message ?? 'Error al cargar empleados', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pushToast]);

  const loadLoans = async (personaId: string) => {
    if (!personaId) {
      setLoans([]);
      return;
    }
    setLoansLoading(true);
    try {
      const data = await LoanService.listar(personaId);
      setLoans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar préstamos', 'error');
    } finally {
      setLoansLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPersonaId) {
      void loadLoans(selectedPersonaId);
    }
  }, [selectedPersonaId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const montoNum = Number(montoTotal);
    const cuotasNum = Number(nroCuotas);
    const tasaNum = Number(tasaInteres) / 100; // Fracción: 10% = 0.10

    if (montoNum <= 0) {
      setCreateError('El monto total debe ser mayor a 0');
      return;
    }
    if (cuotasNum < 1 || cuotasNum > 120) {
      setCreateError('El número de cuotas debe ser entre 1 y 120');
      return;
    }
    if (!targetPersonaId) {
      setCreateError('Selecciona un empleado');
      return;
    }

    setActionBusy(true);
    try {
      const result = await LoanService.crear(
        targetPersonaId,
        fechaOtorgamiento,
        montoNum,
        cuotasNum,
        tasaNum,
      );
      pushToast('Préstamo creado con éxito', 'success');
      setCreateOpen(false);
      setMontoTotal('');

      // Mostrar cuotas generadas
      if (result?.cuotas && result.cuotas.length > 0) {
        setCalculatedCuotas(result.cuotas);
        setCuotasModalOpen(true);
      }

      if (selectedPersonaId === targetPersonaId) {
        await loadLoans(selectedPersonaId);
      } else {
        setSelectedPersonaId(targetPersonaId);
      }
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al crear préstamo');
    } finally {
      setActionBusy(false);
    }
  };

  const handleVerSaldo = async (prestamoId: string) => {
    setSaldoLoading(true);
    setSaldoModalOpen(true);
    try {
      const saldos = await LoanService.saldos(prestamoId);
      setSaldoInfo(saldos);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al consultar saldo', 'error');
      setSaldoModalOpen(false);
    } finally {
      setSaldoLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!anularId) return;
    setActionBusy(true);
    try {
      await LoanService.anular(anularId);
      pushToast('Préstamo anulado exitosamente', 'success');
      setAnularId(null);
      if (selectedPersonaId) {
        await loadLoans(selectedPersonaId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al anular préstamo', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<PrestamoItem>[] = [
    {
      key: 'fecha_otorgamiento',
      header: 'Fecha de otorgamiento',
      render: (row) => (
        <span className="tabular-nums text-text">
          {formatFechaLocal(row.fecha_otorgamiento)}
        </span>
      ),
      sortValue: (row) => row.fecha_otorgamiento,
    },
    {
      key: 'monto_total',
      header: 'Monto total',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-text">
          {formatMoney(row.monto_total)}
        </span>
      ),
      sortValue: (row) => Number(row.monto_total),
    },
    {
      key: 'nro_cuotas',
      header: 'Cuotas',
      align: 'center',
      render: (row) => <span className="tabular-nums text-text">{row.nro_cuotas}</span>,
      sortValue: (row) => row.nro_cuotas,
    },
    {
      key: 'cuota_periodica',
      header: 'Cuota periódica',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-accent">
          {formatMoney(row.cuota_periodica)}
        </span>
      ),
    },
    {
      key: 'tasa_interes',
      header: 'Tasa interés',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-text-secondary">
          {(Number(row.tasa_interes || 0) * 100).toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={PRESTAMO_ESTADO_TONE[row.estado] ?? 'neutral'}>
          {PRESTAMO_ESTADO_LABEL[row.estado] ?? row.estado}
        </Badge>
      ),
      sortValue: (row) => row.estado,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => void handleVerSaldo(row.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Ver saldo
          </button>

          {(row.estado === 'SOLICITADO' || row.estado === 'ACTIVO') && (
            <button
              type="button"
              onClick={() => setAnularId(row.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20"
              title="Anular préstamo"
            >
              <Ban className="h-3.5 w-3.5" />
              Anular
            </button>
          )}
        </div>
      ),
    },
  ];

  const cuotaColumns: TableColumn<CuotaPrestamo>[] = [
    {
      key: 'nroCuota',
      header: 'N°',
      align: 'center',
      render: (row) => <span className="font-semibold tabular-nums">{row.nroCuota}</span>,
    },
    {
      key: 'fechaVencimiento',
      header: 'Vencimiento',
      render: (row) => (
        <span className="tabular-nums">{formatFechaLocal(row.fechaVencimiento)}</span>
      ),
    },
    {
      key: 'montoCapital',
      header: 'Capital',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatMoney(row.montoCapital)}</span>,
    },
    {
      key: 'montoInteres',
      header: 'Interés',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatMoney(row.montoInteres)}</span>,
    },
    {
      key: 'montoCuota',
      header: 'Cuota total',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-accent">
          {formatMoney(row.montoCuota)}
        </span>
      ),
    },
  ];

  const personaOptions = personas.map((per) => ({
    value: per.id,
    label: `${per.primer_nombre} ${per.primer_apellido} — CI: ${per.cedula}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Préstamos al Personal"
        description="Otorgamiento de préstamos con cálculo de cuotas amortizadas y control de saldos."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo préstamo
          </Button>
        }
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div
          variants={fadeUpItem}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-soft p-4"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <span className="text-sm font-medium text-text">Empleado a consultar:</span>
          </div>

          <div className="w-full max-w-md">
            <Select
              name="selectedPersona"
              label="Empleado a consultar"
              value={selectedPersonaId}
              onChange={(val) => setSelectedPersonaId(val)}
              options={personaOptions}
              placeholder="Seleccionar empleado"
            />
          </div>
        </motion.div>


        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={loans}
            rowKey={(r) => r.id}
            caption="Historial de préstamos del empleado"
            loading={loading || loansLoading}
            emptyMessage={
              personas.length === 0
                ? 'No hay empleados activos.'
                : 'Este empleado no tiene préstamos registrados.'
            }
          />
        </motion.div>
      </motion.div>

      {/* Modal Nuevo Préstamo */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar nuevo préstamo"
        description="El empleado debe tener un contrato vigente para calcular las fechas de vencimiento de las cuotas según su frecuencia de pago."
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
              Otorgar préstamo
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
            name="targetPersona"
            label="Empleado beneficiario"
            value={targetPersonaId}
            onChange={(val) => setTargetPersonaId(val)}
            options={personaOptions}
            placeholder="Selecciona empleado"
          />

          <Input
            type="date"
            name="fechaOtorgamiento"
            label="Fecha de otorgamiento"
            value={fechaOtorgamiento}
            onChange={(val) => setFechaOtorgamiento(val)}
            required
          />

          <Input
            type="number"
            step="0.01"
            min="1"
            name="montoTotal"
            label="Monto total del préstamo"
            placeholder="0.00"
            value={montoTotal}
            onChange={(val) => setMontoTotal(val)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min="1"
              max="120"
              name="nroCuotas"
              label="Número de cuotas"
              value={nroCuotas}
              onChange={(val) => setNroCuotas(val)}
              required
            />
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              name="tasaInteres"
              label="Tasa de interés (%)"
              placeholder="0"
              value={tasaInteres}
              onChange={(val) => setTasaInteres(val)}
            />
          </div>

        </form>
      </Modal>

      {/* Modal Cuotas Calculadas */}
      <Modal
        open={cuotasModalOpen}
        onClose={() => setCuotasModalOpen(false)}
        title="Simulación y Tabla de Cuotas Generadas"
        description="Cronograma de cuotas calculado automáticamente según la frecuencia de pago del empleado."
        size="lg"
        footer={
          <Button onClick={() => setCuotasModalOpen(false)}>
            Cerrar cronograma
          </Button>
        }
      >
        <div className="max-h-96 overflow-y-auto">
          <ResponsiveTable
            columns={cuotaColumns}
            rows={calculatedCuotas}
            rowKey={(r) => r.id || String(r.nroCuota)}
            caption="Cuotas del préstamo"
          />
        </div>
      </Modal>

      {/* Modal Saldo */}
      <Modal
        open={saldoModalOpen}
        onClose={() => setSaldoModalOpen(false)}
        title="Estado de Cuenta del Préstamo"
        description="Saldo pendiente calculado a partir de las cuotas pendientes de descuento."
        size="sm"
        footer={
          <Button onClick={() => setSaldoModalOpen(false)}>
            Cerrar
          </Button>
        }
      >
        {saldoLoading ? (
          <div className="py-8 text-center text-text-muted">Calculando saldo...</div>
        ) : saldoInfo ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border bg-surface-soft p-4 text-center">
              <span className="text-xs text-text-muted uppercase">Saldo pendiente</span>
              <p className="mt-1 text-3xl font-bold text-accent">
                {formatMoney(saldoInfo.saldoPendiente)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-4 text-center">
              <span className="text-xs text-text-muted uppercase">Cuotas pendientes</span>
              <p className="mt-1 text-2xl font-semibold text-text">
                {saldoInfo.cuotasPendientes} cuotas
              </p>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal Confirmar Anular */}
      <Modal
        open={Boolean(anularId)}
        onClose={() => setAnularId(null)}
        title="¿Anular préstamo?"
        description="Solo es posible anular préstamos en estado Solicitado o Activo que no tengan cuotas descontadas en recibos pagados."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setAnularId(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleAnular}>
              Sí, anular préstamo
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          El estado del préstamo cambiará a <strong>Anulado</strong>.
        </p>
      </Modal>
    </div>
  );
}
