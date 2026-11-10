import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  RotateCw,
  AlertTriangle,
  Lock,
  Layers,
  Filter,
} from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';

import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useSessionStore, useToastStore } from '../../store';
import {
  PermissionService,
  type PermisoMetodoItem,
} from '../../features/admin/services/permissionService';
import type { PerfilItem } from '../../features/payroll/services';
import { hasProfile } from '../../utils';
import { cn } from '../../utils';

export function PermissionsPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((state) => state.push);

  // Comprobar si la sesión actual tiene el perfil "Superusuario"
  const isSuperuser = useMemo(() => {
    return hasProfile(user, 'Superusuario');
  }, [user]);

  const [perfiles, setPerfiles] = useState<PerfilItem[]>([]);
  const [selectedPerfilId, setSelectedPerfilId] = useState<number | null>(null);
  const [metodos, setMetodos] = useState<PermisoMetodoItem[]>([]);

  const [loadingPerfiles, setLoadingPerfiles] = useState(true);
  const [loadingMetodos, setLoadingMetodos] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  // Buscador
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de confirmación para revocar permiso
  const [pendingRevokeMethod, setPendingRevokeMethod] = useState<PermisoMetodoItem | null>(null);

  // Perfil seleccionado actualmente
  const selectedPerfil = useMemo(() => {
    return perfiles.find((p) => p.id === selectedPerfilId) ?? null;
  }, [perfiles, selectedPerfilId]);

  const isSelectedProfileSuperuser = useMemo(() => {
    return selectedPerfil?.nombre === 'Superusuario';
  }, [selectedPerfil]);

  // Si el perfil que se está editando es el perfil activo o pertenece a la sesión del usuario actual
  const isEditingOwnProfile = useMemo(() => {
    if (!selectedPerfilId || !user?.profiles) return false;
    return user.profiles.some((p) => p.id === selectedPerfilId);
  }, [selectedPerfilId, user]);

  // Cargar lista de perfiles al montar (solo si es Superusuario)
  useEffect(() => {
    if (!isSuperuser) {
      setLoadingPerfiles(false);
      return;
    }

    let active = true;
    void (async () => {
      setLoadingPerfiles(true);
      try {
        const perfilesList = await PermissionService.listarPerfiles();
        if (!active) return;
        const validList = Array.isArray(perfilesList) ? perfilesList : [];
        setPerfiles(validList);
        if (validList.length > 0) {
          setSelectedPerfilId(validList[0].id);
        }
      } catch (err: any) {
        pushToast(err?.message ?? 'Error al cargar perfiles', 'error');
      } finally {
        if (active) setLoadingPerfiles(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isSuperuser, pushToast]);

  // Cargar catálogo de métodos y permisos cada vez que cambia el perfil seleccionado
  const loadPermisos = async (perfilId: number) => {
    setLoadingMetodos(true);
    setMetodos([]); // descartar estado anterior
    try {
      const res = await PermissionService.listarPermisosMetodo(perfilId);
      setMetodos(res.metodos ?? []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar permisos del perfil', 'error');
      if (err?.status === 404) {
        // Recargar la lista de perfiles si el perfil no existe
        const perfilesList = await PermissionService.listarPerfiles();
        setPerfiles(perfilesList ?? []);
      }
    } finally {
      setLoadingMetodos(false);
    }
  };

  useEffect(() => {
    if (selectedPerfilId) {
      void loadPermisos(selectedPerfilId);
    }
  }, [selectedPerfilId]);

  // Manejar el clic en un interruptor
  const handleToggle = (metodo: PermisoMetodoItem) => {
    if (!selectedPerfilId) return;

    // Si es superusuario y es crítico, no se permite desmarcar
    if (isSelectedProfileSuperuser && metodo.critico && metodo.asignado) {
      return;
    }

    if (metodo.asignado) {
      // Quitar permiso exige confirmación previa
      setPendingRevokeMethod(metodo);
    } else {
      // Asignar permiso es en caliente sin confirmación
      void executeAssign(metodo);
    }
  };

  // Asignar permiso (marcar)
  const executeAssign = async (metodo: PermisoMetodoItem) => {
    if (!selectedPerfilId) return;
    setBusyIds((prev) => new Set(prev).add(metodo.id));

    try {
      const res = await PermissionService.asignarPermisoMetodo(selectedPerfilId, metodo.id);
      // Confirmar con lo que devuelve el backend
      setMetodos((prev) =>
        prev.map((m) => (m.id === metodo.id ? { ...m, asignado: res.asignado } : m)),
      );
      pushToast(`Permiso asignado: ${metodo.clase}.${metodo.metodo}`, 'success');
    } catch (err: any) {
      // Revertir y mostrar mensaje del backend
      pushToast(err?.message ?? 'Error al asignar permiso', 'error');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(metodo.id);
        return next;
      });
    }
  };

  // Quitar permiso (desmarcar tras confirmación)
  const executeRevoke = async () => {
    if (!selectedPerfilId || !pendingRevokeMethod) return;
    const metodo = pendingRevokeMethod;
    setPendingRevokeMethod(null);
    setBusyIds((prev) => new Set(prev).add(metodo.id));

    try {
      const res = await PermissionService.quitarPermisoMetodo(selectedPerfilId, metodo.id);
      // Confirmar con lo que devuelve el backend
      setMetodos((prev) =>
        prev.map((m) => (m.id === metodo.id ? { ...m, asignado: res.asignado } : m)),
      );
      pushToast(`Permiso revocado: ${metodo.clase}.${metodo.metodo}`, 'info');

      if (isEditingOwnProfile) {
        pushToast(
          'Atención: Has revocado un permiso de tu propio perfil. Tus siguientes llamadas a este método darán 403.',
          'warning' as any,
        );
      }
    } catch (err: any) {
      // Revertir y mostrar mensaje del backend (ej: 409)
      pushToast(err?.message ?? 'Error al revocar permiso', 'error');
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(metodo.id);
        return next;
      });
    }
  };

  // Métodos filtrados por el buscador
  const filteredMetodos = useMemo(() => {
    if (!searchQuery.trim()) return metodos;
    const q = searchQuery.toLowerCase().trim();
    return metodos.filter(
      (m) =>
        m.subsistema.toLowerCase().includes(q) ||
        m.clase.toLowerCase().includes(q) ||
        m.metodo.toLowerCase().includes(q) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(q)),
    );
  }, [metodos, searchQuery]);

  // Agrupar métodos por: SUBSISTEMA > CLASE
  const groupedHierarchy = useMemo(() => {
    const map = new Map<string, Map<string, PermisoMetodoItem[]>>();

    filteredMetodos.forEach((m) => {
      if (!map.has(m.subsistema)) {
        map.set(m.subsistema, new Map());
      }
      const subsistemaMap = map.get(m.subsistema)!;
      if (!subsistemaMap.has(m.clase)) {
        subsistemaMap.set(m.clase, []);
      }
      subsistemaMap.get(m.clase)!.push(m);
    });

    return map;
  }, [filteredMetodos]);

  // Estadísticas del contador
  const totalMetodos = metodos.length;
  const asignadosCount = useMemo(() => {
    return metodos.filter((m) => m.asignado).length;
  }, [metodos]);

  const porcentajeAsignado = totalMetodos > 0 ? Math.round((asignadosCount / totalMetodos) * 100) : 0;

  // Si la sesión no es Superusuario: No renderizar la vista de gestión
  if (!isSuperuser) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Asignación de Permisos"
          description="Acceso restringido a administradores del sistema."
        />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary leading-relaxed">
            Esta pantalla es de uso exclusivo para el perfil <strong>Superusuario</strong>.
            Tu sesión no cuenta con los privilegios requeridos para gestionar permisos de métodos.
          </p>
        </div>
      </div>
    );
  }

  const profileOptions = perfiles.map((p) => ({
    value: String(p.id),
    label: `${p.nombre}${p.descripcion ? ` — ${p.descripcion}` : ''}`,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asignación de Permisos por Método"
        description="Control granular de permisos de ejecución en caliente para los métodos del sistema."
        actions={
          <button
            type="button"
            onClick={() => {
              if (selectedPerfilId) void loadPermisos(selectedPerfilId);
            }}
            disabled={loadingMetodos || !selectedPerfilId}
            className="inline-flex h-11 items-center justify-center rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary transition hover:border-border-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw className={cn('mr-1.5 h-4 w-4', loadingMetodos && 'animate-spin')} />
            Recargar
          </button>
        }
      />


      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Barra superior de controles: Selector de Perfil y Buscador */}
        <motion.div
          variants={fadeUpItem}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface-soft p-5 lg:grid-cols-12"
        >
          {/* Selector de perfil */}
          <div className="lg:col-span-5">
            <Select
              name="selectedPerfil"
              label="Perfil a configurar"
              value={selectedPerfilId ? String(selectedPerfilId) : ''}
              onChange={(val) => setSelectedPerfilId(Number(val))}
              options={profileOptions}
              placeholder="Seleccionar perfil"
              disabled={loadingPerfiles}
            />
          </div>

          {/* Buscador de métodos */}
          <div className="lg:col-span-7">
            <Input
              name="search"
              label="Buscar métodos"
              placeholder="Filtrar por subsistema, clase, método o descripción..."
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              trailing={<Search className="h-4 w-4 text-text-muted" />}
            />
          </div>
        </motion.div>

        {/* Barra de estado y contador de métodos asignados */}
        <motion.div
          variants={fadeUpItem}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface/80 px-5 py-3.5 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-text-secondary">
              Perfil activo configurando:
            </span>
            <Badge tone="success">
              {selectedPerfil?.nombre ?? 'Cargando...'}
            </Badge>

            {isSelectedProfileSuperuser && (
              <span className="inline-flex items-center gap-1 text-xs text-warning">
                <Lock className="h-3 w-3" />
                Los métodos críticos son obligatorios
              </span>
            )}
          </div>

          {/* Contador N de M */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-text">
              {asignadosCount} de {totalMetodos} métodos asignados
            </span>
            <Badge tone={porcentajeAsignado === 100 ? 'success' : 'neutral'}>
              {porcentajeAsignado}%
            </Badge>
            {searchQuery.trim() && (
              <span className="text-xs text-text-muted">
                ({filteredMetodos.length} coincidencias)
              </span>
            )}
          </div>
        </motion.div>

        {/* Catálogo agrupado por SUBSISTEMA > CLASE > METODOS */}
        {loadingMetodos ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface-soft text-text-muted">
            <RotateCw className="h-7 w-7 animate-spin text-accent" />
            <p className="text-sm">Cargando catálogo de permisos...</p>
          </div>
        ) : filteredMetodos.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface-soft p-12 text-center">
            <Filter className="mx-auto h-10 w-10 text-text-muted mb-2" />
            <p className="text-base font-medium text-text">No se encontraron métodos</p>
            <p className="mt-1 text-xs text-text-muted">
              {searchQuery.trim()
                ? 'Ningún método coincide con los criterios de búsqueda ingresados.'
                : 'El perfil no tiene métodos registrados en el catálogo.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedHierarchy.entries()).map(([subsistema, clasesMap]) => (
              <motion.section
                key={subsistema}
                variants={fadeUpItem}
                className="space-y-4 rounded-2xl border border-border bg-surface/50 p-5"
              >
                {/* Cabecera del subsistema */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-bold tracking-tight text-text">
                      Subsistema: {subsistema}
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
                    {Array.from(clasesMap.values()).reduce((acc, list) => acc + list.length, 0)} métodos
                  </span>
                </div>

                {/* Clases dentro del subsistema */}
                <div className="grid grid-cols-1 gap-4">
                  {Array.from(clasesMap.entries()).map(([clase, listaMetodos]) => {
                    const asignadosEnClase = listaMetodos.filter((m) => m.asignado).length;

                    return (
                      <div
                        key={clase}
                        className="rounded-xl border border-border/80 bg-surface-soft/80 overflow-hidden"
                      >
                        {/* Cabecera de la Clase */}
                        <div className="flex items-center justify-between border-b border-border/60 bg-surface-soft px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-text">
                              Clase {clase}
                            </span>
                          </div>
                          <span className="text-xs tabular-nums text-text-muted">
                            {asignadosEnClase} / {listaMetodos.length} asignados
                          </span>
                        </div>

                        {/* Lista de métodos */}
                        <div className="divide-y divide-border/40">
                          {listaMetodos.map((metodo) => {
                            const isBusy = busyIds.has(metodo.id);
                            const isCriticalLocked = isSelectedProfileSuperuser && metodo.critico;

                            return (
                              <div
                                key={metodo.id}
                                className={cn(
                                  'flex flex-col gap-3 p-4 transition-colors duration-150 sm:flex-row sm:items-center sm:justify-between',
                                  metodo.asignado ? 'bg-surface-soft/40' : 'bg-transparent',
                                )}
                              >
                                {/* Info del método */}
                                <div className="space-y-1 min-w-0 pr-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm font-semibold text-text">
                                      {metodo.metodo}
                                    </span>

                                    {metodo.critico && (
                                      <Badge tone={isSelectedProfileSuperuser ? 'warning' : 'neutral'}>
                                        <Lock className="mr-1 h-3 w-3" />
                                        {isSelectedProfileSuperuser
                                          ? 'Obligatorio para Superusuario'
                                          : 'Crítico'}
                                      </Badge>
                                    )}

                                    {metodo.asignado ? (
                                      <Badge tone="success" dot>
                                        Asignado
                                      </Badge>
                                    ) : (
                                      <Badge tone="neutral">
                                        No asignado
                                      </Badge>
                                    )}
                                  </div>

                                  <p className="text-xs text-text-secondary leading-relaxed">
                                    {metodo.descripcion || 'Sin descripción disponible.'}
                                  </p>
                                </div>

                                {/* Interruptor (Switch accesible) */}
                                <div className="flex shrink-0 items-center gap-3">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={metodo.asignado}
                                    aria-label={`Permiso para método ${metodo.clase}.${metodo.metodo}`}
                                    disabled={isBusy || isCriticalLocked}
                                    onClick={() => handleToggle(metodo)}
                                    className={cn(
                                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
                                      metodo.asignado ? 'bg-accent' : 'bg-surface-soft border-border-strong',
                                      (isBusy || isCriticalLocked) && 'cursor-not-allowed opacity-60',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                                        metodo.asignado ? 'translate-x-5' : 'translate-x-0',
                                        isBusy && 'animate-pulse bg-text-muted',
                                      )}
                                    />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal de confirmación para desmarcar (revocar) permiso */}
      <Modal
        open={Boolean(pendingRevokeMethod)}
        onClose={() => setPendingRevokeMethod(null)}
        title="¿Revocar permiso de método?"
        description={`Estás a punto de quitar el permiso para '${pendingRevokeMethod?.clase}.${pendingRevokeMethod?.metodo}' al perfil '${selectedPerfil?.nombre}'.`}
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={Boolean(pendingRevokeMethod && busyIds.has(pendingRevokeMethod.id))}
              onClick={() => setPendingRevokeMethod(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary transition hover:border-border-strong hover:text-text"
            >
              Cancelar
            </button>
            <Button
              className="border-error/40 bg-error text-white hover:bg-error/90"
              state={pendingRevokeMethod && busyIds.has(pendingRevokeMethod.id) ? 'loading' : 'idle'}
              onClick={executeRevoke}
            >
              Confirmar revocación
            </Button>

          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary leading-relaxed">
            Esta acción es destructiva para los usuarios asignados al perfil{' '}
            <strong className="text-text">{selectedPerfil?.nombre}</strong>. Ya no podrán invocar este método desde el frontend.
          </p>

          {isEditingOwnProfile && (
            <div className="flex items-start gap-2.5 rounded-xl border border-warning/35 bg-warning-soft p-3 text-xs text-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Atención:</strong> Este perfil forma parte de tu sesión actual. Si revocas este permiso, tus próximas operaciones que requieran este método serán rechazadas con error 403.
              </span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
