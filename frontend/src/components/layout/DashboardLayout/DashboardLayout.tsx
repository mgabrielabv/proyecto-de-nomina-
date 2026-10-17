import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { layoutVariants, pageVariants } from '../../../animations/variants';
import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED } from '../../../constants';
import { useIsMobile, useMediaQuery } from '../../../hooks';
import { useUiStore } from '../../../store';
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
          <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} variant="desktop" />
        )}
        <div
          className="flex min-h-dvh flex-1 flex-col transition-[padding-left] duration-250"
          style={
            lg
              ? { paddingLeft: sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }
              : undefined
          }
        >
          <Topbar title={title} description={description} onOpenDrawer={() => setDrawerOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial={reduce ? false : 'hidden'}
                animate="show"
                exit={reduce ? undefined : 'exit'}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>

      <Drawer open={drawerOpen && isMobile} title="Menú" onClose={() => setDrawerOpen(false)} side="left" width="280px">
        <Sidebar collapsed={false} onToggle={() => undefined} variant="mobile" />
      </Drawer>
    </div>
  );
}
