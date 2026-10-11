import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { AuthMode } from '../../../features/auth/types';

export interface AuthSuccessProps {
  mode: AuthMode;
}

export function AuthSuccess({ mode }: AuthSuccessProps) {
  const isLogin = mode === 'login';

  return (
    <div className="glass-card relative overflow-hidden p-8 text-center sm:p-10">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success-soft"
      >
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.2 }}
        >
          <Check className="h-9 w-9 text-success" strokeWidth={2.5} aria-hidden />
        </motion.span>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
        className="mt-6 text-2xl font-semibold tracking-tight text-text"
      >
        {isLogin ? '¡Bienvenido de nuevo!' : '¡Tu cuenta está lista!'}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
        className="mt-2 text-sm leading-relaxed text-text-secondary"
        aria-live="polite"
      >
        {isLogin
          ? 'Has iniciado sesión correctamente. Te estamos llevando a tu espacio de trabajo.'
          : 'Tu cuenta se creó correctamente. Ahora puedes iniciar sesión.'}
      </motion.p>
    </div>
  );
}