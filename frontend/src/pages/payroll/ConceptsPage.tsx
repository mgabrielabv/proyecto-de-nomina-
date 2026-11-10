import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Tabs } from '../../components/ui/Tabs';
import { useToastStore } from '../../store';
import {
  ConceptService,
  SecurityService,
  type ConceptoCatalogo,
  type ConceptoRecurrenteDetalle,
  type PersonaItem,
} from '../../features/payroll/services';
import { formatMoney, formatFechaLocal, toISODate } from '../../utils';
import {
  TIPO_CONCEPTO_LABEL,
  TIPO_CONCEPTO_TONE,
  TIPO_VALOR_LABEL,
} from '../../constants';


export function ConceptsPage() {
  const [tab, setTab] = useState<'catalogo' | 'recurrentes'>('catalogo');
  const [catalogo, setCatalogo] = useState<ConceptoCatalogo[]>([]);
  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [recurrentes, setRecurrentes] = useState<ConceptoRecurrenteDetalle[]>([]);

  const [loading, setLoading] = useState(true);
  const [recurrentesLoading, setRecurrentesLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Modal Asignar Recurrente
  const [assignOpen, setAssignOpen] = useState(false);
  const [conceptoId, setConceptoId] = useState<string>('');
  const [tipoValor, setTipoValor] = useState<'MONTO_FIJO' | 'PORCENTAJE_SALARIO'>('MONTO_FIJO');
  const [valor, setValor] = useState('');
  const [vigenteDesde, setVigenteDesde] = useState(
    toISODate(new Date()),
  );
  const [vigenteHasta, setVigenteHasta] = useState('');
  const [observacion, setObservacion] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  // Modal Cerrar Vigencia
  const [quitarId, setQuitarId] = useState<string | null>(null);
  const [fechaHastaCierre, setFechaHastaCierre] = useState(
    toISODate(new Date()),
  );

  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const [conceptosList, personasList] = await Promise.all([
          ConceptService.listar(),
          SecurityService.listarPersonas(),
        ]);
        if (!active) return;
        setCatalogo(conceptosList ?? []);
        setPersonas(personasList ?? []);
        if (conceptosList && conceptosList.length > 0) {
          setConceptoId(String(conceptosList[0].id));
        }
        if (personasList && personasList.length > 0) {
          setSelectedPersonaId(personasList[0].id);
        }
      } catch (err: any) {
        pushToast(err?.message ?? 'Error al cargar conceptos', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pushToast]);

  const loadRecurrentes = async (personaId: string) => {
    if (!personaId) {
      setRecurrentes([]);
      return;
    }
    setRecurrentesLoading(true);
    try {
      const data = await ConceptService.listarRecurrentes(personaId);
      setRecurrentes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar conceptos recurrentes', 'error');
    } finally {
      setRecurrentesLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'recurrentes' && selectedPersonaId) {
      void loadRecurrentes(selectedPersonaId);
    }
  }, [tab, selectedPersonaId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);

    if (!selectedPersonaId || !conceptoId || !valor || !vigenteDesde) {
      setAssignError('Todos los campos obligatorios deben completarse');
      return;
    }

    const valorNum = Number(valor);
    if (tipoValor === 'PORCENTAJE_SALARIO' && (valorNum <= 0 || valorNum > 1)) {
      setAssignError('El porcentaje debe estar entre 0.01 (1%) y 1.00 (100%)');
      return;
    }

    setActionBusy(true);
    try {
      await ConceptService.asignarRecurrente(
        selectedPersonaId,
        Number(conceptoId),
        valor,
        vigenteDesde,
        tipoValor,
        vigenteHasta || null,
        observacion || null,
      );
      pushToast('Concepto recurrente asignado con éxito', 'success');
      setAssignOpen(false);
      setValor('');
      setObservacion('');
      if (selectedPersonaId) {
        await loadRecurrentes(selectedPersonaId);
      }
    } catch (err: any) {
      setAssignError(err?.message ?? 'Error al asignar concepto');
    } finally {
      setActionBusy(false);
    }
  };

  const handleQuitar = async () => {
    if (!quitarId) return;
    setActionBusy(true);
    try {
      await ConceptService.quitarRecurrente(quitarId, fechaHastaCierre);
      pushToast('Vigencia cerrada correctamente', 'success');
      setQuitarId(null);
      if (selectedPersonaId) {
        await loadRecurrentes(selectedPersonaId);
      }
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cerrar vigencia', 'error');
    } finally {
      setActionBusy(false);
    }
  };

  const catalogoColumns: TableColumn<ConceptoCatalogo>[] = [
    {
      key: 'codigo',
      header: 'Código',
      render: (row) => <span className="font-mono font-semibold text-text">{row.codigo}</span>,
      sortValue: (row) => row.codigo,
    },
    {
      key: 'nombre_concepto',
      header: 'Nombre del concepto',
      render: (row) => <span className="font-medium text-text">{row.nombre_concepto}</span>,
      sortValue: (row) => row.nombre_concepto,
    },
    {
      key: 'tipo_concepto',
      header: 'Tipo',
      render: (row) => (
        <Badge tone={TIPO_CONCEPTO_TONE[row.tipo_concepto] ?? 'neutral'}>
          {TIPO_CONCEPTO_LABEL[row.tipo_concepto] ?? row.tipo_concepto}
        </Badge>
      ),
      sortValue: (row) => row.tipo_concepto,
    },

    {
      key: 'categoria',
      header: 'Categoría',
      render: (row) => <span className="text-text-secondary">{row.categoria}</span>,
      sortValue: (row) => row.categoria,
    },
    {
      key: 'unidad',
      header: 'Unidad',
      render: (row) => <span className="text-text-muted">{row.unidad}</span>,
    },
    {
      key: 'afecta_base_ley',
      header: 'Afecta base de ley',
      align: 'center',
      render: (row) =>
        row.afecta_base_ley ? (
          <CheckCircle className="mx-auto h-4 w-4 text-success" />
        ) : (
          <XCircle className="mx-auto h-4 w-4 text-text-muted" />
        ),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.activo ? 'success' : 'neutral'}>
          {row.activo ? 'ACTIVO' : 'INACTIVO'}
        </Badge>
      ),
    },
  ];

  const recurrenteColumns: TableColumn<ConceptoRecurrenteDetalle>[] = [
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
      key: 'tipo_valor',
      header: 'Modalidad',
      render: (row) => (
        <span className="text-xs text-text-secondary">
          {TIPO_VALOR_LABEL[row.tipo_valor] ?? row.tipo_valor}
        </span>
      ),
    },
    {
      key: 'valor',
      header: 'Valor asignado',
      align: 'right',
      render: (row) => {
        if (row.tipo_valor === 'PORCENTAJE_SALARIO') {
          return (
            <span className="font-semibold tabular-nums text-accent">
              {(Number(row.valor || 0) * 100).toFixed(2)}%
            </span>
          );
        }
        return (
          <span className="font-semibold tabular-nums text-text">
            {formatMoney(row.valor)}
          </span>
        );
      },
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      render: (row) => (
        <span className="tabular-nums text-xs text-text-secondary">
          {formatFechaLocal(row.vigente_desde)} —{' '}
          {row.vigente_hasta ? formatFechaLocal(row.vigente_hasta) : 'Indefinida'}
        </span>
      ),
    },
    {
      key: 'observacion',
      header: 'Observación',
      render: (row) => (
        <span className="text-xs text-text-muted">{row.observacion || '—'}</span>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        if (row.vigente_hasta) {
          return <span className="text-xs text-text-muted">Cerrado</span>;
        }
        return (
          <button
            type="button"
            onClick={() => setQuitarId(row.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface"
          >
            <Clock className="h-3.5 w-3.5" />
            Cerrar vigencia
          </button>
        );
      },
    },
  ];

  const personaOptions = personas.map((per) => ({
    value: per.id,
    label: `${per.primer_nombre} ${per.primer_apellido} — CI: ${per.cedula}`,
  }));

  const conceptOptions = catalogo.map((c) => ({
    value: String(c.id),
    label: `[${c.codigo}] ${c.nombre_concepto} (${TIPO_CONCEPTO_LABEL[c.tipo_concepto] ?? c.tipo_concepto})`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conceptos Salariales"
        description="Catálogo de asignaciones, deducciones y conceptos recurrentes asignados por empleado."
        actions={
          tab === 'recurrentes' ? (
            <Button onClick={() => setAssignOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Asignar concepto
            </Button>
          ) : undefined
        }
      />


      <div className="flex justify-start">
        <Tabs
          layoutId="conceptos-tabs"
          value={tab}
          onChange={(val) => setTab(val as 'catalogo' | 'recurrentes')}
          items={[
            { value: 'catalogo', label: 'Catálogo de conceptos' },
            { value: 'recurrentes', label: 'Conceptos recurrentes por empleado' },
          ]}
        />
      </div>

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {tab === 'catalogo' ? (
          <motion.div variants={fadeUpItem}>
            <ResponsiveTable
              columns={catalogoColumns}
              rows={catalogo}
              rowKey={(r) => String(r.id)}
              caption="Catálogo general de conceptos salariales"
              loading={loading}
              emptyMessage="No hay conceptos registrados en el catálogo."
            />
          </motion.div>
        ) : (
          <>
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
                columns={recurrenteColumns}
                rows={recurrentes}
                rowKey={(r) => r.id}
                caption="Conceptos recurrentes asignados al empleado"
                loading={loading || recurrentesLoading}
                emptyMessage={
                  personas.length === 0
                    ? 'No hay empleados activos.'
                    : 'Este empleado no tiene conceptos recurrentes asignados.'
                }
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Modal Asignar Recurrente */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Asignar concepto recurrente"
        description="Se aplicará automáticamente en cada cálculo de nómina mientras esté vigente."
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setAssignOpen(false)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleAssign}>
              Asignar concepto
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssign} className="space-y-4">
          {assignError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
              {assignError}
            </div>
          )}

          <Select
            name="concepto"
            label="Concepto"
            value={conceptoId}
            onChange={(val) => setConceptoId(val)}
            options={conceptOptions}
            placeholder="Selecciona concepto"
          />

          <Select
            name="tipoValor"
            label="Tipo de cálculo"
            value={tipoValor}
            onChange={(val) => setTipoValor(val as 'MONTO_FIJO' | 'PORCENTAJE_SALARIO')}
            options={[
              { value: 'MONTO_FIJO', label: 'Monto fijo' },
              { value: 'PORCENTAJE_SALARIO', label: 'Porcentaje de salario' },
            ]}
          />

          <Input
            type="number"
            step="0.01"
            min="0"
            name="valor"
            label={tipoValor === 'MONTO_FIJO' ? 'Monto fijo' : 'Fracción porcentaje (Ej: 0.10 para 10%)'}
            placeholder={tipoValor === 'MONTO_FIJO' ? '0.00' : '0.10'}
            value={valor}
            onChange={(val) => setValor(val)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              name="vigenteDesde"
              label="Vigente desde"
              value={vigenteDesde}
              onChange={(val) => setVigenteDesde(val)}
              required
            />
            <Input
              type="date"
              name="vigenteHasta"
              label="Vigente hasta (opcional)"
              value={vigenteHasta}
              onChange={(val) => setVigenteHasta(val)}
            />
          </div>

          <Input
            name="observacion"
            label="Observación (opcional)"
            placeholder="Ej: Bono fijo de transporte, prima de antigüedad..."
            value={observacion}
            onChange={(val) => setObservacion(val)}
          />
        </form>
      </Modal>

      {/* Modal Cerrar Vigencia */}
      <Modal
        open={Boolean(quitarId)}
        onClose={() => setQuitarId(null)}
        title="Cerrar vigencia de concepto"
        description="Establece la fecha límite en la que este concepto recurrente dejará de aplicarse."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setQuitarId(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleQuitar}>
              Cerrar vigencia
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            type="date"
            name="fechaHastaCierre"
            label="Fecha de fin de vigencia"
            value={fechaHastaCierre}
            onChange={(val) => setFechaHastaCierre(val)}
            required
          />
        </div>
      </Modal>

    </div>
  );
}
