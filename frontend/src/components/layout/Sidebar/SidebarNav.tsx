import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { listCollapseVariants } from '../../../animations/variants';
import { NAV_SECTIONS, ROLE_SECTION_ID } from '../../../constants';
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

// Navegación dinámica: el menú se arma desde Security/Menu/getOptions en el servidor,
// filtrado según los perfiles activos de la sesión.
export function SidebarNav({ role, collapsed, layoutId, onNavigate, className }: SidebarNavProps) {
  const reduce = useReducedMotion();
  const dynamicSections = useMenuStore((state) => state.sections);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);

  useEffect(() => {
    void fetchMenu();
  }, [fetchMenu, role]);


  // Si el backend ya devolvió opciones de menú, se usan esas de forma obligatoria.
  // Si aún está cargando y no hay opciones, usamos el fallback.
  const sections = dynamicSections.length > 0
    ? dynamicSections
    : NAV_SECTIONS.filter((section) => section.roles.includes(role));

  const activeSectionId = dynamicSections.length > 0
    ? dynamicSections[0]?.id
    : ROLE_SECTION_ID[role];

  const [openId, setOpenId] = useState<string | null>(activeSectionId);

  useEffect(() => {
    if (activeSectionId) {
      setOpenId(activeSectionId);
    }
  }, [activeSectionId]);

  // Colapsado: solo los iconos del grupo activo, sin cabeceras.
  if (collapsed) {
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

