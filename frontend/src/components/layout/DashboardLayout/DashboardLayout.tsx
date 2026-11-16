import { Suspense, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigationType, useOutlet } from 'react-router-dom';
import { layoutVariants, pageVariants } from '../../../animations/variants';
import { PAGE_TITLES, SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from '../../../constants';
import { useIsMobile, useLowEndDevice, useMediaQuery } from '../../../hooks';
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
  const navType = useNavigationType();
  const outlet = useOutlet();
  const reduce = useReducedMotion();
  const lowEnd = useLowEndDevice();
  const isMobile = useIsMobile();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const drawerOpen = useUiStore((state) => state.drawerOpen);
  const setDrawerOpen = useUiStore((state) => state.setDrawerOpen);
  const lg = useMediaQuery('(min-width: 1024px)');
  const prevPathRef = useRef(location.pathname);

  // Una sola fuente para el título: la ruta actual.
  const routeTitle = PAGE_TITLES[location.pathname] ?? title;

  useEffect(() => {
    document.title = `${routeTitle} — Onyx`;
  }, [routeTitle]);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname && navType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' });
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname, navType, reduce]);

  const simple = lowEnd;
  const pageVariant = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.01 } }, exit: { opacity: 0, transition: { duration: 0.01 } } }
    : simple
      ? { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } }, exit: { opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } } }
      : pageVariants;

  return (
    <div className="min-h-dvh bg-bg font-sans text-text" style={{ ['--topbar-h' as string]: '5rem' }}>
      <div className="page-gradient pointer-events-none fixed inset-0" aria-hidden />
      <motion.div
        variants={layoutVariants}
        initial={reduce ? false : 'hidden'}
        animate="show"
        className="relative flex min-h-dvh"
      >
        {lg && <Sidebar collapsed={sidebarCollapsed} variant="desktop" />}
        <div
          className="flex min-h-dvh min-w-0 flex-1 flex-col transition-[padding-left] duration-300 ease-sidebar will-change-[padding-left]"
          style={lg ? { paddingLeft: sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH } : undefined}
        >
          <Topbar
            title={routeTitle}
            description={description}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
            onOpenDrawer={() => setDrawerOpen(true)}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<RouteFallback />}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    data-route={location.pathname}
                    variants={pageVariant}
                    initial={reduce ? false : 'hidden'}
                    animate="show"
                    exit={reduce ? undefined : 'exit'}
                    className="min-h-[50vh]"
                  >
                    {outlet}
                  </motion.div>
                </AnimatePresence>
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
