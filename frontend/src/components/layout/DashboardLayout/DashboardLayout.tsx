import { Suspense, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { layoutVariants, pageVariants } from '../../../animations/variants';
import { PAGE_TITLES, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from '../../../constants';
import { useIsMobile, useMediaQuery } from '../../../hooks';
import { useUiStore } from '../../../store';
import { ErrorBoundary, RouteFallback } from '../../errors';
import { Drawer } from '../../ui/Drawer';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';

export interface DashboardLayoutProps {
  title: string;
  description?: string;
}

export function DashboardLayout({ title, description }: DashboardLayoutProps) {
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();
  const isMobile = useIsMobile();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const drawerOpen = useUiStore((state) => state.drawerOpen);
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);
  const lg = useMediaQuery('(min-width: 1024px)');

  // Una sola fuente para el título: la ruta actual. El layout ya no recibe un
  // título fijo por grupo (que dejaba "Panel administrativo" en todas las
  // pantallas); el mapa PAGE_TITLES es la verdad y el prop queda como
  // fallback para rutas nuevas.
  const routeTitle = PAGE_TITLES[location.pathname] ?? title;

  useEffect(() => {
    document.title = `${routeTitle} — Onyx`;
  }, [routeTitle]);

  return (
    <div className="min-h-dvh bg-bg font-sans text-text">
      <div className="page-gradient pointer-events-none fixed inset-0" aria-hidden />
      <motion.div
        variants={layoutVariants}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative flex min-h-dvh"
      >
        {lg && (
          <Sidebar collapsed={sidebarCollapsed} variant="desktop" />
        )}
        <div
          className="flex min-h-dvh min-w-0 flex-1 flex-col transition-[padding-left] duration-300 ease-sidebar will-change-[padding-left]"
          style={
            lg
              ? { paddingLeft: sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }
              : undefined
          }
        >
          <Topbar
            title={routeTitle}
            description={description}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {/* El contenido se monta de inmediato al cambiar de ruta. Antes,
                AnimatePresence con mode="wait" retenía el contenido nuevo
                hasta que terminara la salida del anterior; si esa animación
                se interrumpía (navegación rápida, StrictMode o un keyframe de
                filter inválido) el área quedaba con opacity 0: pantalla negra
                con el sidebar ya resaltado. */}
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<RouteFallback />}>
                <motion.div
                  key={location.pathname}
                  data-route={location.pathname}
                  variants={pageVariants}
                  initial={reduce ? false : 'hidden'}
                  animate="show"
                >
                  {outlet}
                </motion.div>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </motion.div>

      <Drawer open={drawerOpen && isMobile} title="Menú" onClose={() => setDrawerOpen(false)} side="left" width="280px">
        <Sidebar collapsed={false} variant="mobile" onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </div>
  );
}
