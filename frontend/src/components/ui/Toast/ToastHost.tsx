import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { toastVariants } from '../../../animations/variants';
import { useToastStore, type ToastTone } from '../../../store';
import { cn } from '../../../utils';

const toneClasses: Record<ToastTone, string> = {
  success: 'border-success/30 bg-success-soft text-success',
  error: 'border-error/30 bg-error-soft text-error',
  info: 'border-border bg-surface text-text-secondary',
};

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />;
  if (tone === 'error') return <AlertCircle className="h-[18px] w-[18px]" aria-hidden />;
  return <Info className="h-[18px] w-[18px]" aria-hidden />;
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
          <motion.div
            key={toast.id}
            layout
            role="status"
            variants={toastVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-card backdrop-blur-xl',
              toneClasses[toast.tone],
            )}
          >
            <ToneIcon tone={toast.tone} />
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Descartar aviso"
              className="-mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200 hover:bg-black/5"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
