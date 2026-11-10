import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, MenuIcon, RotateCw } from 'lucide-react';
import { listCollapseVariants } from '../../../animations/variants';
import { NAV_SECTIONS, ROLE_SECTION_ID } from '../../../constants';
import type { NavSection } from '../../../constants';
import { useMenuStore } from '../../../store';
import type { UserRole } from '../../../types';
import { cn } from '../../../utils';
import { SidebarItem } from './SidebarItem';

export interface SidebarNavProps {
  role: UserRole;
  collapsed: boolean;
  layoutId: string;
  onNavigate?: () => void;
  className?: string;
}

// Navegación dinámica: el menú se arma desde Security/Menu/getOptions en el
// servidor, filtrado según los perfiles activos de la sesión. El fallback
// estático solo se usa mientras carga la primera respuesta (para no
// parpadear); si el backend responde vacío o con error, se muestra el estado
// correspondiente en lugar de opciones hardcodeadas.
export function SidebarNav({ role, collapsed, layoutId, onNavigate, className }: SidebarNavProps) {
  const reduce = useReducedMotion();
  const dynamicSections = useMenuStore((state) => state.sections);
  const menuLoading = useMenuStore((state) => state.loading);
  const menuError = useMenuStore((state) => state.error);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);

  useEffect(() => {
    void fetchMenu();
  }, [fetchMenu, role]);

  const hasDynamicOptions = dynamicSections.length > 0;

  // Estados del menú:
  // - Cargando: fallback estático para no parpadear.
  // - Con opciones del servidor: se usan esas, sin excepción.
  // - Sin opciones y sin error: estado vacío (el perfil no tiene opciones).
  // - Con error: mensaje y botón de reintento.
  const sections: NavSection[] = hasDynamicOptions
    ? dynamicSections
    : menuLoading
      ? NAV_SECTIONS.filter((section) => section.roles.includes(role))
      : [];

  const activeSectionId = hasDynamicOptions
    ? dynamicSections[0]?.id
    : menuLoading
      ? ROLE_SECTION_ID[role]
      : null;

  const [openId, setOpenId] = useState<string | null>(activeSectionId ?? null);

  useEffect(() => {
    if (activeSectionId) {
      setOpenId(activeSectionId);
    }
  }, [activeSectionId]);

  // Estado vacío / de error: nada que renderizar en el acordeón.
  const renderEstado = (titulo: string, descripcion: string, esError: boolean) => (
    <div className={cn('rounded-xl border p-4 text-center', className)}>
      {esError ? (
        <RotateCw className="mx-auto mb-2 h-5 w-5 text-error" aria-hidden />
      ) : (
        <MenuIcon className="mx-auto mb-2 h-5 w-5 text-text-muted" aria-hidden />
      )}
      <p className="text-xs font-semibold text-text">{titulo}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{descripcion}</p>
      {esError && (
        <button
          type="button"
          onClick={() => void fetchMenu()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-3 py-1.5 text-[11px] font-medium text-text transition hover:border-border-strong hover:bg-surface"
        >
          <RotateCw className="h-3 w-3" />
          Reintentar
        </button>
      )}
    </div>
  );

  // Colapsado: solo los iconos del grupo activo, sin cabeceras.
  if (collapsed) {
    if (!menuLoading && !hasDynamicOptions) {
      return renderEstado(
        menuError ? 'Menú no disponible' : 'Sin opciones',
        menuError
          ? 'No se pudo cargar el menú.'
          : 'Tu perfil no tiene opciones de menú asignadas.',
        Boolean(menuError),
      );
    }
    const section = sections.find((item) => item.id === openId) ?? sections[0];
    return (
      <nav aria-label="Navegación principal" className={cn('space-y-1', className)}>
        <ul className="space-y-1">
          {section?.items.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              collapsed
              layoutId={layoutId}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Navegación principal" className={cn('space-y-1', className)}>
      <AnimatePresence initial={false}>
        {!menuLoading && !hasDynamicOptions && (
          <motion.div
            key="menu-estado"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn('rounded-xl border p-4 text-center')}
          >
            {menuError ? (
              <>
                <RotateCw className="mx-auto mb-2 h-5 w-5 text-error" aria-hidden />
                <p className="text-xs font-semibold text-text">Menú no disponible</p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{menuError}</p>
                <button
                  type="button"
                  onClick={() => void fetchMenu()}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-3 py-1.5 text-[11px] font-medium text-text transition hover:border-border-strong hover:bg-surface"
                >
                  <RotateCw className="h-3 w-3" />
                  Reintentar
                </button>
              </>
            ) : (
              <>
                <MenuIcon className="mx-auto mb-2 h-5 w-5 text-text-muted" aria-hidden />
                <p className="text-xs font-semibold text-text">Sin opciones de menú</p>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                  Tu perfil no tiene opciones de menú asignadas.
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {sections.map((section) => {
        const open = openId === section.id;
        const contentId = `sidebar-section-${section.id}`;

        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : section.id)}
              aria-expanded={open}
              aria-controls={contentId}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {section.label}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-sidebar',
                  open && 'rotate-180',
                )}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  id={contentId}
                  variants={listCollapseVariants}
                  initial={reduce ? false : 'hidden'}
                  animate="show"
                  exit={reduce ? undefined : 'exit'}
                  className="overflow-hidden"
                >
                  <ul className="space-y-1 pt-0.5">
                    {section.items.map((item) => (
                      <SidebarItem
                        key={item.path}
                        item={item}
                        collapsed={false}
                        layoutId={layoutId}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
