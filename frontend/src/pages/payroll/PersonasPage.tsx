import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, ShieldAlert, UserMinus } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { SearchInput } from '../../components/ui/Input/SearchInput';
import { useSessionStore, useToastStore } from '../../store';
import {
  EmployeeService,
  type PersonaRegistro,
  type PersonaDetalle,
  type ResultadoDespido,
  type MotivoDespido,
} from '../../features/payroll/services';
import { formatFechaLocal, hasAnyProfile, toISODate } from '../../utils';
import { FRECUENCIA_LABEL, LIMITS } from '../../constants';

// Registro de personas: pantalla de RRHH y Superusuario. Administrador
// comparte el rol 'superuser' en el front, por eso la guarda fina es por
// nombre de perfil; el backend igualmente valida permiso_metodo.
const PERFILES_REGISTRO = ['RRHH', 'Superusuario'] as const;

// Los motivos viven en el enum de la base; el front solo humaniza la etiqueta.
const motivoLabel = (motivo: string) =>
  motivo
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

const contratoTone = (estado: string | null) => {
  if (estado === 'VIGENTE') return 'success' as const;
  if (estado === 'SUSPENDIDO') return 'warning' as const;
  return 'neutral' as const;
};

export function PersonasPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);
  const puedeGestionar = hasAnyProfile(user, [...PERFILES_REGISTRO]);

  const [personas, setPersonas] = useState<PersonaRegistro[]>([]);
  const [estado, setEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Detalle de persona
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PersonaDetalle | null>(null);

  // Modal de despido
  const [despidoTarget, setDespidoTarget] = useState<PersonaRegistro | null>(null);
  const [motivos, setMotivos] = useState<MotivoDespido[]>([]);
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [despidoError, setDespidoError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDespido | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadPersonas = async (filtro: typeof estado) => {
    setLoading(true);
    try {
      const data = await EmployeeService.listar(filtro);
      setPersonas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar las personas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!puedeGestionar) {
      setLoading(false);
      return;
    }
    void loadPersonas(estado);
    // `pushToast` es estable en el store; el filtro es la dependencia real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeGestionar, estado]);

  const filtradas = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return personas;
    return personas.filter((p) => {
      const nombre = `${p.primer_nombre} ${p.segundo_nombre ?? ''} ${p.primer_apellido} ${p.segundo_apellido ?? ''}`;
      return (
        p.cedula.toLowerCase().includes(term) || nombre.toLowerCase().includes(term)
      );
    });
  }, [personas, query]);

  const abrirDetalle = async (persona: PersonaRegistro) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await EmployeeService.ver(persona.id);
      setDetail(data ?? null);
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudo cargar el detalle de la persona', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const abrirDespido = async (persona: PersonaRegistro) => {
    setDespidoTarget(persona);
    setMotivo('');
    setFecha(toISODate(new Date()));
    setDescripcion('');
    setDespidoError(null);
    setResultado(null);
    if (motivos.length === 0) {
      try {
        const lista = await EmployeeService.listarMotivos();
        setMotivos(Array.isArray(lista) ? lista : []);
      } catch (err: any) {
        pushToast(err?.message ?? 'No se pudieron cargar los motivos de despido', 'error');
      }
    }
  };

  const cerrarDespido = () => {
    setDespidoTarget(null);
    setResultado(null);
    setDespidoError(null);
  };

  const handleDespedir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!despidoTarget) return;
    setDespidoError(null);

    if (!motivo) {
      setDespidoError('Selecciona un motivo de despido');
      return;
    }
    if (!fecha) {
      setDespidoError('Indica la fecha del despido');
      return;
    }

    setActionBusy(true);
    try {
      const res = await EmployeeService.despedir(
        despidoTarget.id,
        motivo as MotivoDespido,
        fecha,
        descripcion.trim() || null,
      );
      setResultado(res);
      pushToast('Despido registrado. El contrato quedó cerrado.', 'success');
      await loadPersonas(estado);
    } catch (err: any) {
      setDespidoError(err?.message ?? 'No se pudo registrar el despido');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<PersonaRegistro>[] = [
    {
      key: 'persona',
      header: 'Persona',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            {row.primer_nombre} {row.primer_apellido}
          </p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
      sortValue: (row) => `${row.primer_apellido} ${row.primer_nombre}`,
    },
    {
      key: 'cargo',
      header: 'Cargo',
      render: (row) => (
        <span className="text-text-secondary">{row.cargo || '—'}</span>
      ),
    },
    {
      key: 'contrato',
      header: 'Contrato',
      render: (row) => (
        <div className="space-y-1">
          <Badge tone={contratoTone(row.contrato_estado)}>
            {row.contrato_estado ?? 'Sin contrato'}
          </Badge>
          {row.fecha_inicio && (
            <p className="text-xs text-text-muted">
              {formatFechaLocal(row.fecha_inicio)} —{' '}
              {row.fecha_fin ? formatFechaLocal(row.fecha_fin) : 'vigente'}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'usuario',
      header: 'Usuario',
      hideOnMobile: true,
      render: (row) => (
        <div>
          <p className="text-text-secondary">{row.username || '—'}</p>
          {row.username && (
            <p className="text-xs text-text-muted">
              {row.usuario_activo ? 'Activo' : 'Inactivo'}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.estado === 'ACTIVO' ? 'success' : 'neutral'}>{row.estado}</Badge>
      ),
      sortValue: (row) => row.estado,
    },
    {
      key: 'despido',
      header: 'Último despido',
      hideOnMobile: true,
      render: (row) =>
        row.fecha_despido ? (
          <div>
            <p className="text-text-secondary">
              {row.despido_motivo ? motivoLabel(row.despido_motivo) : '—'}
            </p>
            <p className="text-xs text-text-muted">{formatFechaLocal(row.fecha_despido)}</p>
          </div>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        const puedeDespedir =
          row.estado === 'ACTIVO' &&
          row.contrato_estado === 'VIGENTE' &&
          !row.despido_id;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void abrirDetalle(row);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface"
            >
              <Eye className="h-3.5 w-3.5" />
              Detalle
            </button>
            {puedeDespedir && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void abrirDespido(row);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Despedir
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (!puedeGestionar) {
    return (
      <div className="space-y-6">
        <PageHeader title="Registro de personas" description="Acceso restringido." />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla es de uso exclusivo para los perfiles <strong>Superusuario</strong> y{' '}
            <strong>RRHH</strong>.
          </p>
        </div>
      </div>
    );
  }

  const motivoOptions = motivos.map((m) => ({ value: m, label: motivoLabel(m) }));
  const fechaMax = toISODate(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de personas"
        description="Personas con su contrato vigente y su último despido. El despido cierra el contrato y desactiva al usuario."
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div
          variants={fadeUpItem}
          className="flex flex-col gap-3 rounded-xl border border-border bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="w-full sm:max-w-sm">
            <SearchInput
              name="buscarPersona"
              value={query}
              onChange={setQuery}
              placeholder="Buscar por cédula o nombre"
              ariaLabel="Buscar persona por cédula o nombre"
            />
          </div>
          <div className="w-full sm:max-w-[220px]">
            <Select
              name="estadoPersona"
              label="Estado"
              value={estado}
              onChange={(val) => setEstado(val as typeof estado)}
              options={[
                { value: 'TODOS', label: 'Todas' },
                { value: 'ACTIVO', label: 'Activas' },
                { value: 'INACTIVO', label: 'Inactivas' },
              ]}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={filtradas}
            rowKey={(r) => r.id}
            caption="Personas registradas con su contrato y último despido"
            loading={loading}
            emptyMessage={
              query
                ? 'Ninguna persona coincide con la búsqueda.'
                : 'No hay personas registradas con ese estado.'
            }
            onRowClick={(r) => void abrirDetalle(r)}
          />
        </motion.div>
      </motion.div>

      {/* Modal Detalle de persona */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          detail
            ? `${detail.persona.primer_nombre} ${detail.persona.primer_apellido}`
            : 'Detalle de la persona'
        }
        description={detail ? `CI: ${detail.persona.cedula}` : undefined}
        size="lg"
        footer={<Button onClick={() => setDetailOpen(false)}>Cerrar</Button>}
      >
        {detailLoading ? (
          <div className="flex h-32 items-center justify-center text-text-muted">
            Cargando detalle...
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-soft p-4 sm:grid-cols-4">
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Estado</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  <Badge tone={detail.persona.estado === 'ACTIVO' ? 'success' : 'neutral'}>
                    {detail.persona.estado}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Usuario</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  {detail.persona.username || '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Teléfono</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  {detail.persona.nro_tlf || '—'}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Correo</span>
                <p className="mt-0.5 truncate text-sm font-medium text-text">
                  {detail.persona.email || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Contratos
              </h4>
              <div className="overflow-hidden rounded-xl border border-border/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft text-text-muted">
                    <tr>
                      <th className="p-2.5">Cargo</th>
                      <th className="p-2.5">Inicio</th>
                      <th className="p-2.5">Fin</th>
                      <th className="p-2.5">Pago</th>
                      <th className="p-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {detail.contratos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-text-muted">
                          Sin contratos registrados.
                        </td>
                      </tr>
                    ) : (
                      detail.contratos.map((c) => (
                        <tr key={c.id}>
                          <td className="p-2.5 text-text">{c.cargo || '—'}</td>
                          <td className="p-2.5 text-text-secondary">
                            {formatFechaLocal(c.fecha_inicio)}
                          </td>
                          <td className="p-2.5 text-text-secondary">
                            {c.fecha_fin ? formatFechaLocal(c.fecha_fin) : '—'}
                          </td>
                          <td className="p-2.5 text-text-secondary">
                            {c.tipo_pago} ·{' '}
                            {FRECUENCIA_LABEL[c.frecuencia_pago as keyof typeof FRECUENCIA_LABEL] ??
                              c.frecuencia_pago}
                          </td>
                          <td className="p-2.5">
                            <Badge tone={contratoTone(c.estado)}>{c.estado}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Despidos
              </h4>
              {detail.despidos.length === 0 ? (
                <p className="rounded-xl border border-border/60 bg-surface-soft p-4 text-sm text-text-muted">
                  Sin despidos registrados.
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.despidos.map((d) => (
                    <li
                      key={d.id}
                      className="rounded-xl border border-border/60 bg-surface-soft p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-text">{motivoLabel(d.motivo)}</span>
                        <span className="text-xs text-text-muted">
                          {formatFechaLocal(d.fecha_despido)}
                        </span>
                      </div>
                      {d.descripcion && (
                        <p className="mt-1 text-text-secondary">{d.descripcion}</p>
                      )}
                      <p className="mt-1 text-xs text-text-muted">
                        Registrado por: {d.registrado_por_username || '—'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Modal Registrar despido */}
      <Modal
        open={Boolean(despidoTarget)}
        onClose={cerrarDespido}
        title="Registrar despido"
        description="Esta acción cierra el contrato, marca a la persona como inactiva y desactiva su usuario. No se puede deshacer desde la interfaz."
        size="md"
        footer={
          resultado ? (
            <Button onClick={cerrarDespido}>Entendido</Button>
          ) : (
            <>
              <button
                type="button"
                disabled={actionBusy}
                onClick={cerrarDespido}
                className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
              >
                Cancelar
              </button>
              <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleDespedir}>
                Registrar despido
              </Button>
            </>
          )
        }
      >
        {resultado ? (
          <div className="space-y-3 text-sm text-text-secondary">
            <p className="font-medium text-text">Despido registrado correctamente.</p>
            <ul className="space-y-1">
              <li>
                Contrato finalizado el{' '}
                <span className="font-medium text-text">
                  {formatFechaLocal(resultado.contrato.fecha_fin)}
                </span>
                .
              </li>
              <li>
                Usuario desactivado:{' '}
                <span className="font-medium text-text">
                  {resultado.usuarioDesactivado ? 'sí' : 'no tenía usuario'}
                </span>
                .
              </li>
              <li>
                Sesiones cerradas:{' '}
                <span className="font-medium text-text">{resultado.sesionesCerradas}</span> · Tokens
                revocados:{' '}
                <span className="font-medium text-text">{resultado.tokensRevocados}</span>.
              </li>
            </ul>
          </div>
        ) : (
          <form onSubmit={handleDespedir} className="space-y-4">
            {despidoError && (
              <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                {despidoError}
              </div>
            )}

            <div className="rounded-xl border border-border bg-surface-soft p-3 text-sm">
              <p className="font-medium text-text">
                {despidoTarget?.primer_nombre} {despidoTarget?.primer_apellido}
              </p>
              <p className="text-xs text-text-muted">
                CI: {despidoTarget?.cedula} · Cargo: {despidoTarget?.cargo || '—'} · Contrato desde{' '}
                {formatFechaLocal(despidoTarget?.fecha_inicio)}
              </p>
            </div>

            <Select
              name="motivoDespido"
              label="Motivo"
              value={motivo}
              onChange={setMotivo}
              options={motivoOptions}
              placeholder="Selecciona el motivo"
            />

            <Input
              type="date"
              name="fechaDespido"
              label="Fecha del despido"
              value={fecha}
              onChange={setFecha}
              min={despidoTarget?.fecha_inicio ?? undefined}
              max={fechaMax}
              required
            />

            <Textarea
              name="descripcionDespido"
              label="Descripción (opcional)"
              value={descripcion}
              onChange={setDescripcion}
              maxLength={LIMITS.dismissalDescription.max}
              showCounter
              hint="Detalle del motivo o del acta. Máximo 250 caracteres."
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
