import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronLeft, ChevronRight, MenuIcon, RotateCw } from 'lucide-react';
import { EASE_SIDEBAR, NAV_SECTIONS } from '../../../constants';
import type { NavSection } from '../../../constants';
import { useMenuStore } from '../../../store';
import { cn } from '../../../utils';
import { SidebarItem } from './SidebarItem';

export interface SidebarNavProps {
  perfilId: number;
  collapsed: boolean;
  layoutId: string;
  onNavigate?: () => void;
  className?: string;
}

// Fallback estático que se dibuja solo mientras llega la primera respuesta del
// servidor. Es el bloque común a todo usuario autenticado ("Mi espacio"): no
// incluye opciones de Seguridad ni de Nómina, porque el menú real depende del
// perfil activo y lo decide el backend.
const FALLBACK_SECTIONS: NavSection[] = NAV_SECTIONS.filter(
  (section) => section.id === 'personal',
);

// Desplazamiento del panel al entrar/salir: corto (24-32px) y combinado con
// fade, no el ancho completo del sidebar.
const PANEL_OFFSET = 28;
// Desplazamiento de cada fila en la entrada escalonada del panel.
const ROW_OFFSET = 10;
// Stagger de las filas del panel entrante: 18ms por fila, tope de 8.
const ROW_STAGGER = 0.018;
const ROW_STAGGER_MAX = 8;
// Duración del deslizamiento del panel (220-260ms) y de cada fila.
const PANEL_DURATION = 0.24;
const ROW_DURATION = 0.2;

// Índice de la sección que contiene la ruta actual; 0 (panel principal)
// cuando la ruta no está en el menú.
const sectionForRoute = (sections: NavSection[], pathname: string): number =>
  Math.max(
    sections.findIndex((section) => section.items.some((item) => item.path === pathname)),
    0,
  );

// Estados posicionales de cada panel. La posición codifica la dirección de
// la última navegación: al avanzar (Nómina -> Seguridad) el panel que queda
// atrás pasa a "left" y el nuevo entra desde "right"; al volver, lo inverso.
// Por eso no hace falta guardar la dirección en el estado. Con
// prefers-reduced-motion los paneles solo hacen fade, sin desplazamiento.
const panelVariants = (reduce: boolean): Variants => ({
  active: { opacity: 1, x: 0 },
  left: { opacity: 0, x: reduce ? 0 : -PANEL_OFFSET },
  right: { opacity: 0, x: reduce ? 0 : PANEL_OFFSET },
});

// Variantes de fila: el panel que llega a "active" entra con fade y un
// desplazamiento corto, escalonado por índice (máximo 8 filas).
const rowVariantsFor = (index: number, reduce: boolean): Variants => ({
  active: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ROW_DURATION,
      delay: Math.min(index, ROW_STAGGER_MAX - 1) * ROW_STAGGER,
      ease: EASE_SIDEBAR,
    },
  },
  left: { opacity: 0, x: reduce ? 0 : -ROW_OFFSET, transition: { duration: 0.12 } },
  right: { opacity: 0, x: reduce ? 0 : ROW_OFFSET, transition: { duration: 0.12 } },
});

// Navegación por paneles con deslizamiento. El menú se arma desde
// Security/Menu/getOptions en el servidor, filtrado según el perfil activo
// del usuario. El primer subsistema (Nómina) es el panel principal; los
// siguientes (Seguridad) se alcanzan desde el enlace de cambio anclado abajo.
// El encabezado de cada panel dice dónde está el usuario y el enlace inferior
// dice a dónde puede ir; ambos conviven con el logo y el bloque de usuario,
// que son fijos y no se animan. El fallback estático solo se usa mientras
// carga la primera respuesta (para no parpadear); si el backend responde
// vacío o con error, se muestra el estado correspondiente en lugar de
// opciones hardcodeadas.
export function SidebarNav({ perfilId, collapsed, layoutId, onNavigate, className }: SidebarNavProps) {
  const location = useLocation();
  // useReducedMotion devuelve boolean | null; null significa "sin
  // preferencia declarada", que se trata como movimiento permitido.
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
  // Al cambiar de perfil, entre el render y el efecto que pide el menú hay un
  // instante en que las secciones todavía son del perfil anterior. Se trata
  // como "cargando" para mostrar el fallback genérico en vez del estado vacío.
  const menuPending = menuLoading || menuPerfilId !== perfilId;

  // Estados del menú:
  // - Cargando (o cambio de perfil en curso): fallback genérico para no parpadear.
  // - Con opciones del servidor: se usan esas, sin excepción.
  // - Sin opciones: estado vacío (el perfil no tiene opciones).
  // - Con error: mensaje y botón de reintento.
  const sections: NavSection[] = hasDynamicOptions
    ? dynamicSections
    : menuPending
      ? FALLBACK_SECTIONS
      : [];

  // Panel activo: 0 es el principal (Nómina), los siguientes son los
  // subpaneles (Seguridad). Con los datos reales del servidor el índice es
  // exactamente 'nomina' | 'seguridad'.
  const [activeIndex, setActiveIndex] = useState(() => sectionForRoute(sections, location.pathname));
  // Las transiciones solo se animan a partir del primer cambio de panel
  // disparado por el usuario: la carga inicial y la llegada del menú se
  // dibujan en su posición final, sin animación.
  const [canAnimate, setCanAnimate] = useState(false);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);

  // El índice visible siempre queda dentro del rango de secciones actuales:
  // el fallback de carga puede tener más paneles que el menú real.
  const activeIndexShown = sections.length > 0 ? Math.min(activeIndex, sections.length - 1) : 0;

  useEffect(() => {
    panelRefs.current.forEach((panel, index) => {
      if (panel) panel.inert = index !== activeIndexShown;
    });
  }, [activeIndexShown, sections.length]);

  // Cambio de panel por interacción (enlace de cambio o Escape).
  const goToPanel = (index: number) => {
    const target = Math.min(Math.max(index, 0), Math.max(sections.length - 1, 0));
    setCanAnimate(true);
    setActiveIndex((current) => (current === target ? current : target));
  };

  // El panel se re-deriva de la ruta cuando llegan las secciones del servidor
  // o al navegar con atrás/adelante del navegador. Navegar con los ítems del
  // panel activo no cambia el índice, así que no re-dispara la animación.
  // Estas derivaciones no animan: canAnimate sigue en false hasta la
  // primera interacción.
  useEffect(() => {
    const target = sectionForRoute(sections, location.pathname);
    setActiveIndex((current) => (current === target ? current : target));
  }, [sections, location.pathname]);

  // Escape vuelve al panel principal desde cualquier subpanel.
  useEffect(() => {
    if (activeIndexShown === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') goToPanel(0);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeIndexShown, sections.length]);

  // Estado vacío / de error: nada que deslizar.
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
          <RotateCw className="h-3 w-3" />
          Reintentar
        </button>
      )}
    </div>
  );

  // Colapsado: solo los iconos del panel activo, sin encabezado ni enlace de
  // cambio (para cambiar de panel hay que expandir).
  if (collapsed) {
    if (!menuPending && sections.length === 0) {
      return (
        <nav
          aria-label="Navegación principal"
          className={cn('sidebar-scroll h-full overflow-y-auto px-3 py-4', className)}
        >
          {renderEstado(
            menuError ? 'Menú no disponible' : 'Sin opciones',
            menuError ?? 'Tu perfil no tiene opciones de menú asignadas.',
            Boolean(menuError),
          )}
        </nav>
      );
    }
    const section = sections[Math.min(activeIndexShown, sections.length - 1)] ?? sections[0];
    return (
      <nav
        aria-label="Navegación principal"
        className={cn('sidebar-scroll h-full overflow-y-auto px-3 py-4', className)}
      >
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

  // Sin secciones (y sin carga en curso): estado vacío o de error.
  if (!menuPending && sections.length === 0) {
    return (
      <nav
        aria-label="Navegación principal"
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

  const switchLinkClass =
    'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

  return (
    <nav aria-label="Navegación principal" className={cn('flex h-full min-h-0 flex-col', className)}>
      {/* Viewport de los paneles: altura estable (flex-1 + overflow hidden),
          así el contenedor no salta aunque un panel tenga menos filas que el
          otro. Recorta los paneles inactivos mientras se deslizan. */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {sections.map((section, index) => {
          const hidden = index !== activeIndexShown;
          const state = hidden ? (index < activeIndexShown ? 'left' : 'right') : 'active';

          return (
            <motion.div
              key={section.id}
              initial={false}
              animate={state}
              variants={panelVariants(reduce)}
              transition={canAnimate ? { duration: PANEL_DURATION, ease: EASE_SIDEBAR } : { duration: 0 }}
              ref={(el) => {
                panelRefs.current[index] = el;
              }}
              className={cn(
                'absolute inset-0 flex flex-col',
                hidden ? 'pointer-events-none' : 'pointer-events-auto',
              )}
            >
              {/* Encabezado de sección: dónde estoy. No es interactivo; misma
                  altura y posición en todos los paneles y hace crossfade
                  junto con el panel. */}
              <h2 className="px-6 pb-2 pt-4 text-[13px] font-semibold text-text">
                {section.label}
              </h2>

              <ul className="sidebar-scroll flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
                {section.items.map((item, rowIndex) => (
                  <SidebarItem
                    key={item.path}
                    item={item}
                    collapsed={false}
                    layoutId={layoutId}
                    onNavigate={onNavigate}
                    rowVariants={canAnimate ? rowVariantsFor(rowIndex, reduce) : undefined}
                  />
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Enlace de cambio: a dónde puedo ir. Zona fija bajo la lista, encima
          del bloque de usuario y separada por un borde sutil: no se desliza
          ni se reposiciona; solo cambian el texto y la dirección del chevron.
          El hueco del chevron se reserva en ambos costados para que el texto
          quede exactamente en el mismo lugar en los dos paneles. */}
      {sections.length > 1 && (
        <div className="border-t border-border px-3 py-2">
          {activeIndexShown === 0 ? (
            <button
              type="button"
              onClick={() => goToPanel(1)}
              aria-label={`Ir a ${sections[1]?.label}`}
              className={switchLinkClass}
            >
              <span className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1 truncate text-left">{sections[1]?.label}</span>
              <ChevronRight className="h-[18px] w-[18px] shrink-0" aria-hidden />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => goToPanel(0)}
              aria-label={`Ir a ${sections[0]?.label}`}
              className={switchLinkClass}
            >
              <ChevronLeft className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="flex-1 truncate text-left">{sections[0]?.label}</span>
              <span className="h-[18px] w-[18px] shrink-0" />
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
