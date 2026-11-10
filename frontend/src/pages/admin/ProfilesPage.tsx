import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  PencilLine,
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
import { useSessionStore, useToastStore } from '../../store';
import {
  ProfileAdminService,
  type PerfilAdminItem,
} from '../../features/admin/services/profileAdminService';
import { hasAnyProfile, hasProfile } from '../../utils';
import { cn } from '../../utils/cn';

// Misma regla del backend: 3–50 caracteres alfanuméricos, empieza por letra.
const PERFIL_NOMBRE_REGEX = /^[A-Za-z][A-Za-z0-9]{2,49}$/;
const DESCRIPCION_MAX = 200;

export function ProfilesPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);

  // Guardas por nombre de perfil: Administrador lista, solo Superusuario muta.
  const puedeListar = hasAnyProfile(user, ['Superusuario', 'Administrador']);
  const esSuperusuario = hasProfile(user, 'Superusuario');

  const [perfiles, setPerfiles] = useState<PerfilAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [modal, setModal] = useState<'crear' | 'editar' | null>(null);
  const [perfilEditando, setPerfilEditando] = useState<PerfilAdminItem | null>(null);
  const [perfilEstadoPendiente, setPerfilEstadoPendiente] = useState<PerfilAdminItem | null>(null);

  // Formulario crear/editar
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [plantillaId, setPlantillaId] = useState('');
  const [nombreError, setNombreError] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  // Estado en vuelo de activar/desactivar
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadPerfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ProfileAdminService.listarPerfiles();
      setPerfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar perfiles';
      setError(message);
      pushToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!puedeListar) {
      setLoading(false);
      return;
    }
    void loadPerfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeListar]);

  const abrirCrear = () => {
    setNombre('');
    setDescripcion('');
    setPlantillaId('');
    setNombreError(null);
    setModal('crear');
  };

  const abrirEditar = (perfil: PerfilAdminItem) => {
    setPerfilEditando(perfil);
    setNombre(perfil.nombre);
    setDescripcion(perfil.descripcion ?? '');
    setNombreError(null);
    setModal('editar');
  };

  const cerrarModal = () => {
    setModal(null);
    setPerfilEditando(null);
    setNombreError(null);
  };

  const validarNombre = (): string | null => {
    if (!nombre.trim()) return 'El nombre del perfil es obligatorio';
    if (!PERFIL_NOMBRE_REGEX.test(nombre.trim())) {
      return 'El nombre debe tener entre 3 y 50 caracteres alfanuméricos y empezar por una letra (sin espacios ni acentos)';
    }
    return null;
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validarNombre();
    setNombreError(error);
    // La validación documentada da feedback inmediato; los 400/409 del backend
    // (p. ej. nombre repetido) se muestran en el mismo campo.
    if (error) return;

    setFormBusy(true);
    try {
      const resultado = await ProfileAdminService.crearPerfil(
        nombre.trim(),
        descripcion.trim() ? descripcion.trim() : null,
        plantillaId ? Number(plantillaId) : null,
      );

      let detalle = `Perfil "${resultado.nombre}" creado con ${resultado.permisosBase} permisos base de sesión.`;
      if (typeof resultado.permisosMetodo === 'number' || typeof resultado.permisosOpcion === 'number') {
        detalle += ` Se copiaron ${resultado.permisosMetodo ?? 0} permisos de método y ${resultado.permisosOpcion ?? 0} opciones de menú de la plantilla.`;
      } else {
        detalle += ' El perfil nace sin opciones de menú; asígnalas en Opciones.';
      }
      pushToast(detalle, 'success');

      cerrarModal();
      await loadPerfiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear el perfil';
      setNombreError(message);
      pushToast(message, 'error');
    } finally {
      setFormBusy(false);
    }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilEditando) return;

    // Superusuario no se puede renombrar: el nombre va deshabilitado y no cambia.
    const error = perfilEditando.protegido ? null : validarNombre();
    setNombreError(error);
    if (error) return;

    setFormBusy(true);
    try {
      await ProfileAdminService.editarPerfil(
        perfilEditando.id,
        perfilEditando.protegido ? perfilEditando.nombre : nombre.trim(),
        descripcion.trim() ? descripcion.trim() : null,
      );
      pushToast('Perfil actualizado', 'success');
      cerrarModal();
      await loadPerfiles();
    } catch (err) {
      // 409 (nombre repetido / Superusuario protegido): junto al campo nombre.
      const message = err instanceof Error ? err.message : 'Error al editar el perfil';
      setNombreError(message);
      pushToast(message, 'error');
    } finally {
      setFormBusy(false);
    }
  };

  const confirmarDesactivar = (perfil: PerfilAdminItem) => {
    setPerfilEstadoPendiente(perfil);
  };

  const ejecutarCambioEstado = async (perfil: PerfilAdminItem, activo: boolean) => {
    setBusyId(perfil.id);
    try {
      const resultado = await ProfileAdminService.cambiarEstadoPerfil(perfil.id, activo);
      if (!resultado.cambio) {
        pushToast(`El perfil "${perfil.nombre}" ya estaba ${activo ? 'activo' : 'inactivo'}`, 'info');
      } else {
        pushToast(`Perfil "${perfil.nombre}" ${activo ? 'reactivado' : 'desactivado'}`, 'success');
      }
      setPerfilEstadoPendiente(null);
      await loadPerfiles();
    } catch (err) {
      // 409 (p. ej. desactivar Superusuario): mensaje del backend tal cual.
      const message = err instanceof Error ? err.message : 'Error al cambiar el estado del perfil';
      pushToast(message, 'error');
      setPerfilEstadoPendiente(null);
    } finally {
      setBusyId(null);
    }
  };

  // Perfiles activos como plantilla al crear
  const plantillaOptions = [
    { value: '', label: 'Ninguna (solo permisos base de sesión)' },
    ...perfiles
      .filter((p) => p.activo)
      .map((p) => ({ value: String(p.id), label: `${p.nombre}${p.descripcion ? ` — ${p.descripcion}` : ''}` })),
  ];

  const columns: TableColumn<PerfilAdminItem>[] = [
    {
      key: 'nombre',
      header: 'Perfil',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-text">{row.nombre}</span>
          {row.protegido && (
            <Badge tone="warning">
              <ShieldCheck className="mr-1 h-3 w-3" />
              Protegido
            </Badge>
          )}
        </div>
      ),
      sortValue: (row) => row.nombre,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (row) => (
        <span className="text-text-secondary">{row.descripcion || '—'}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.activo ? 'success' : 'neutral'} dot>
          {row.activo ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
      sortValue: (row) => (row.activo ? '1' : '0'),
    },
    {
      key: 'uso',
      header: 'Uso',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-text-secondary" title="Usuarios activos sobre el total de usuarios asignados">
          {row.usuariosActivos} de {row.usuarios}{' '}
          <span className="text-xs text-text-muted">usuarios</span>
        </span>
      ),
      sortValue: (row) => row.usuarios,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => {
        if (!esSuperusuario) {
          return <span className="text-xs text-text-muted">Solo lectura</span>;
        }
        const busy = busyId === row.id;
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
                disabled={busy || row.protegido}
                onClick={() => confirmarDesactivar(row)}
                title={row.protegido ? 'El perfil Superusuario no se puede desactivar' : undefined}
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

  if (!puedeListar) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Perfiles"
          description="Acceso restringido a administradores del sistema."
        />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla requiere el perfil <strong>Superusuario</strong> o{' '}
            <strong>Administrador</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfiles del sistema"
        description="Catálogo de perfiles y su uso. No hay borrado físico: desactivar un perfil conserva sus asignaciones y permisos para una futura reactivación."
        actions={
          esSuperusuario ? (
            <Button onClick={abrirCrear}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo perfil
            </Button>
          ) : undefined
        }
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        {!esSuperusuario && (
          <motion.div variants={fadeUpItem} className="rounded-xl border border-border bg-surface-soft px-5 py-3 text-xs text-text-secondary">
            Tu sesión tiene el perfil <strong className="text-text">Administrador</strong>: puedes
            consultar el catálogo, pero solo <strong className="text-text">Superusuario</strong> puede
            crear, editar o cambiar el estado de los perfiles.
          </motion.div>
        )}

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={perfiles}
            rowKey={(r) => String(r.id)}
            caption="Catálogo de perfiles del sistema"
            loading={loading}
            emptyMessage={error ?? 'No hay perfiles registrados.'}
          />
        </motion.div>
      </motion.div>

      {/* Modal Crear / Editar Perfil */}
      <Modal
        open={modal !== null}
        onClose={cerrarModal}
        title={modal === 'crear' ? 'Crear nuevo perfil' : `Editar perfil ${perfilEditando?.nombre ?? ''}`}
        description={
          modal === 'crear'
            ? 'El perfil nace con los 6 permisos base de sesión (logout, getSession, sessionExist, refresh, getOptions y cambiarClave).'
            : 'El nombre y la descripción se guardan al confirmar; los permisos y usuarios asignados no se ven afectados.'
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
              {modal === 'crear' ? 'Crear perfil' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <form onSubmit={modal === 'crear' ? handleCrear : handleEditar} className="space-y-4">
          <Input
            name="perfilNombre"
            label="Nombre del perfil"
            placeholder="Ej: Contador"
            value={nombre}
            onChange={(val) => setNombre(val)}
            error={nombreError}
            disabled={modal === 'editar' && perfilEditando?.protegido}
            maxLength={50}
            required
          />
          {modal === 'editar' && perfilEditando?.protegido && (
            <p className="-mt-2 text-xs text-text-muted">
              El perfil <strong>{perfilEditando?.nombre}</strong> no se puede renombrar; la
              descripción sí se puede cambiar.
            </p>
          )}

          <Input
            name="perfilDescripcion"
            label="Descripción (opcional)"
            placeholder="Ej: Nómina y reportes"
            value={descripcion}
            onChange={(val) => setDescripcion(val.slice(0, DESCRIPCION_MAX))}
            maxLength={DESCRIPCION_MAX}
          />
          <p className="-mt-2 text-right text-[11px] text-text-muted">
            {descripcion.length}/{DESCRIPCION_MAX} caracteres
          </p>

          {modal === 'crear' && (
            <>
              <Select
                name="perfilPlantilla"
                label="Copiar permisos de"
                value={plantillaId}
                onChange={(val) => setPlantillaId(val)}
                options={plantillaOptions}
              />
              {!plantillaId && (
                <div className="rounded-xl border border-border bg-surface-soft p-3 text-xs leading-relaxed text-text-secondary">
                  Sin plantilla, el perfil nace <strong>solo con los permisos base de sesión y sin
                  opciones de menú</strong>: los usuarios con ese perfil podrán iniciar sesión, pero
                  no verán ninguna opción hasta que se las asignes en la pantalla{' '}
                  <strong>Opciones</strong>.
                </div>
              )}
            </>
          )}
        </form>
      </Modal>

      {/* Modal Confirmar Desactivación */}
      <Modal
        open={perfilEstadoPendiente !== null}
        onClose={() => setPerfilEstadoPendiente(null)}
        title={`¿Desactivar el perfil "${perfilEstadoPendiente?.nombre ?? ''}"?`}
        description="El perfil deja de estar disponible: los usuarios que lo tengan pierden sus permisos y opciones de menú hasta que se reactive. Las asignaciones se conservan."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={busyId === perfilEstadoPendiente?.id}
              onClick={() => setPerfilEstadoPendiente(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <Button
              state={busyId === perfilEstadoPendiente?.id ? 'loading' : 'idle'}
              className="border-error/40 bg-error text-white hover:bg-error/90"
              onClick={() => {
                if (perfilEstadoPendiente) void ejecutarCambioEstado(perfilEstadoPendiente, false);
              }}
            >
              Sí, desactivar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {(perfilEstadoPendiente?.usuariosActivos ?? 0) > 0 && (
            <div className={cn('flex items-start gap-2.5 rounded-xl border border-warning/35 bg-warning-soft p-3 text-xs text-warning')}>
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>{perfilEstadoPendiente?.usuariosActivos}</strong>{' '}
                {perfilEstadoPendiente?.usuariosActivos === 1 ? 'usuario activo tiene' : 'usuarios activos tienen'}{' '}
                este perfil y {perfilEstadoPendiente?.usuariosActivos === 1 ? 'perderá' : 'perderán'} sus
                permisos y menú asociados hasta reactivarlo.
              </span>
            </div>
          )}
          <p className="text-sm leading-relaxed text-text-secondary">
            No hay borrado físico: al reactivar el perfil, sus permisos y usuarios asignados se
            recuperan tal como estaban.
          </p>
        </div>
      </Modal>
    </div>
  );
}
