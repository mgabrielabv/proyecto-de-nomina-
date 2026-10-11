import { AnimatePresence, motion, useReducedMotion, type AnimationDefinition } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { authCardVariants, modeSwapVariants, successCardVariants } from '../../../animations/variants';
import { SUCCESS_EXIT_DELAY } from '../../../constants';
import type { AuthMode } from '../../../features/auth/types';
import { cn } from '../../../utils';
import { BrandMark } from '../../ui/BrandMark';
import { AuthModeToggle } from '../AuthModeToggle';
import { AuthSuccess } from '../AuthSuccess';
import { LoginForm } from '../LoginForm';
import { RegisterForm } from '../RegisterForm';

type AuthStage = 'auth' | 'done';

export function AuthCard() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>('login');
  const [stage, setStage] = useState<AuthStage>('auth');
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  const handleSuccess = () => {
    if (reduce) {
      setStage('done');
      return;
    }
    exitTimer.current = window.setTimeout(() => setExiting(true), SUCCESS_EXIT_DELAY);
  };

  const handleAnimationComplete = (definition: AnimationDefinition) => {
    if (definition === 'exit') setStage('done');
  };

  const switchMode = () => setMode((current) => (current === 'login' ? 'register' : 'login'));

  return (
    <div className="w-full max-w-[440px]">
      <AnimatePresence mode="wait">
        {stage === 'auth' ? (
          <motion.div
            key="auth"
            variants={authCardVariants}
            initial={reduce ? false : 'hidden'}
            animate={exiting ? 'exit' : 'show'}
            onAnimationComplete={handleAnimationComplete}
            className={cn('glass-card relative overflow-hidden p-6 sm:p-8 lg:p-9')}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent"
            />
            <div className="grain pointer-events-none absolute inset-0" aria-hidden />
            <BrandMark className="relative" />
            <div className="relative mt-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={mode} variants={modeSwapVariants} initial="hidden" animate="show" exit="exit">
                  {mode === 'login' ? (
                    <LoginForm onSuccess={handleSuccess} />
                  ) : (
                    <RegisterForm onSuccess={handleSuccess} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="relative mt-8">
              <AuthModeToggle mode={mode} onSwitch={switchMode} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" variants={successCardVariants} initial={reduce ? false : 'hidden'} animate="show">
            <AuthSuccess mode={mode} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}