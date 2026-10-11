import { AnimatePresence, motion } from 'framer-motion';
import { fadeSwapVariants } from '../../../animations/variants';
import type { AuthMode } from '../../../features/auth/types';

export interface AuthModeToggleProps {
  mode: AuthMode;
  onSwitch: () => void;
}

export function AuthModeToggle({ mode, onSwitch }: AuthModeToggleProps) {
  const isLogin = mode === 'login';

  return (
    <div className="border-t border-border pt-6 text-center">
      <p className="text-sm text-text-secondary">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`prompt-${mode}`}
            variants={fadeSwapVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="inline-block"
          >
            {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          </motion.span>
        </AnimatePresence>{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-text underline-offset-4 transition-colors duration-200 hover:underline"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`action-${mode}`}
              variants={fadeSwapVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="inline-block"
            >
              {isLogin ? 'Crear cuenta' : 'Inicia sesión'}
            </motion.span>
          </AnimatePresence>
        </button>
      </p>
    </div>
  );
}