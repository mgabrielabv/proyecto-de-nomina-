import { AnimatePresence, motion, useReducedMotion, type AnimationDefinition } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { authCardVariants, modeSwapVariants, successCardVariants } from '../../../animations/variants';
import { SUCCESS_EXIT_DELAY } from '../../../constants';
import { cn } from '../../../utils';
import { BrandMark } from '../../ui/BrandMark';
import { AuthSuccess } from '../AuthSuccess';
import { LoginForm } from '../LoginForm';

type AuthStage = 'auth' | 'done';

export function AuthCard() {
  const reduce = useReducedMotion();
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
                <motion.div key="login" variants={modeSwapVariants} initial="hidden" animate="show" exit="exit">
                  <LoginForm onSuccess={handleSuccess} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div key="success" variants={successCardVariants} initial={reduce ? false : 'hidden'} animate="show">
            <AuthSuccess mode="login" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}