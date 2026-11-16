import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toastVariants } from '../../../animations/variants';
import { useToastStore, type ToastItem, type ToastTone } from '../../../store';
import { cn } from '../../../utils';

const toneClasses: Record<ToastTone, string> = {
  success: 'border-success/30 bg-success-soft text-success',
  error: 'border-error/30 bg-error-soft text-error',
  warning: 'border-warning/35 bg-warning-soft text-warning',
  info: 'border-border bg-surface text-text-secondary',
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />;
  if (tone === 'error') return <AlertCircle className="h-[18px] w-[18px]" aria-hidden />;
  if (tone === 'warning') return <AlertTriangle className="h-[18px] w-[18px]" aria-hidden />;
  return <Info className="h-[18px] w-[18px]" aria-hidden />;
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const reduce = useReducedMotion();
  const remainingRef = useRef(toast.duration);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    if (pausedRef.current) return;
    clearTimer();
    startRef.current = Date.now();
    timerRef.current = window.setTimeout(() => onDismiss(toast.id), remainingRef.current);
    if (barRef.current && !reduce) {
      barRef.current.style.transition = 'none';
      barRef.current.style.transform = `scaleX(${remainingRef.current / toast.duration})`;
      // force reflow
      void barRef.current.offsetWidth;
      barRef.current.style.transition = `transform ${remainingRef.current}ms linear`;
      barRef.current.style.transform = 'scaleX(0)';
    }
  };

  const pause = () => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    if (startRef.current) {
      const elapsed = Date.now() - startRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }
    clearTimer();
    if (barRef.current) {
      const scale = remainingRef.current / toast.duration;
      barRef.current.style.transition = 'none';
      barRef.current.style.transform = `scaleX(${scale})`;
    }
  };

  const resume = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    if (remainingRef.current <= 0) {
      onDismiss(toast.id);
      return;
    }
    startTimer();
  };

  useEffect(() => {
    startTimer();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <motion.div
      layout
      role="status"
      variants={toastVariants}
      initial={reduce ? false : 'hidden'}
      animate={reduce ? undefined : 'show'}
      exit={reduce ? undefined : 'exit'}
      drag={reduce ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) onDismiss(toast.id);
      }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) resume();
      }}
      className={cn(
        'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl border px-4 py-3 shadow-card backdrop-blur-xl',
        toneClasses[toast.tone],
      )}
    >
      <div className="flex items-start gap-3">
        <ToneIcon tone={toast.tone} />
        <span className="flex-1 text-sm font-medium">{toast.message}</span>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Descartar aviso"
          className="-mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200 hover:bg-surface-soft/70"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-current/10">
        <div ref={barRef} className="h-full origin-left bg-current/50" style={{ transform: 'scaleX(1)' }} />
      </div>
    </motion.div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 top-4 z-[120] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-5 sm:top-5 sm:items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
