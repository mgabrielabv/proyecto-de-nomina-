import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Filter, ShieldAlert } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useSessionStore, useToastStore } from '../../store';
import {
  HoursService,
  PeriodService,
  SecurityService,
  type RegistroHorasPeriodo,
  type PeriodoNomina,
  type PersonaItem,
} from '../../features/payroll/services';
import { formatFechaLocal, formatDateTime, hasAnyProfile, toISODate } from '../../utils';
import { FRECUENCIA_LABEL, PERIODO_ESTADO_LABEL } from '../../constants';

// Pantalla de Superusuario y RRHH. Administrador comparte el rol 'superuser'
// en el frontend, así que la comprobación fina es por nombre de perfil; el
// backend igualmente valida el permiso real del método.
export function OvertimePage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);
  const puedeGestionarExtras = hasAnyProfile(user, ['Superusuario', 'RRHH', 'GerenteRRHH']);

  const [periods, setPeriods] = useState<PeriodoNomina[]>([]);
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [records, setRecords] = useState<RegistroHorasPeriodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Modal Registrar extra
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [fecha, setFecha] = useState(toISODate(new Date()));
  const [horasExtra, setHorasExtra] = useState('1');
  const [observacion, setObservacion] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Quitar extra
  const [quitarRegistro, setQuitarRegistro] = useState<RegistroHorasPeriodo | null>(null);

  useEffect(() => {
    if (!puedeGestionarExtras) {
      setLoading(false);
      return;
    }

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
  }, [puedeGestionarExtras, pushToast]);

  const loadExtras = async (periodoId: string) => {
    if (!periodoId) {
      setRecords([]);
      return;
    }
    setRecordsLoading(true);
    try {
      const data = await HoursService.listarExtrasPorPeriodo(periodoId);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar las horas extras del periodo', 'error');
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (!puedeGestionarExtras) return;
    if (selectedPeriodId) {
      void loadExtras(selectedPeriodId);
    }
  }, [selectedPeriodId, puedeGestionarExtras]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const he = Number(horasExtra);

    if (!selectedPersonaId) {
      setCreateError('Selecciona un empleado');
      return;
    }
    if (!fecha) {
      setCreateError('Indica la fecha de la hora extra');
      return;
    }
    if (!Number.isFinite(he) || he <= 0) {
      setCreateError('Las horas extra deben ser mayores que cero');
      return;
    }

    setActionBusy(true);
    try {
      await HoursService.registrarExtra(
        selectedPersonaId,
        fecha,
        he,
        observacion || null,
      );
      pushToast('Horas extras registradas exitosamente', 'success');
      setCreateOpen(false);
      setObservacion('');
      if (selectedPeriodId) {
        await loadExtras(selectedPeriodId);
      }
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al registrar las horas extras');
    } finally {
      setActionBusy(false);
    }
  };

  const handleQuitar = async () => {
    if (!quitarRegistro) return;
    setActionBusy(true);
    try {
      const resultado = await HoursService.quitarExtra(quitarRegistro.id);
      pushToast(
        resultado.eliminado
          ? 'Registro de horas extras eliminado'
          : 'Horas extras quitadas; las horas normales se conservan',
        'success',
      );
      setQuitarRegistro(null);
      if (selectedPeriodId) {
        await loadExtras(selectedPeriodId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudieron quitar las horas extras', 'error');
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
      header: 'Fecha',
      render: (row) => (
        <span className="tabular-nums text-text">{formatFechaLocal(row.fecha)}</span>
      ),
      sortValue: (row) => row.fecha,
    },
    {
      key: 'horas_normales',
      header: 'Horas normales',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-text-secondary">{row.horas_normales} h</span>
      ),
      sortValue: (row) => Number(row.horas_normales),
    },
    {
      key: 'horas_extra',
      header: 'Horas extra',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-accent">{row.horas_extra} h</span>
      ),
      sortValue: (row) => Number(row.horas_extra),
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
          onClick={() => setQuitarRegistro(row)}
          className="inline-flex items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20"
          title="Quitar las horas extra de este día"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Quitar extra
        </button>
      ),
    },
  ];

  if (!puedeGestionarExtras) {
    return (
      <div className="space-y-6">
        <PageHeader title="Horas Extras" description="Acceso restringido." />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla es de uso exclusivo para los perfiles <strong>Superusuario</strong> y{' '}
            <strong>RRHH</strong>. Las horas normales se registran desde la pantalla{' '}
            <strong>Horas</strong>.
          </p>
        </div>
      </div>
    );
  }

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
        title="Registro de Horas Extras"
        description="Registra las horas extra del personal. Se suman a las horas extra del día y se pagan a 1.5× en el recibo."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Registrar hora extra
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
            caption="Registros de horas extras del periodo"
            loading={loading || recordsLoading}
            emptyMessage={
              periods.length === 0
                ? 'No hay periodos creados. Crea un periodo primero.'
                : 'No se encontraron horas extras para este periodo.'
            }
          />
        </motion.div>
      </motion.div>

      {/* Modal Registrar hora extra */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar horas extras"
        description="Las horas se suman a las que ya tenga el empleado ese día. Si el día pertenece a un periodo procesado o pagado, el registro será rechazado."
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
              Guardar horas extra
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
            label="Fecha de la hora extra"
            value={fecha}
            onChange={(val) => setFecha(val)}
            required
          />

          <Input
            type="number"
            step="0.5"
            min="0.5"
            name="horasExtra"
            label="Horas extra"
            value={horasExtra}
            onChange={(val) => setHorasExtra(val)}
            required
          />

          <Input
            name="observacion"
            label="Observación (opcional)"
            placeholder="Ej: Soporte fin de semana, cierre de mes..."
            value={observacion}
            onChange={(val) => setObservacion(val)}
          />
        </form>
      </Modal>

      {/* Modal Confirmar quitar extra */}
      <Modal
        open={Boolean(quitarRegistro)}
        onClose={() => setQuitarRegistro(null)}
        title="¿Quitar las horas extra?"
        description="Solo se quitan las horas extra del registro seleccionado. No se pueden modificar días de periodos procesados o pagados."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setQuitarRegistro(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleQuitar}>
              Sí, quitar extra
            </Button>
          </>
        }
      >
        {quitarRegistro && (
          <div className="space-y-2 text-sm text-text-secondary">
            <p>
              <span className="font-medium text-text">
                {quitarRegistro.primer_nombre} {quitarRegistro.primer_apellido}
              </span>{' '}
              — {formatFechaLocal(quitarRegistro.fecha)}
            </p>
            <p>
              Horas extra a quitar:{' '}
              <span className="font-semibold text-accent">{quitarRegistro.horas_extra} h</span>
            </p>
            <p>
              {Number(quitarRegistro.horas_normales) > 0
                ? `Se conservarán las ${quitarRegistro.horas_normales} horas normales del día.`
                : 'El registro del día se eliminará porque no tiene horas normales.'}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
