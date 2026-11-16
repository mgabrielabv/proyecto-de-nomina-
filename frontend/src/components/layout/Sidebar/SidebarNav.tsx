import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, MenuIcon, RotateCw } from 'lucide-react';
import { NAV_SECTIONS } from '../../../constants';
import type { NavSection } from '../../../constants';
import { useMenuStore } from '../../../store';
import { cn } from '../../../utils';
import { SidebarItem } from './SidebarItem';

export interface SidebarNavProps {
  perfilId: number;
  layoutId: string;
  onNavigate?: () => void;
  className?: string;
}

const FALLBACK_SECTIONS: NavSection[] = NAV_SECTIONS.filter((section) => section.id === 'personal');

function storageKey(perfilId: number) {
  return `onyx:sidebar-accordion:${perfilId}`;
}

function readOpenState(perfilId: number): Record<string, boolean> | null {
  try {
    const raw = sessionStorage.getItem(storageKey(perfilId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : null;
  } catch {
    return null;
  }
}

function writeOpenState(perfilId: number, state: Record<string, boolean>) {
  try {
    sessionStorage.setItem(storageKey(perfilId), JSON.stringify(state));
  } catch {
    // sin almacenamiento disponible: se degrada sin recordar estado
  }
}

function sectionContainsRoute(section: NavSection, pathname: string): boolean {
  return section.items.some((item) => item.path === pathname);
}

export function SidebarNav({ perfilId, layoutId, onNavigate, className }: SidebarNavProps) {
  const location = useLocation();
  const reduce = useReducedMotion() ?? false;
  const dynamicSections = useMenuStore((state) => state.sections);
  const menuPerfilId = useMenuStore((state) => state.perfilId);
  const menuLoading = useMenuStore((state) => state.loading);
  const menuError = useMenuStore((state) => state.error);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);

  useEffect(() => {
    void fetchMenu(perfilId);
  }, [fetchMenu, perfilId]);

  const hasDynamicOptions = menuPerfilId === perfilId && dynamicSections.length > 0;
  const menuPending = menuLoading || menuPerfilId !== perfilId;

  const sections: NavSection[] = hasDynamicOptions
    ? dynamicSections
    : menuPending
      ? FALLBACK_SECTIONS
      : [];

  const [openById, setOpenById] = useState<Record<string, boolean>>(() => readOpenState(perfilId) ?? {});

  // Al cambiar de perfil, recargar estado recordado de ese perfil.
  useEffect(() => {
    setOpenById(readOpenState(perfilId) ?? {});
  }, [perfilId]);

  const activeSectionId = useMemo(() => {
    const active = sections.find((s) => sectionContainsRoute(s, location.pathname));
    return active?.id ?? sections[0]?.id ?? null;
  }, [sections, location.pathname]);

  // Auto-abrir el grupo de la ruta activa sin cerrar los que el usuario abrió.
  useEffect(() => {
    if (!activeSectionId) return;
    setOpenById((prev) => {
      if (prev[activeSectionId]) return prev;
      const next = { ...prev, [activeSectionId]: true };
      writeOpenState(perfilId, next);
      return next;
    });
  }, [activeSectionId, perfilId]);

  const toggleSection = (id: string) => {
    setOpenById((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // Si nunca se abrió explícitamente, considerar abierto por defecto si es activo.
      if (prev[id] === undefined) {
        next[id] = !(activeSectionId === id);
      }
      writeOpenState(perfilId, next);
      return next;
    });
  };

  const isOpen = (section: NavSection) => {
    const stored = openById[section.id];
    if (stored !== undefined) return stored;
    return section.id === activeSectionId;
  };

  const renderEstado = (titulo: string, descripcion: string, esError: boolean) => (
    <div className="rounded-xl border p-4 text-center">
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
          onClick={() => void fetchMenu(perfilId, true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-3 py-1.5 text-[11px] font-medium text-text transition hover:border-border-strong hover:bg-surface"
        >
          <RotateCw className="h-3 w-3" aria-hidden />
          Reintentar
        </button>
      )}
    </div>
  );

  if (!menuPending && sections.length === 0) {
    return (
      <nav
        aria-label="Navegación principal"
        aria-busy={menuPending}
        className={cn('sidebar-scroll h-full overflow-y-auto px-3 py-4', className)}
      >
        {renderEstado(
          menuError ? 'Menú no disponible' : 'Sin opciones de menú',
          menuError ?? 'Tu perfil no tiene opciones de menú asignadas.',
          Boolean(menuError),
        )}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navegación principal"
      aria-busy={menuPending}
      className={cn('sidebar-scroll h-full overflow-y-auto px-3 py-3', className)}
    >
      <div className="space-y-1.5">
        {sections.map((section) => {
          const open = isOpen(section);
          const panelId = `sidebar-panel-${section.id}`;
          const buttonId = `sidebar-section-${section.id}`;
          return (
            <section key={section.id} aria-labelledby={buttonId} className="rounded-xl">
              <button
                id={buttonId}
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-text transition-colors duration-200 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <span className="truncate">{section.label}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-text-muted transition-transform duration-200',
                    open && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={reduce ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduce ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <ul className="space-y-1 px-1 pb-1 pt-0.5">
                      {section.items.map((item) => (
                        <SidebarItem
                          key={item.path}
                          item={item}
                          layoutId={layoutId}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
