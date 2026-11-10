import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  CheckCircle2,
  XCircle,
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
  NovedadService,
  PeriodService,
  ConceptService,
  SecurityService,
  type NovedadDetalle,
  type PeriodoNomina,
  type PersonaItem,
  type ConceptoCatalogo,
} from '../../features/payroll/services';
import { formatMoney, formatFechaLocal, toISODate } from '../../utils';
import {
  NOVEDAD_ESTADO_LABEL,
  NOVEDAD_ESTADO_TONE,
  FRECUENCIA_LABEL,
  PERIODO_ESTADO_LABEL,
  TIPO_CONCEPTO_LABEL,
} from '../../constants';


export function NovedadesPage() {
  const [periods, setPeriods] = useState<PeriodoNomina[]>([]);
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [concepts, setConcepts] = useState<ConceptoCatalogo[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [novedades, setNovedades] = useState<NovedadDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [novedadesLoading, setNovedadesLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Modal Registrar Novedad
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [selectedConceptoId, setSelectedConceptoId] = useState<string>('');
  const [tipoInput, setTipoInput] = useState<'monto' | 'cantidad'>('monto');
  const [monto, setMonto] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(toISODate(new Date()));
  const [observacion, setObservacion] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const pushToast = useToastStore((s) => s.push);

  // Cargar catálogos auxiliares
  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const [periodosList, personasList, conceptosList] = await Promise.all([
          PeriodService.listar(),
          SecurityService.listarPersonas(),
          ConceptService.listar(),
        ]);
        if (!active) return;
        setPeriods(periodosList ?? []);
        setPersonas(personasList ?? []);
        setConcepts(conceptosList ?? []);
        if (periodosList && periodosList.length > 0) {
          setSelectedPeriodId(periodosList[0].id);
        }
        if (personasList && personasList.length > 0) {
          setSelectedPersonaId(personasList[0].id);
        }
        if (conceptosList && conceptosList.length > 0) {
          setSelectedConceptoId(String(conceptosList[0].id));
        }
      } catch (err: any) {
        pushToast(err?.message ?? 'Error al cargar catálogos', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pushToast]);

  const loadNovedades = async (periodoId: string) => {
    if (!periodoId) {
      setNovedades([]);
      return;
    }
    setNovedadesLoading(true);
    try {
      const data = await NovedadService.listarPorPeriodo(periodoId);
      setNovedades(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar novedades', 'error');
    } finally {
      setNovedadesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      void loadNovedades(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!selectedPersonaId || !selectedConceptoId || !selectedPeriodId) {
      setCreateError('Todos los campos son obligatorios');
      return;
    }

    const valMonto = tipoInput === 'monto' ? (monto ? monto : null) : null;
    const valCantidad = tipoInput === 'cantidad' ? (cantidad ? cantidad : null) : null;

    if (!valMonto && !valCantidad) {
      setCreateError('Debes ingresar un monto o una cantidad');
      return;
    }

    setActionBusy(true);
    try {
      await NovedadService.registrar(
        selectedPersonaId,
        Number(selectedConceptoId),
        selectedPeriodId,
        fecha,
        valCantidad,
        valMonto,
        observacion || null,
      );
      pushToast('Novedad registrada exitosamente', 'success');
      setCreateOpen(false);
      setMonto('');
      setCantidad('');
      setObservacion('');
      if (selectedPeriodId) {
        await loadNovedades(selectedPeriodId);
      }
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al registrar novedad');
    } finally {
      setActionBusy(false);
    }
  };

  const handleAprobar = async (id: string) => {
    setActionBusy(true);
    try {
      await NovedadService.aprobar(id);
      pushToast('Novedad aprobada', 'success');
      if (selectedPeriodId) {
        await loadNovedades(selectedPeriodId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudo aprobar la novedad', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRechazar = async (id: string) => {
    setActionBusy(true);
    try {
      await NovedadService.rechazar(id);
      pushToast('Novedad rechazada', 'info');
      if (selectedPeriodId) {

        await loadNovedades(selectedPeriodId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudo rechazar la novedad', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<NovedadDetalle>[] = [
    {
      key: 'empleado',
      header: 'Empleado',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            {row.primer_nombre} {row.primer_apellido}
          </p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
      sortValue: (row) => `${row.primer_nombre} ${row.primer_apellido}`,
    },
    {
      key: 'concepto',
      header: 'Concepto',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            [{row.codigo}] {row.nombre_concepto}
          </p>
          <span className="text-xs text-text-muted">{TIPO_CONCEPTO_LABEL[row.tipo_concepto] ?? row.tipo_concepto}</span>
        </div>
      ),
      sortValue: (row) => row.nombre_concepto,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => (
        <span className="tabular-nums text-text">{formatFechaLocal(row.fecha)}</span>
      ),
      sortValue: (row) => row.fecha,
    },
    {
      key: 'valor',
      header: 'Cantidad / Monto',
      align: 'right',
      render: (row) => {
        if (row.monto !== null && row.monto !== undefined) {
          const isAsig = row.tipo_concepto === 'ASIGNACION';
          return (
            <span
              className={`font-medium tabular-nums ${
                isAsig ? 'text-success' : 'text-error'
              }`}
            >
              {isAsig ? '+' : '−'}
              {formatMoney(row.monto)}
            </span>
          );
        }
        return (
          <span className="tabular-nums text-text">
            {row.cantidad} {row.unidad || 'uds'}
          </span>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={NOVEDAD_ESTADO_TONE[row.estado] ?? 'neutral'}>
          {NOVEDAD_ESTADO_LABEL[row.estado] ?? row.estado}
        </Badge>
      ),
      sortValue: (row) => row.estado,
    },

    {
      key: 'observacion',
      header: 'Observación',
      render: (row) => (
        <span className="text-xs text-text-secondary">{row.observacion || '—'}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        if (row.estado !== 'PENDIENTE') {
          return <span className="text-xs text-text-muted">—</span>;
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void handleAprobar(row.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success transition hover:bg-success/20 disabled:opacity-50"
              title="Aprobar novedad"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprobar
            </button>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void handleRechazar(row.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20 disabled:opacity-50"
              title="Rechazar novedad"
            >
              <XCircle className="h-3.5 w-3.5" />
              Rechazar
            </button>
          </div>
        );
      },
    },
  ];

  const periodOptions = periods.map((p) => ({
    value: p.id,
    label: `${FRECUENCIA_LABEL[p.frecuencia] ?? p.frecuencia} (${formatFechaLocal(p.fecha_inicio)} — ${formatFechaLocal(p.fecha_fin)}) · ${PERIODO_ESTADO_LABEL[p.estado] ?? p.estado}`,
  }));

  const personaOptions = personas.map((per) => ({
    value: per.id,
    label: `${per.primer_nombre} ${per.primer_apellido} — CI: ${per.cedula}`,
  }));

  const conceptOptions = concepts.map((c) => ({
    value: String(c.id),
    label: `[${c.codigo}] ${c.nombre_concepto} (${TIPO_CONCEPTO_LABEL[c.tipo_concepto] ?? c.tipo_concepto})`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novedades de Nómina"
        description="Gestión de bonos, deducciones y novedades puntuales del periodo."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva novedad
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
            <span className="text-sm font-medium text-text">Periodo a consultar:</span>
          </div>

          <div className="w-full max-w-md">
            <Select
              name="selectedPeriod"
              label="Periodo a consultar"
              value={selectedPeriodId}
              onChange={(val) => setSelectedPeriodId(val)}
              options={periodOptions}
              placeholder="Seleccionar periodo"
            />
          </div>
        </motion.div>


        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={novedades}
            rowKey={(r) => r.id}
            caption="Novedades registradas en el periodo"
            loading={loading || novedadesLoading}
            emptyMessage={
              periods.length === 0
                ? 'No hay periodos creados.'
                : 'No hay novedades registradas para este periodo.'
            }
          />
        </motion.div>
      </motion.div>

      {/* Modal Registrar Novedad */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar novedad en periodo"
        description="Solo se pueden registrar novedades en periodos con estado Borrador."
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
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleRegister}>
              Registrar novedad
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegister} className="space-y-4">
          {createError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
              {createError}
            </div>
          )}

          <Select
            name="persona"
            label="Empleado"
            value={selectedPersonaId}
            onChange={(val) => setSelectedPersonaId(val)}
            options={personaOptions}
            placeholder="Selecciona empleado"
          />

          <Select
            name="concepto"
            label="Concepto"
            value={selectedConceptoId}
            onChange={(val) => setSelectedConceptoId(val)}
            options={conceptOptions}
            placeholder="Selecciona concepto"
          />

          <Input
            type="date"
            name="fecha"
            label="Fecha de la novedad"
            value={fecha}
            onChange={(val) => setFecha(val)}
            required
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Tipo de valor
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="radio"
                  name="tipoInput"
                  checked={tipoInput === 'monto'}
                  onChange={() => setTipoInput('monto')}
                  className="text-accent"
                />
                Monto directo ($)
              </label>
              <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="radio"
                  name="tipoInput"
                  checked={tipoInput === 'cantidad'}
                  onChange={() => setTipoInput('cantidad')}
                  className="text-accent"
                />
                Cantidad de unidades
              </label>
            </div>
          </div>

          {tipoInput === 'monto' ? (
            <Input
              type="number"
              step="0.01"
              min="0"
              name="monto"
              label="Monto"
              placeholder="0.00"
              value={monto}
              onChange={(val) => setMonto(val)}
              required
            />
          ) : (
            <Input
              type="number"
              step="0.5"
              min="0"
              name="cantidad"
              label="Cantidad de unidades"
              placeholder="1"
              value={cantidad}
              onChange={(val) => setCantidad(val)}
              required
            />
          )}

          <Input
            name="observacion"
            label="Observación (opcional)"
            placeholder="Ej: Bono por productividad, descuento por atraso..."
            value={observacion}
            onChange={(val) => setObservacion(val)}
          />

        </form>
      </Modal>
    </div>
  );
}
