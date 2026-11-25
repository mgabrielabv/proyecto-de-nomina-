import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DURATION, EASE } from '../../../constants';
import { cn } from '../../../utils';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: 'right' | 'top' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, side = 'right', delay = 300, className }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timerRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    let top = rect.top + rect.height / 2;
    let left = rect.right + gap;
    if (side === 'left') left = rect.left - gap;
    if (side === 'top') { top = rect.top - gap; left = rect.left + rect.width / 2; }
    if (side === 'bottom') { top = rect.bottom + gap; left = rect.left + rect.width / 2; }
    setCoords({ top, left });
  }, [open, side]);

  if (!isValidElement(children)) return children;

  const child = children as ReactElement<any>;
  const trigger = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const originalRef = (child as any).ref;
      if (typeof originalRef === 'function') originalRef(node);
      else if (originalRef && typeof originalRef === 'object') (originalRef as any).current = node;
    },
    onMouseEnter: (e: any) => { child.props.onMouseEnter?.(e); show(); },
    onMouseLeave: (e: any) => { child.props.onMouseLeave?.(e); hide(); },
    onFocus: (e: any) => { child.props.onFocus?.(e); show(); },
    onBlur: (e: any) => { child.props.onBlur?.(e); hide(); },
    'aria-describedby': open ? id : child.props['aria-describedby'],
  });

  const transform =
    side === 'right' ? 'translateY(-50%)' :
    side === 'left' ? 'translate(-100%, -50%)' :
    side === 'top' ? 'translate(-50%, -100%)' :
    'translate(-50%, 0)';

  const initial = side === 'right' ? { opacity: 0, x: -4 } : side === 'left' ? { opacity: 0, x: 4 } : side === 'top' ? { opacity: 0, y: 4 } : { opacity: 0, y: -4 };

  return (
    <>
      {trigger}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && coords && (
            <motion.div
              id={id}
              role="tooltip"
              initial={reduce ? false : initial}
              animate={reduce ? { opacity: 1, x: 0, y: 0 } : { opacity: 1, x: 0, y: 0 }}
              exit={reduce ? { opacity: 0 } : initial}
              transition={{ duration: DURATION.fast, ease: EASE.out }}
              style={{ position: 'fixed', top: coords.top, left: coords.left, transform, zIndex: 200 }}
              className={cn('pointer-events-none whitespace-nowrap rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text shadow-card', className)}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
