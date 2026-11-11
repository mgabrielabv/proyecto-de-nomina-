import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  EyeOff,
  Info,
  Layers,
  ListTree,
  PencilLine,
  Plus,
  Power,
  PowerOff,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Tabs } from '../../components/ui/Tabs';
import { useMenuStore, useSessionStore, useToastStore } from '../../store';
import {
  OptionService,
  type OpcionAdminItem,
  type PermisoOpcionItem,
  type PermisosOpcionResponse,
  type SubsistemaAdminItem,
} from '../../features/admin/services/optionService';
import { ProfileAdminService, type PerfilAdminItem } from '../../features/admin/services/profileAdminService';
import { hasProfile } from '../../utils';
import { cn } from '../../utils/cn';

// Misma regla del backend: 2–80 caracteres alfanuméricos, empieza por letra,
// sin espacios, acentos, guiones ni guion bajo.
const OPCION_NOMBRE_REGEX = /^[A-Za-z][A-Za-z0-9]{1,79}$/;
const DESCRIPCION_MAX = 200;
const ORDEN_MIN = 0;
const ORDEN_MAX = 32767;

export function OptionsPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);
  const activePerfilId = user?.activeProfile.id;

  // El sidebar se pide por perfil activo, no por rol. Refresca la caché de
  // ese perfil cuando la administración cambia sus opciones.
  const refrescarMenu = () => {
    if (activePerfilId !== undefined) {
      void useMenuStore.getState().fetchMenu(activePerfilId, true);
    }
  };

  // Pantalla exclusiva de Superusuario (el rol 'superuser' también lo cumple
  // Administrador, por eso la comprobación es por nombre de perfil).
  const esSuperusuario = hasProfile(user, 'Superusuario');

  const [tab, setTab] = useState<'catalogo' | 'asignar'>('catalogo');

  // Catálogo
  const [subsistemas, setSubsistemas] = useState<SubsistemaAdminItem[]>([]);
  const [opciones, setOpciones] = useState<OpcionAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales del catálogo
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [opcionEditando, setOpcionEditando] = useState<OpcionAdminItem | null>(null);
  const [opcionDesactivar, setOpcionDesactivar] = useState<OpcionAdminItem | null>(null);

  // Formulario
  const [subsistemaId, setSubsistemaId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState('1');
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [ordenError, setOrdenError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [busyOpcionId, setBusyOpcionId] = useState<number | null>(null);

  // Asignación
  const [perfiles, setPerfiles] = useState<PerfilAdminItem[]>([]);
  const [perfilIdSeleccionado, setPerfilIdSeleccionado] = useState<string>('');
  const [permisos, setPermisos] = useState<PermisosOpcionResponse | null>(null);
  const [permisosLoading, setPermisosLoading] = useState(false);
  const [busyOpciones, setBusyOpciones] = useState<Set<number>>(new Set());
  const [quitarPendiente, setQuitarPendiente] = useState<PermisoOpcionItem | null>(null);

  const perfilSeleccionado = useMemo(
    () => perfiles.find((p) => p.id === Number(perfilIdSeleccionado)) ?? null,
    [perfiles, perfilIdSeleccionado],
  );
  const esPerfilSuperusuario = perfilSeleccionado?.nombre === 'Superusuario';
  const esPerfilPropio = Boolean(
    user?.profiles?.some((p) => p.id === perfilSeleccionado?.id),
  );

  const loadCatalogo = async () => {
    setLoading(true);
    try {
      // En paralelo: subsistemas (selector al crear) y opciones (tabla).
      const [subsistemasList, opcionesList] = await Promise.all([
        OptionService.listarSubsistemas(),
        OptionService.listarOpciones(),
      ]);
      setSubsistemas(subsistemasList ?? []);
      setOpciones(opcionesList ?? []);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al cargar el catálogo de opciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPerfiles = async () => {
    try {
      const perfilesList = await ProfileAdminService.listarPerfiles();
      const activos = (perfilesList ?? []).filter((p) => p.activo);
      setPerfiles(activos);
      if (activos.length > 0) setPerfilIdSeleccionado(String(activos[0].id));
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al cargar perfiles', 'error');
    }
  };

  useEffect(() => {
    if (!esSuperusuario) {
      setLoading(false);
      return;
    }
    void loadCatalogo();
    void loadPerfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esSuperusuario]);

  const loadPermisos = async (perfilId: number) => {
    setPermisosLoading(true);
    setPermisos(null);
    try {
      const res = await OptionService.listarPermisosOpcion(perfilId);
      setPermisos(res);
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al cargar las opciones del perfil', 'error');
    } finally {
      setPermisosLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'asignar' && esSuperusuario && perfilIdSeleccionado) {
      void loadPermisos(Number(perfilIdSeleccionado));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, perfilIdSeleccionado, esSuperusuario]);

  const abrirCrear = () => {
    setSubsistemaId('');
    setNombre('');
    setDescripcion('');
    setOrden('1');
    setNombreError(null);
    setOrdenError(null);
    setModal('crear');
  };

  const abrirEditar = (opcion: OpcionAdminItem) => {
    setOpcionEditando(opcion);
    setNombre(opcion.nombre);
    setDescripcion(opcion.descripcion ?? '');
    setOrden(String(opcion.orden));
    setNombreError(null);
    setOrdenError(null);
    setModal('editar');
  };

  const cerrarModal = () => {
    setModal(null);
    setOpcionEditando(null);
    setNombreError(null);
    setOrdenError(null);
  };

  const validarNombre = (): string | null => {
    if (!nombre.trim()) return 'El nombre de la opción es obligatorio';
    if (!OPCION_NOMBRE_REGEX.test(nombre.trim())) {
      return 'Entre 2 y 80 caracteres alfanuméricos, empezando por letra, sin espacios, acentos ni guiones';
    }
    return null;
  };

  const validarOrden = (): string | null => {
    const valor = Number(orden);
    if (!Number.isInteger(valor) || valor < ORDEN_MIN || valor > ORDEN_MAX) {
      return `El orden debe ser un entero entre ${ORDEN_MIN} y ${ORDEN_MAX}`;
    }
    return null;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const errNombre = validarNombre();
    const errOrden = validarOrden();
    setNombreError(errNombre);
    setOrdenError(errOrden);
    // La validación documentada da feedback inmediato; los 400/409 del backend
    // se muestran junto al campo correspondiente.
    if (errNombre || errOrden) return;

    setFormBusy(true);
    try {
      const opcion = await OptionService.crearOpcion(
        Number(subsistemaId),
        nombre.trim(),
        descripcion.trim() ? descripcion.trim() : null,
        Number(orden),
      );
      pushToast(
        `Opción "${opcion.nombre}" creada en ${opcion.subsistema} (activa, sin perfiles asignados). Asígnala en la pestaña "Asignar a perfil" para que se vea en el menú.`,
        'success',
      );
      cerrarModal();
      await loadCatalogo();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la opción';
      setNombreError(message);
      pushToast(message, 'error');
    } finally {
      setFormBusy(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opcionEditando) return;

    const errNombre = opcionEditando.protegida ? null : validarNombre();
    const errOrden = validarOrden();
    setNombreError(errNombre);
    setOrdenError(errOrden);
    if (errNombre || errOrden) return;

    setFormBusy(true);
    try {
      await OptionService.editarOpcion(
        opcionEditando.id,
        opcionEditando.protegida ? opcionEditando.nombre : nombre.trim(),
        descripcion.trim() ? descripcion.trim() : null,
        Number(orden),
      );
      pushToast('Opción actualizada', 'success');
      cerrarModal();
      await loadCatalogo();
      // El nombre cambió en el menú: refrescar el sidebar en caliente.
      refrescarMenu();
    } catch (err) {
      // 409 (nombre repetido / renombrar protegida): junto al campo.
      const message = err instanceof Error ? err.message : 'Error al editar la opción';
      setNombreError(message);
      pushToast(message, 'error');
    } finally {
      setFormBusy(false);
    }
  };

  const ejecutarCambioEstado = async (opcion: OpcionAdminItem, activo: boolean) => {
    setBusyOpcionId(opcion.id);
    try {
      const resultado = await OptionService.cambiarEstadoOpcion(opcion.id, activo);
      if (!resultado.cambio) {
        pushToast(`La opción "${opcion.nombre}" ya estaba ${activo ? 'activa' : 'inactiva'}`, 'info');
      } else {
        pushToast(`Opción "${opcion.nombre}" ${activo ? 'reactivada' : 'desactivada'}`, 'success');
      }
      setOpcionDesactivar(null);
      await loadCatalogo();
      // El menú de los usuarios cambia en caliente.
      refrescarMenu();
    } catch (err) {
      // 409 (opción protegida): mensaje del backend tal cual.
      const message = err instanceof Error ? err.message : 'Error al cambiar el estado de la opción';
      pushToast(message, 'error');
      setOpcionDesactivar(null);
    } finally {
      setBusyOpcionId(null);
    }
  };

  const ejecutarQuitar = async (permiso: PermisoOpcionItem) => {
    if (!perfilIdSeleccionado) return;
    setBusyOpciones((prev) => new Set(prev).add(permiso.id));
    try {
      const res = await OptionService.quitarPermisoOpcion(Number(perfilIdSeleccionado), permiso.id);
      if (res.yaNoEstaba) {
        pushToast(`La opción "${permiso.nombre}" ya estaba quitada del perfil ${res.perfil}`, 'info');
      } else {
        pushToast(`Opción "${permiso.nombre}" quitada del perfil ${res.perfil}`, 'info');
      }
      // Confirmar con la respuesta del backend, no adivinar.
      setPermisos((prev) =>
        prev
          ? {
              ...prev,
              opciones: prev.opciones.map((o) =>
                o.id === permiso.id ? { ...o, asignado: res.asignado } : o,
              ),
            }
          : prev,
      );
      setQuitarPendiente(null);
      // Si afectó el menú del propio usuario, refrescar el sidebar.
      refrescarMenu();
      // Contadores de la tabla del catálogo: recarga para consistencia.
      void loadCatalogo();
    } catch (err) {
      // 409 (protegida a Superusuario): revertir el checkbox y avisar.
      const message = err instanceof Error ? err.message : 'Error al quitar la opción';
      pushToast(message, 'error');
      setQuitarPendiente(null);
    } finally {
      setBusyOpciones((prev) => {
        const next = new Set(prev);
        next.delete(permiso.id);
        return next;
      });
    }
  };

  const marcarOpcion = async (permiso: PermisoOpcionItem) => {
    if (!perfilIdSeleccionado) return;
    setBusyOpciones((prev) => new Set(prev).add(permiso.id));
    try {
      const res = await OptionService.asignarPermisoOpcion(Number(perfilIdSeleccionado), permiso.id);
      if (res.yaEstaba) {
        pushToast(`La opción "${permiso.nombre}" ya estaba asignada al perfil ${res.perfil}`, 'info');
      } else {
        pushToast(`Opción "${permiso.nombre}" asignada al perfil ${res.perfil}`, 'success');
      }
      // Confirmar con la respuesta del backend, no adivinar.
      setPermisos((prev) =>
        prev
          ? {
              ...prev,
              opciones: prev.opciones.map((o) =>
                o.id === permiso.id ? { ...o, asignado: res.asignado } : o,
              ),
            }
          : prev,
      );
      if (esPerfilPropio) refrescarMenu();
      void loadCatalogo();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar la opción';
      pushToast(message, 'error');
    } finally {
      setBusyOpciones((prev) => {
        const next = new Set(prev);
        next.delete(permiso.id);
        return next;
      });
    }
  };

  // Agrupar opciones del catálogo por subsistema (el backend ya ordena por orden).
  const gruposCatalogo = useMemo(() => {
    const mapa = new Map<string, OpcionAdminItem[]>();
    opciones.forEach((o) => {
      const lista = mapa.get(o.subsistema) ?? [];
      lista.push(o);
      mapa.set(o.subsistema, lista);
    });
    return mapa;
  }, [opciones]);

  const columnasCatalogo = (): TableColumn<OpcionAdminItem>[] => [
    {
      key: 'nombre',
      header: 'Opción',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-text">{row.nombre}</span>
          {row.protegida && (
            <Badge tone="warning">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Protegida
            </Badge>
          )}
        </div>
      ),
      sortValue: (row) => row.nombre,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (row) => <span className="text-text-secondary">{row.descripcion || '—'}</span>,
    },
    {
      key: 'orden',
      header: 'Orden',
      align: 'right',
      render: (row) => <span className="tabular-nums text-text">{row.orden}</span>,
      sortValue: (row) => row.orden,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.activo ? 'success' : 'neutral'} dot>
          {row.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
      sortValue: (row) => (row.activo ? '1' : '0'),
    },
    {
      key: 'perfiles',
      header: 'Perfiles',
      align: 'right',
      render: (row) => (
        <span
          className="tabular-nums text-text-secondary"
          title="Perfiles activos que ven esta opción en su menú"
        >
          {row.perfiles ?? 0}
        </span>
      ),
      sortValue: (row) => row.perfiles ?? 0,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        const busy = busyOpcionId === row.id;
        return (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => abrirEditar(row)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PencilLine className="h-3.5 w-3.5" />
              Editar
            </button>
            {row.activo ? (
              <button
                type="button"
                disabled={busy || row.protegida}
                onClick={() => setOpcionDesactivar(row)}
                title={row.protegida ? 'Esta opción es protegida y no se puede desactivar' : undefined}
                className="inline-flex items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PowerOff className="h-3.5 w-3.5" />
                Desactivar
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void ejecutarCambioEstado(row, true)}
                className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success transition hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Power className="h-3.5 w-3.5" />
                Activar
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (!esSuperusuario) {
    return (
      <div className="space-y-6">
        <PageHeader title="Opciones de menú" description="Acceso restringido." />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla es de uso exclusivo para el perfil <strong>Superusuario</strong>.
          </p>
        </div>
      </div>
    );
  }

  const subsistemaOptions = [
    { value: '', label: 'Selecciona un subsistema' },
    ...subsistemas.map((s) => ({
      value: String(s.id),
      label: `${s.nombre}${s.activo ? '' : ' (inactivo)'}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opciones de menú"
        description="Catálogo de opciones por subsistema y asignación de opciones a perfiles. El menú se actualiza en caliente: no hace falta reiniciar."
        actions={
          tab === 'catalogo' ? (
            <Button onClick={abrirCrear}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nueva opción
            </Button>
          ) : undefined
        }
      />

      {/* Aviso transversal */}
      <div className="flex items-start gap-2.5 rounded-xl border border-warning/35 bg-warning-soft p-4 text-xs leading-relaxed text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Ocultar una opción no quita el permiso del método:</strong> la visibilidad del menú
          y los permisos de ejecución se administran por separado. Los permisos de métodos se
          gestionan en la pantalla <strong>Permisos</strong>.
        </span>
      </div>

      <Tabs
        items={[
          { value: 'catalogo', label: 'Catálogo', icon: <ListTree className="h-4 w-4" /> },
          { value: 'asignar', label: 'Asignar a perfil', icon: <Layers className="h-4 w-4" /> },
        ]}
        value={tab}
        onChange={(val) => setTab(val as 'catalogo' | 'asignar')}
        layoutId="opciones-tabs"
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {tab === 'catalogo' ? (
          loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-text-muted">
              Cargando catálogo de opciones...
            </div>
          ) : opciones.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface-soft p-12 text-center">
              <ListTree className="mx-auto mb-3 h-10 w-10 text-text-muted" />
              <p className="text-base font-medium text-text">No hay opciones registradas</p>
              <p className="mt-1 text-xs text-text-muted">
                Crea la primera opción para empezar a armar el menú.
              </p>
            </div>
          ) : (
            Array.from(gruposCatalogo.entries()).map(([subsistema, lista]) => (
              <motion.section
                key={subsistema}
                variants={fadeUpItem}
                className="space-y-3 rounded-2xl border border-border bg-surface/50 p-4"
              >
                <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                  <Layers className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                    {subsistema}
                  </h3>
                  <span className="text-xs text-text-muted">
                    {lista.length} {lista.length === 1 ? 'opción' : 'opciones'}
                  </span>
                </div>
                <ResponsiveTable
                  columns={columnasCatalogo()}
                  rows={lista}
                  rowKey={(r) => String(r.id)}
                  caption={`Opciones del subsistema ${subsistema}`}
                  emptyMessage="Sin opciones en este subsistema."
                />
              </motion.section>
            ))
          )
        ) : (
          // Pestaña Asignar a perfil
          <motion.div variants={fadeUpItem} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface-soft p-5 lg:grid-cols-3">
              <div>
                <Select
                  name="perfilOpciones"
                  label="Perfil a configurar"
                  value={perfilIdSeleccionado}
                  onChange={(val) => setPerfilIdSeleccionado(val)}
                  options={perfiles.map((p) => ({
                    value: String(p.id),
                    label: `${p.nombre}${p.descripcion ? ` — ${p.descripcion}` : ''}`,
                  }))}
                  placeholder="Seleccionar perfil"
                />
              </div>
              <div className="lg:col-span-2 flex items-end">
                <p className="text-xs leading-relaxed text-text-secondary">
                  Cada cambio se guarda al instante al marcar o desmarcar.{' '}
                  {esPerfilSuperusuario && (
                    <>
                      Las opciones <strong>protegidas</strong> son obligatorias para{' '}
                      <strong>Superusuario</strong>.
                    </>
                  )}
                </p>
              </div>
            </div>

            {permisosLoading ? (
              <div className="flex h-48 items-center justify-center text-sm text-text-muted">
                Cargando opciones del perfil...
              </div>
            ) : !permisos ? (
              <div className="rounded-2xl border border-border bg-surface-soft p-12 text-center text-sm text-text-secondary">
                Selecciona un perfil para ver sus opciones.
              </div>
            ) : permisos.opciones.length === 0 ? (
              <div className="rounded-2xl border border-border bg-surface-soft p-12 text-center">
                <EyeOff className="mx-auto mb-3 h-10 w-10 text-text-muted" />
                <p className="text-base font-medium text-text">
                  No hay opciones activas para asignar
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Las opciones del menú se administran en la pestaña Catálogo.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/80 px-5 py-3.5">
                  <span className="text-sm font-medium text-text-secondary">
                    Perfil activo configurando:
                  </span>
                  <Badge tone="success">{permisos.perfil.nombre}</Badge>
                  <span className="text-xs tabular-nums text-text-muted">
                    {permisos.opciones.filter((o) => o.asignado).length} de{' '}
                    {permisos.opciones.length} opciones asignadas
                  </span>
                  {esPerfilPropio && (
                    <span className="inline-flex items-center gap-1 text-xs text-warning">
                      <Info className="h-3 w-3" />
                      Estás editando tu propio perfil: tu menú cambiará en caliente.
                    </span>
                  )}
                </div>

                {Array.from(
                  permisos.opciones.reduce((mapa, o) => {
                    const lista = mapa.get(o.subsistema) ?? [];
                    lista.push(o);
                    mapa.set(o.subsistema, lista);
                    return mapa;
                  }, new Map<string, PermisoOpcionItem[]>()),
                ).map(([subsistema, lista]) => (
                  <div
                    key={subsistema}
                    className="space-y-3 rounded-2xl border border-border bg-surface/50 p-4"
                  >
                    <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
                      <Layers className="h-4 w-4 text-accent" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                        {subsistema}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {lista
                        .slice()
                        .sort((a, b) => a.orden - b.orden)
                        .map((opcion) => {
                          const busy = busyOpciones.has(opcion.id);
                          // Quitar una protegida a Superusuario está bloqueado.
                          const obligatoriaSuperusuario =
                            esPerfilSuperusuario && opcion.protegida && opcion.asignado;
                          return (
                            <div
                              key={opcion.id}
                              className={cn(
                                'rounded-xl border px-4 py-3 transition-colors',
                                opcion.asignado
                                  ? 'border-accent/30 bg-accent/5'
                                  : 'border-border/80 bg-surface-soft/60',
                              )}
                            >
                              <Checkbox
                                name={`opcion-${permisos.perfil.id}-${opcion.id}`}
                                label={opcion.nombre}
                                description={
                                  obligatoriaSuperusuario
                                    ? 'Obligatoria para Superusuario'
                                    : opcion.descripcion ?? undefined
                                }
                                checked={opcion.asignado}
                                disabled={busy || obligatoriaSuperusuario}
                                onChange={(checked) => {
                                  if (checked) {
                                    void marcarOpcion(opcion);
                                  } else if (esPerfilPropio) {
                                    // Aviso antes de quitar una opción del propio perfil.
                                    pushToast(
                                      `Tu menú cambiará a partir de la siguiente petición: la opción "${opcion.nombre}" dejará de verse.`,
                                      'info',
                                    );
                                    setQuitarPendiente(opcion);
                                  } else {
                                    setQuitarPendiente(opcion);
                                  }
                                }}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Modal Crear / Editar Opción */}
      <Modal
        open={modal !== null}
        onClose={cerrarModal}
        title={modal === 'crear' ? 'Crear nueva opción de menú' : `Editar opción ${opcionEditando?.nombre ?? ''}`}
        description={
          modal === 'crear'
            ? 'La opción nace activa y sin perfiles asignados: se ve en el menú solo tras asignarla en la pestaña "Asignar a perfil".'
            : 'No se puede cambiar el subsistema de una opción: para moverla, crea una nueva en el subsistema destino y desactiva esta.'
        }
        size="md"
        footer={
          <>
            <button
              type="button"
              disabled={formBusy}
              onClick={cerrarModal}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button state={formBusy ? 'loading' : 'idle'} onClick={modal === 'crear' ? handleCrear : handleEditar}>
              {modal === 'crear' ? 'Crear opción' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <form onSubmit={modal === 'crear' ? handleCrear : handleEditar} className="space-y-4">
          {modal === 'crear' && (
            <Select
              name="subsistemaOpcion"
              label="Subsistema"
              value={subsistemaId}
              onChange={(val) => setSubsistemaId(val)}
              options={subsistemaOptions}
              placeholder="Selecciona un subsistema"
            />
          )}
          {modal === 'crear' && !subsistemaId && (
            <p className="-mt-2 text-xs text-text-muted">
              Elige el subsistema: los inactivos no admiten nuevas opciones.
            </p>
          )}

          <Input
            name="opcionNombre"
            label="Nombre de la opción"
            placeholder="Ej: Reportes"
            value={nombre}
            onChange={(val) => setNombre(val)}
            error={nombreError}
            disabled={modal === 'editar' && opcionEditando?.protegida}
            maxLength={80}
            required
          />
          {modal === 'editar' && opcionEditando?.protegida && (
            <p className="-mt-2 text-xs text-text-muted">
              La opción <strong>{opcionEditando?.nombre}</strong> es protegida y no se puede
              renombrar; la descripción y el orden sí se pueden cambiar.
            </p>
          )}

          <Input
            name="opcionDescripcion"
            label="Descripción (opcional)"
            placeholder="Ej: Reportes de nómina"
            value={descripcion}
            onChange={(val) => setDescripcion(val.slice(0, DESCRIPCION_MAX))}
            maxLength={DESCRIPCION_MAX}
          />
          <p className="-mt-2 text-right text-[11px] text-text-muted">
            {descripcion.length}/{DESCRIPCION_MAX} caracteres
          </p>

          <Input
            type="number"
            name="opcionOrden"
            label="Orden dentro del subsistema"
            placeholder="Ej: 5"
            value={orden}
            onChange={(val) => setOrden(val)}
            error={ordenError}
            min={ORDEN_MIN}
            max={ORDEN_MAX}
            step={1}
            required
          />
        </form>
      </Modal>

      {/* Modal Confirmar Desactivar Opción */}
      <Modal
        open={opcionDesactivar !== null}
        onClose={() => setOpcionDesactivar(null)}
        title={`¿Desactivar la opción "${opcionDesactivar?.nombre ?? ''}"?`}
        description="La opción deja de verse en el menú de todos los perfiles que la tienen asignada. Los permisos de método no se ven afectados."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={busyOpcionId === opcionDesactivar?.id}
              onClick={() => setOpcionDesactivar(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button
              state={busyOpcionId === opcionDesactivar?.id ? 'loading' : 'idle'}
              className="border-error/40 bg-error text-white hover:bg-error/90"
              onClick={() => {
                if (opcionDesactivar) void ejecutarCambioEstado(opcionDesactivar, false);
              }}
            >
              Sí, desactivar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {(opcionDesactivar?.perfiles ?? 0) > 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/35 bg-warning-soft p-3 text-xs text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>{opcionDesactivar?.perfiles}</strong>{' '}
                {(opcionDesactivar?.perfiles ?? 0) === 1 ? 'perfil activo dejará' : 'perfiles activos dejarán'}{' '}
                de ver esta opción en su menú.
              </span>
            </div>
          )}
          <p className="text-sm leading-relaxed text-text-secondary">
            No hay borrado físico: al reactivar la opción, los perfiles que la tenían asignada la
            volverán a ver.
          </p>
        </div>
      </Modal>

      {/* Modal Confirmar Quitar Opción a un Perfil */}
      <Modal
        open={quitarPendiente !== null}
        onClose={() => setQuitarPendiente(null)}
        title={`¿Quitar "${quitarPendiente?.nombre ?? ''}" del perfil ${permisos?.perfil.nombre ?? ''}?`}
        description="El perfil dejará de ver esta opción en su menú. El permiso del método asociado, si lo tiene, se mantiene."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={quitarPendiente ? busyOpciones.has(quitarPendiente.id) : false}
              onClick={() => setQuitarPendiente(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button
              state={quitarPendiente ? (busyOpciones.has(quitarPendiente.id) ? 'loading' : 'idle') : 'idle'}
              onClick={() => {
                if (quitarPendiente) void ejecutarQuitar(quitarPendiente);
              }}
            >
              Sí, quitar
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-text-secondary">
          Recuerda: ocultar la opción <strong>no revoca</strong> el permiso del método; eso se
          administra en la pantalla de <strong>Permisos</strong>.
        </p>
      </Modal>
    </div>
  );
}
