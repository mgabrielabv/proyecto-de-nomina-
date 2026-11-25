import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Filter } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToastStore } from '../../store';
import {
  HoursService,
  PeriodService,
  SecurityService,
  type RegistroHorasPeriodo,
  type PeriodoNomina,
  type PersonaItem,
} from '../../features/payroll/services';
import { formatFechaLocal, formatDateTime, toISODate } from '../../utils';
import { FRECUENCIA_LABEL, PERIODO_ESTADO_LABEL } from '../../constants';


export function HoursPage() {
  const [periods, setPeriods] = useState<PeriodoNomina[]>([]);
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [records, setRecords] = useState<RegistroHorasPeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Modal Registrar Horas
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [fecha, setFecha] = useState(toISODate(new Date()));
  const [horasNormales, setHorasNormales] = useState('8');
  const [horasExtra, setHorasExtra] = useState('0');
  const [observacion, setObservacion] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Eliminar
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pushToast = useToastStore((s) => s.push);

  // Cargar periodos y personas
  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const [periodosList, personasList] = await Promise.all([
          PeriodService.listar(),
          SecurityService.listarPersonas(),
        ]);
        if (!active) return;
        setPeriods(periodosList ?? []);
        setPersonas(personasList ?? []);
        if (periodosList && periodosList.length > 0) {
          setSelectedPeriodId(periodosList[0].id);
        }
        if (personasList && personasList.length > 0) {
          setSelectedPersonaId(personasList[0].id);
        }
      } catch (err: any) {
        pushToast(err?.message ?? 'Error al cargar datos auxiliares', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pushToast]);

  // Cargar registros de horas del periodo seleccionado
  const loadRecords = async (periodoId: string) => {
    if (!periodoId) {
      setRecords([]);
      return;
    }
    setRecordsLoading(true);
    try {
      const data = await HoursService.listarPorPeriodo(periodoId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar horas del periodo', 'error');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPeriodId) {
      void loadRecords(selectedPeriodId);
    }
  }, [selectedPeriodId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const hn = Number(horasNormales);
    const he = Number(horasExtra);

    if (hn < 0 || he < 0 || hn + he <= 0) {
      setCreateError('La suma de horas normales y extra debe ser mayor a 0');
      return;
    }
    if (!selectedPersonaId) {
      setCreateError('Selecciona un empleado');
      return;
    }
    if (!fecha) {
      setCreateError('Indica la fecha trabajada');
      return;
    }

    setActionBusy(true);
    try {
      await HoursService.registrar(
        selectedPersonaId,
        fecha,
        hn,
        he,
        observacion || null,
      );
      pushToast('Horas registradas exitosamente', 'success');
      setCreateOpen(false);
      setObservacion('');
      if (selectedPeriodId) {
        await loadRecords(selectedPeriodId);
      }
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al registrar horas');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionBusy(true);
    try {
      await HoursService.eliminar(deleteId);
      pushToast('Registro de horas eliminado', 'success');
      setDeleteId(null);
      if (selectedPeriodId) {
        await loadRecords(selectedPeriodId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudo eliminar el registro', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<RegistroHorasPeriodo>[] = [
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
      sortValue: (row) => `${row.primer_nombre} ${row.primer_apellido}`,
    },
    {
      key: 'fecha',
      header: 'Fecha trabajada',
      render: (row) => (
        <span className="tabular-nums text-text">{formatFechaLocal(row.fecha)}</span>
      ),
      sortValue: (row) => row.fecha,
    },
    {
      key: 'horas_normales',
      header: 'Horas normales',
      align: 'right',
      render: (row) => <span className="tabular-nums text-text">{row.horas_normales} h</span>,
      sortValue: (row) => Number(row.horas_normales),
    },
    {
      key: 'horas_extra',
      header: 'Horas extra',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-accent">{row.horas_extra} h</span>
      ),
      sortValue: (row) => Number(row.horas_extra),
    },
    {
      key: 'total_horas',
      header: 'Total horas',
      align: 'right',
      render: (row) => {
        const total = Number(row.horas_normales || 0) + Number(row.horas_extra || 0);
        return <span className="font-semibold tabular-nums text-text">{total} h</span>;
      },
    },
    {
      key: 'observacion',
      header: 'Observación',
      render: (row) => (
        <span className="text-xs text-text-secondary">{row.observacion || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Registrado',
      render: (row) => (
        <span className="text-xs text-text-muted">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteId(row.id)}
          className="inline-flex items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20"
          title="Eliminar registro"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      ),
    },
  ];

  const periodOptions = periods.map((p) => ({
    value: p.id,
    label: `${FRECUENCIA_LABEL[p.frecuencia] ?? p.frecuencia} (${formatFechaLocal(p.fecha_inicio)} — ${formatFechaLocal(p.fecha_fin)}) · ${PERIODO_ESTADO_LABEL[p.estado] ?? p.estado}`,
  }));

  const personaOptions = personas.map((per) => ({
    value: per.id,
    label: `${per.primer_nombre} ${per.primer_apellido} — CI: ${per.cedula} (${per.cargo || 'Sin cargo'})`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de Horas Trabajadas"
        description="Gestión y control de horas normales y extra de los trabajadores por periodo."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Registrar horas
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
          <div className="flex flex-wrap items-center gap-3">
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
            rows={records}
            rowKey={(r) => r.id}
            caption="Registros de horas del periodo"
            loading={loading || recordsLoading}
            emptyMessage={
              periods.length === 0
                ? 'No hay periodos creados. Crea un periodo primero.'
                : 'No se encontraron registros de horas para este periodo.'
            }
          />
        </motion.div>
      </motion.div>

      {/* Modal Registrar Horas */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar horas de empleado"
        description="Ingresa las horas trabajadas en una fecha específica. Si la fecha corresponde a un periodo procesado, el registro será rechazado."
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
              Guardar horas
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

          <Input
            type="date"
            name="fecha"
            label="Fecha trabajada"
            value={fecha}
            onChange={(val) => setFecha(val)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.5"
              min="0"
              name="horasNormales"
              label="Horas normales"
              value={horasNormales}
              onChange={(val) => setHorasNormales(val)}
              required
            />
            <Input
              type="number"
              step="0.5"
              min="0"
              name="horasExtra"
              label="Horas extra"
              value={horasExtra}
              onChange={(val) => setHorasExtra(val)}
            />
          </div>

          <Input
            name="observacion"
            label="Observación (opcional)"
            placeholder="Ej: Turno nocturno, soporte fin de semana..."
            value={observacion}
            onChange={(val) => setObservacion(val)}
          />

        </form>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="¿Eliminar registro de horas?"
        description="Esta acción eliminará el registro de horas seleccionado. Solo es posible si la fecha no pertenece a un periodo ya procesado."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setDeleteId(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button
              state={actionBusy ? 'loading' : 'idle'}
              onClick={handleDelete}
            >
              Sí, eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          ¿Deseas confirmar la eliminación?
        </p>
      </Modal>
    </div>
  );
}
