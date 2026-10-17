import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { modalVariants, overlayVariants } from '../../../animations/variants';
import { useFocusTrap, useLockBodyScroll } from '../../../hooks';
import { cn } from '../../../utils';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }: ModalProps) {
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
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center sm:p-6">
          <motion.button
            type="button"
            aria-label="Cerrar diálogo"
            onClick={onClose}
            variants={overlayVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute inset-0 cursor-default bg-text/25 backdrop-blur-md"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby={description ? 'modal-description' : undefined}
            tabIndex={-1}
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className={cn(
              'glass-card relative z-10 max-h-[88dvh] w-full overflow-y-auto p-6 outline-none sm:p-7',
              sizeClasses[size],
            )}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-text">
                  {title}
                </h2>
                {description && (
                  <p id="modal-description" className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-surface-soft hover:text-text"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            {children && <div className="mt-5">{children}</div>}
            {footer && <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
