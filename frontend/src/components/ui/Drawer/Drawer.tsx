import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { drawerLeftVariants, drawerVariants, overlayVariants } from '../../../animations/variants';
import { useFocusTrap, useLockBodyScroll } from '../../../hooks';
import { cn } from '../../../utils';

export type DrawerSide = 'left' | 'right';

export interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  side?: DrawerSide;
  width?: string;
}

export function Drawer({ open, title, onClose, children, side = 'right', width = '440px' }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85]">
          <motion.button
            type="button"
            aria-label="Cerrar panel"
            onClick={onClose}
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute inset-0 cursor-default bg-text/25 backdrop-blur-md"
          />
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            tabIndex={-1}
            variants={side === 'left' ? drawerLeftVariants : drawerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            style={{ width }}
            className={cn(
              'absolute inset-y-0 flex max-w-[92vw] flex-col border-border bg-surface outline-none',
              side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
            )}
          >
            <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
              <h2 id="drawer-title" className="truncate text-lg font-semibold tracking-tight text-text">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-text"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
