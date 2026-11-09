import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  UserX,
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
  AffiliationService,
  SecurityService,
  type Afiliacion,
  type PersonaItem,
} from '../../features/payroll/services';
import { formatFechaLocal } from '../../utils';


const TIPOS_APORTE = [
  { value: '1', label: '1 - SSO (Seguro Social Obligatorio)' },
  { value: '2', label: '2 - Paro Forzoso (Régimen Prestacional de Empleo)' },
  { value: '3', label: '3 - FAOV (Fondo de Ahorro Obligatorio para la Vivienda)' },
  { value: '4', label: '4 - INCES (Instituto Nacional de Capacitación y Educación Socialista)' },
];

export function AffiliationsPage() {
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [afiliaciones, setAfiliaciones] = useState<Afiliacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [afiliacionesLoading, setAfiliacionesLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Modal Registrar Afiliación
  const [createOpen, setCreateOpen] = useState(false);
  const [tipoAporteId, setTipoAporteId] = useState('1');
  const [nroAfiliacion, setNroAfiliacion] = useState('');
  const [fechaInscripcion, setFechaInscripcion] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal Dar de Baja
  const [bajaId, setBajaId] = useState<string | null>(null);
  const [fechaBaja, setFechaBaja] = useState(
    new Date().toISOString().slice(0, 10),
  );

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

  const loadAfiliaciones = async (personaId: string) => {
    if (!personaId) {
      setAfiliaciones([]);
      return;
    }
    setAfiliacionesLoading(true);
    try {
      const data = await AffiliationService.listar(personaId);
      setAfiliaciones(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar afiliaciones', 'error');
    } finally {
      setAfiliacionesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPersonaId) {
      void loadAfiliaciones(selectedPersonaId);
    }
  }, [selectedPersonaId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!selectedPersonaId || !tipoAporteId || !nroAfiliacion.trim() || !fechaInscripcion) {
      setCreateError('Todos los campos son obligatorios');
      return;
    }

    setActionBusy(true);
    try {
      await AffiliationService.registrar(
        selectedPersonaId,
        Number(tipoAporteId),
        nroAfiliacion.trim(),
        fechaInscripcion,
      );
      pushToast('Afiliación registrada exitosamente', 'success');
      setCreateOpen(false);
      setNroAfiliacion('');
      if (selectedPersonaId) {
        await loadAfiliaciones(selectedPersonaId);
      }
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al registrar afiliación');
    } finally {
      setActionBusy(false);
    }
  };

  const handleDarDeBaja = async () => {
    if (!bajaId) return;
    setActionBusy(true);
    try {
      await AffiliationService.darDeBaja(bajaId, fechaBaja);
      pushToast('Afiliación dada de baja', 'success');
      setBajaId(null);
      if (selectedPersonaId) {
        await loadAfiliaciones(selectedPersonaId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al dar de baja', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<Afiliacion>[] = [
    {
      key: 'entidad',
      header: 'Aporte de ley / Entidad',
      render: (row) => (
        <div>
          <p className="font-semibold text-text">{row.nombre || row.codigo || `Tipo ${row.tipo_aporte_id}`}</p>
          <p className="text-xs text-text-muted">{row.entidad || 'Entidad reglamentaria'}</p>
        </div>
      ),
      sortValue: (row) => row.nombre || '',
    },
    {
      key: 'nro_afiliacion',
      header: 'N° Afiliación',
      render: (row) => (
        <span className="font-mono text-xs font-medium text-text">
          {row.nro_afiliacion}
        </span>
      ),
    },
    {
      key: 'fecha_inscripcion',
      header: 'Fecha inscripción',
      render: (row) => (
        <span className="tabular-nums text-text">
          {formatFechaLocal(row.fecha_inscripcion)}
        </span>
      ),
      sortValue: (row) => row.fecha_inscripcion,
    },
    {
      key: 'fecha_baja',
      header: 'Fecha baja',
      render: (row) => (
        <span className="tabular-nums text-text-muted">
          {row.fecha_baja ? formatFechaLocal(row.fecha_baja) : '—'}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.estado === 'ACTIVO' ? 'success' : 'error'}>
          {row.estado}
        </Badge>
      ),
      sortValue: (row) => row.estado,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        if (row.estado === 'BAJA') {
          return <span className="text-xs text-text-muted">Baja procesada</span>;
        }
        return (
          <button
            type="button"
            onClick={() => setBajaId(row.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20"
          >
            <UserX className="h-3.5 w-3.5" />
            Dar de baja
          </button>
        );
      },
    },
  ];

  const personaOptions = personas.map((per) => ({
    value: per.id,
    label: `${per.primer_nombre} ${per.primer_apellido} — CI: ${per.cedula}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Afiliaciones a Aportes de Ley"
        description="Gestión de números de inscripción y afiliaciones de empleados ante el SSO, FAOV, INCES y Paro Forzoso."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva afiliación
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
            rows={afiliaciones}
            rowKey={(r) => r.id}
            caption="Afiliaciones del empleado seleccionado"
            loading={loading || afiliacionesLoading}
            emptyMessage={
              personas.length === 0
                ? 'No hay empleados activos.'
                : 'Este empleado no cuenta con afiliaciones a aportes de ley registradas.'
            }
          />
        </motion.div>
      </motion.div>

      {/* Modal Registrar Afiliación */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Registrar afiliación a aporte de ley"
        description="Asocia al empleado con su número de afiliación a un instituto de previsión o ley."
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
              Registrar afiliación
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
            name="tipoAporte"
            label="Tipo de aporte de ley"
            value={tipoAporteId}
            onChange={(val) => setTipoAporteId(val)}
            options={TIPOS_APORTE}
          />

          <Input
            name="nroAfiliacion"
            label="Número de afiliación / cuenta"
            placeholder="Ej: SSO-1049281-A"
            value={nroAfiliacion}
            onChange={(val) => setNroAfiliacion(val)}
            required
          />

          <Input
            type="date"
            name="fechaInscripcion"
            label="Fecha de inscripción"
            value={fechaInscripcion}
            onChange={(val) => setFechaInscripcion(val)}
            required
          />
        </form>
      </Modal>

      {/* Modal Dar de Baja */}
      <Modal
        open={Boolean(bajaId)}
        onClose={() => setBajaId(null)}
        title="Dar de baja afiliación"
        description="Indica la fecha a partir de la cual cesa la afiliación del empleado ante esta entidad."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setBajaId(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleDarDeBaja}>
              Confirmar baja
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            type="date"
            name="fechaBaja"
            label="Fecha de baja"
            value={fechaBaja}
            onChange={(val) => setFechaBaja(val)}
            required
          />
        </div>
      </Modal>

    </div>
  );
}
