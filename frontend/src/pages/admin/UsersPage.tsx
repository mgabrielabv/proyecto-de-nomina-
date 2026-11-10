import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldAlert, UserCog, UserPlus } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { useSessionStore, useToastStore } from '../../store';
import {
  ProfileAdminService,
  type PerfilAdminItem,
  type PerfilAsignado,
  type PerfilesUsuarioResult,
} from '../../features/admin/services/profileAdminService';
import type { PersonaItem } from '../../features/payroll/services';
import { ROUTES } from '../../constants';
import { hasAnyProfile, hasProfile } from '../../utils';

// Perfiles que sostienen la administración: si el solicitante no es
// Superusuario no se le ofrecen en el selector.
const PERFILES_SENSIBLES = ['Superusuario', 'Administrador', 'GerenteRRHH'];
// Perfil anónimo: no se ofrece desde la UI.
const PERFIL_EXCLUIDO = 'Publico';

export function UsersPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);
  const navigate = useNavigate();

  const puedeVer = hasAnyProfile(user, ['Superusuario', 'Administrador', 'GerenteRRHH']);
  const esSuperusuario = hasProfile(user, 'Superusuario');
  const puedeListarPerfiles = hasAnyProfile(user, ['Superusuario', 'Administrador']);

  const [personas, setPersonas] = useState<PersonaItem[]>([]);
  const [perfilesPorUsuario, setPerfilesPorUsuario] = useState<Record<string, PerfilAsignado[]>>({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modal de gestión de perfiles
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<PersonaItem | null>(null);
  const [perfilesActuales, setPerfilesActuales] = useState<PerfilesUsuarioResult | null>(null);
  const [perfilesCatalogo, setPerfilesCatalogo] = useState<PerfilAdminItem[]>([]);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);
  const [confirmarGuardar, setConfirmarGuardar] = useState(false);

  useEffect(() => {
    if (!puedeVer) {
      setLoading(false);
      return;
    }
    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const personasList = await ProfileAdminService.listarPersonas();
        if (!active) return;
        // UsersPage administra usuarios: se excluyen las personas sin usuario.
        const conUsuario = (personasList ?? []).filter((p) => Boolean(p.usuario_id));
        setPersonas(conUsuario);

        // Perfiles actuales por usuario (solo si la sesión puede listarlos).
        if (puedeListarPerfiles && conUsuario.length > 0) {
          const resultados = await Promise.allSettled(
            conUsuario.map((p) => ProfileAdminService.listarPerfilesUsuario(p.usuario_id as string)),
          );
          if (!active) return;
          const mapa: Record<string, PerfilAsignado[]> = {};
          resultados.forEach((resultado, index) => {
            const usuarioId = conUsuario[index].usuario_id;
            if (resultado.status === 'fulfilled' && usuarioId) {
              mapa[usuarioId] = resultado.value.perfiles ?? [];
            }
          });
          setPerfilesPorUsuario(mapa);
        }
      } catch (err) {
        pushToast(err instanceof Error ? err.message : 'Error al cargar usuarios', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeVer, puedeListarPerfiles]);

  const personasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter((p) => {
      const nombreCompleto = `${p.primer_nombre} ${p.segundo_nombre ?? ''} ${p.primer_apellido} ${p.segundo_apellido ?? ''}`.toLowerCase();
      return (
        p.cedula.toLowerCase().includes(q) ||
        nombreCompleto.includes(q) ||
        (p.username ?? '').toLowerCase().includes(q)
      );
    });
  }, [personas, busqueda]);

  const abrirPerfiles = async (persona: PersonaItem) => {
    setUsuarioSeleccionado(persona);
    setPerfilesActuales(null);
    setModalAbierto(true);
    setModalLoading(true);
    try {
      // Estado actual del usuario y catálogo para armar el selector.
      const [actuales, catalogo] = await Promise.all([
        ProfileAdminService.listarPerfilesUsuario(persona.usuario_id as string),
        perfilesCatalogo.length > 0
          ? Promise.resolve(perfilesCatalogo)
          : ProfileAdminService.listarPerfiles(),
      ]);
      setPerfilesActuales(actuales);
      setPerfilesCatalogo(catalogo);
      setSeleccion(new Set(actuales.perfiles.map((p) => p.id)));
    } catch (err) {
      pushToast(err instanceof Error ? err.message : 'Error al cargar los perfiles del usuario', 'error');
      setModalAbierto(false);
    } finally {
      setModalLoading(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setConfirmarGuardar(false);
    setUsuarioSeleccionado(null);
    setPerfilesActuales(null);
    setSeleccion(new Set());
  };

  const togglePerfil = (perfilId: number) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(perfilId)) next.delete(perfilId);
      else next.add(perfilId);
      return next;
    });
  };

  // Resumen de cambios para la confirmación
  const resumenCambios = useMemo(() => {
    if (!perfilesActuales) return { agregados: [] as string[], quitados: [] as string[] };
    const nombresPorId = new Map<number, string>([
      ...perfilesCatalogo.map((p) => [p.id, p.nombre] as [number, string]),
      ...perfilesActuales.perfiles.map((p) => [p.id, p.nombre] as [number, string]),
    ]);
    const idsActuales = new Set(perfilesActuales.perfiles.map((p) => p.id));
    const agregados = [...seleccion].filter((id) => !idsActuales.has(id)).map((id) => nombresPorId.get(id) ?? String(id));
    const quitados = perfilesActuales.perfiles.filter((p) => !seleccion.has(p.id)).map((p) => p.nombre);
    return { agregados, quitados };
  }, [perfilesActuales, perfilesCatalogo, seleccion]);

  // ¿El usuario editado es la propia sesión?
  const esPropioUsuario = Boolean(
    usuarioSeleccionado?.usuario_id && usuarioSeleccionado.usuario_id === user?.id,
  );
  const quitandoPerfilPropio =
    esPropioUsuario &&
    user?.profiles?.some((p) => perfilesActuales?.perfiles.some((x) => x.id === p.id) && !seleccion.has(p.id)) === true;

  const guardarPerfiles = async () => {
    if (!usuarioSeleccionado?.usuario_id) return;
    setModalBusy(true);
    try {
      // Reemplazo del conjunto completo: lo que no va, se quita.
      const resultado = await ProfileAdminService.establecerPerfilesUsuario(
        usuarioSeleccionado.usuario_id,
        [...seleccion],
      );
      pushToast(
        `Perfiles de "${resultado.username}" actualizados: ${resultado.perfiles.map((p) => p.nombre).join(', ')}`,
        'success',
      );
      setConfirmarGuardar(false);

      // Recargar desde el servidor
      setPerfilesActuales(resultado);
      setSeleccion(new Set(resultado.perfiles.map((p) => p.id)));
      setPerfilesPorUsuario((prev) => ({
        ...prev,
        [usuarioSeleccionado.usuario_id as string]: resultado.perfiles,
      }));
    } catch (err) {
      // 403/409: revertir al estado del servidor y mostrar el mensaje.
      const message = err instanceof Error ? err.message : 'Error al guardar los perfiles';
      pushToast(message, 'error');
      try {
        const actuales = await ProfileAdminService.listarPerfilesUsuario(
          usuarioSeleccionado.usuario_id,
        );
        setPerfilesActuales(actuales);
        setSeleccion(new Set(actuales.perfiles.map((p) => p.id)));
        setPerfilesPorUsuario((prev) => ({
          ...prev,
          [usuarioSeleccionado.usuario_id as string]: actuales.perfiles,
        }));
      } catch {
        setConfirmarGuardar(false);
        cerrarModal();
      }
      setConfirmarGuardar(false);
    } finally {
      setModalBusy(false);
    }
  };

  const columns: TableColumn<PersonaItem>[] = [
    {
      key: 'persona',
      header: 'Persona',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            {row.primer_nombre} {row.primer_apellido}
            {row.segundo_apellido ? ` ${row.segundo_apellido}` : ''}
          </p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
      sortValue: (row) => `${row.primer_apellido} ${row.primer_nombre}`,
    },
    {
      key: 'username',
      header: 'Usuario',
      render: (row) => (
        <span className="font-mono text-xs font-medium text-text">{row.username || '—'}</span>
      ),
      sortValue: (row) => row.username ?? '',
    },
    {
      key: 'cargo',
      header: 'Cargo',
      render: (row) => <span className="text-text-secondary">{row.cargo || '—'}</span>,
      sortValue: (row) => row.cargo ?? '',
    },
    {
      key: 'contrato',
      header: 'Contrato',
      render: (row) =>
        row.contrato_id ? (
          <div>
            <p className="text-xs text-text-secondary">
              {row.tipo_pago === 'POR_HORA' ? 'Por hora' : row.tipo_pago === 'SALARIO_FIJO' ? 'Salario fijo' : '—'}
              {row.frecuencia_pago ? ` · ${row.frecuencia_pago.toLowerCase()}` : ''}
            </p>
            {row.contrato_estado && (
              <Badge tone={row.contrato_estado === 'VIGENTE' ? 'success' : 'neutral'}>
                {row.contrato_estado}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-text-muted">Sin contrato</span>
        ),
      sortValue: (row) => row.contrato_estado ?? '',
    },
    {
      key: 'usuario_activo',
      header: 'Usuario activo',
      render: (row) =>
        row.usuario_activo == null ? (
          <span className="text-xs text-text-muted">—</span>
        ) : (
          <Badge tone={row.usuario_activo ? 'success' : 'error'} dot>
            {row.usuario_activo ? 'Activo' : 'Inactivo'}
          </Badge>
        ),
      sortValue: (row) => (row.usuario_activo ? '1' : '0'),
    },
    {
      key: 'perfiles',
      header: 'Perfiles actuales',
      render: (row) => {
        if (!puedeListarPerfiles) return <span className="text-xs text-text-muted">—</span>;
        const perfiles = perfilesPorUsuario[row.usuario_id ?? ''] ?? [];
        if (perfiles.length === 0) return <span className="text-xs text-text-muted">Sin perfiles</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {perfiles.map((p) => (
              <Badge key={p.id} tone={p.activo === false ? 'warning' : 'neutral'}>
                {p.nombre}
                {p.activo === false ? ' (inactivo)' : ''}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        if (!puedeListarPerfiles) return <span className="text-xs text-text-muted">Sin acciones</span>;
        return (
          <button
            type="button"
            onClick={() => void abrirPerfiles(row)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-3 py-1.5 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface"
          >
            <UserCog className="h-3.5 w-3.5" />
            {esSuperusuario ? 'Gestionar perfiles' : 'Ver perfiles'}
          </button>
        );
      },
    },
  ];

  if (!puedeVer) {
    return (
      <div className="space-y-6">
        <PageHeader title="Usuarios" description="Acceso restringido." />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla requiere los perfiles <strong>Superusuario</strong>,{' '}
            <strong>Administrador</strong> o <strong>GerenteRRHH</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios y perfiles"
        description={
          esSuperusuario
            ? 'Consulta las personas con usuario del sistema y reemplaza el conjunto completo de perfiles de cada una.'
            : puedeListarPerfiles
              ? 'Consulta las personas con usuario y sus perfiles. Solo Superusuario puede modificar la asignación.'
              : 'Consulta las personas registradas con usuario. Para dar de alta a una persona usa "Registrar persona".'
        }
        actions={
          <Button onClick={() => navigate(ROUTES.adminRegistration)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Registrar persona
          </Button>
        }
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div variants={fadeUpItem}>
          <div className="max-w-md">
            <Input
              name="buscarUsuario"
              label="Buscar usuario"
              placeholder="Cédula, nombre o username..."
              value={busqueda}
              onChange={(val) => setBusqueda(val)}
              trailing={<Search className="h-4 w-4 text-text-muted" />}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={personasFiltradas}
            rowKey={(r) => r.id}
            caption="Personas con usuario registrado"
            loading={loading}
            emptyMessage={
              personas.length === 0
                ? 'No hay personas con usuario registrado.'
                : 'Ningún usuario coincide con la búsqueda.'
            }
          />
        </motion.div>
      </motion.div>

      {/* Modal Gestionar Perfiles de Usuario */}
      <Modal
        open={modalAbierto}
        onClose={cerrarModal}
        title={`Perfiles de ${usuarioSeleccionado?.username ?? ''}`}
        description={
          esSuperusuario
            ? 'La asignación reemplaza el conjunto completo: lo que no quede marcado se quita al guardar.'
            : 'Vista de solo lectura: solo Superusuario puede modificar la asignación de perfiles.'
        }
        size="md"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-text-muted">
              {seleccion.size} {seleccion.size === 1 ? 'perfil seleccionado' : 'perfiles seleccionados'}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={cerrarModal}
                className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
              >
                Cerrar
              </button>
              {esSuperusuario && (
                <Button
                  state={modalBusy ? 'loading' : 'idle'}
                  disabled={seleccion.size === 0}
                  onClick={() => setConfirmarGuardar(true)}
                >
                  Guardar perfiles
                </Button>
              )}
            </div>
          </div>
        }
      >
        {modalLoading ? (
          <div className="flex h-40 items-center justify-center text-sm text-text-muted">
            Cargando perfiles del usuario...
          </div>
        ) : perfilesActuales ? (
          <div className="space-y-4">
            {!esSuperusuario && (
              <div className="rounded-xl border border-border bg-surface-soft p-3 text-xs text-text-secondary">
                Tu sesión solo puede consultar. Para modificar la asignación se requiere el perfil{' '}
                <strong className="text-text">Superusuario</strong>.
              </div>
            )}

            {perfilesCatalogo
              .filter((p) => p.nombre !== PERFIL_EXCLUIDO)
              .map((perfil) => {
                const asignadoActual = perfilesActuales.perfiles.some((p) => p.id === perfil.id);
                const checked = seleccion.has(perfil.id);
                // Perfiles de administración: solo Superusuario puede marcarlos.
                const sensibleBloqueado = PERFILES_SENSIBLES.includes(perfil.nombre) && !esSuperusuario;
                const disabled = !esSuperusuario || !perfil.activo || sensibleBloqueado;

                let descripcionExtra = perfil.descripcion ?? undefined;
                let nota: string | null = null;
                if (!perfil.activo && asignadoActual) {
                  nota = 'Perfil inactivo: reactívalo en Perfiles';
                } else if (sensibleBloqueado) {
                  nota = 'Requiere Superusuario para asignarlo';
                }

                return (
                  <div
                    key={perfil.id}
                    className="rounded-xl border border-border/80 bg-surface-soft/60 px-4 py-3"
                  >
                    <Checkbox
                      name={`perfil-${perfil.id}`}
                      label={perfil.nombre}
                      description={nota ?? descripcionExtra ?? undefined}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => togglePerfil(perfil.id)}
                    />
                  </div>
                );
              })}

            {/* Perfiles asignados que ya no están en el catálogo (inactivos) */}
            {perfilesActuales.perfiles
              .filter(
                (p) =>
                  !perfilesCatalogo.some((c) => c.id === p.id) && p.nombre !== PERFIL_EXCLUIDO,
              )
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-border/80 bg-surface-soft/60 px-4 py-3"
                >
                  <Checkbox
                    name={`perfil-extra-${p.id}`}
                    label={p.nombre}
                    description="Perfil inactivo: reactívalo en Perfiles"
                    checked
                    disabled
                    onChange={() => undefined}
                  />
                </div>
              ))}

            {esSuperusuario && seleccion.size === 0 && (
              <p className="text-xs text-error">
                El conjunto de perfiles no puede quedar vacío: todo usuario necesita al menos un perfil.
              </p>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal Confirmar Guardado */}
      <Modal
        open={confirmarGuardar}
        onClose={() => setConfirmarGuardar(false)}
        title={`¿Guardar los perfiles de ${usuarioSeleccionado?.username ?? ''}?`}
        description="Se reemplazará el conjunto completo de perfiles del usuario."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={modalBusy}
              onClick={() => setConfirmarGuardar(false)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button state={modalBusy ? 'loading' : 'idle'} onClick={guardarPerfiles}>
              Confirmar cambios
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2 text-sm">
            {resumenCambios.agregados.length > 0 && (
              <p className="text-text-secondary">
                Se agregan:{' '}
                <strong className="text-success">
                  {resumenCambios.agregados.join(', ')}
                </strong>
              </p>
            )}
            {resumenCambios.quitados.length > 0 && (
              <p className="text-text-secondary">
                Se quitan:{' '}
                <strong className="text-error">{resumenCambios.quitados.join(', ')}</strong>
              </p>
            )}
            {resumenCambios.agregados.length === 0 && resumenCambios.quitados.length === 0 && (
              <p className="text-text-secondary">No hay cambios respecto al estado actual.</p>
            )}
          </div>

          {quitandoPerfilPropio && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/35 bg-warning-soft p-3 text-xs text-warning">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Atención:</strong> este usuario es tu propia sesión. Si quitas uno de tus
                perfiles, tu menú y permisos cambiarán a partir de la siguiente petición.
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
