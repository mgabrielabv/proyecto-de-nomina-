import { AnimatePresence, motion, useReducedMotion, type AnimationDefinition } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authCardVariants, modeSwapVariants, successCardVariants } from '../../../animations/variants';
import { SUCCESS_EXIT_DELAY } from '../../../constants';
import { useSessionStore } from '../../../store';
import type { ProfileRef, SessionUser, UserRole } from '../../../types';
import { cn, getRoleHomePath, profileToRole } from '../../../utils';
import { BrandMark } from '../../ui/BrandMark';
import { AuthSuccess } from '../AuthSuccess';
import { LoginForm } from '../LoginForm';
import { ProfilePicker } from '../ProfilePicker';

type AuthStage = 'auth' | 'select' | 'done';

export function AuthCard() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const setActiveProfile = useSessionStore((state) => state.setActiveProfile);
  const [stage, setStage] = useState<AuthStage>('auth');
  const [exiting, setExiting] = useState(false);
  const [pendingUser, setPendingUser] = useState<SessionUser | null>(null);
  const exitTimer = useRef<number | undefined>(undefined);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(exitTimer.current);
      window.clearTimeout(redirectTimer.current);
    },
    [],
  );

  const goToHome = (role: UserRole) => {
    redirectTimer.current = window.setTimeout(
      () => navigate(getRoleHomePath(role), { replace: true }),
      900,
    );
  };

  const showSuccess = () => {
    if (reduce) {
      setStage('done');
      return;
    }
    exitTimer.current = window.setTimeout(() => setExiting(true), SUCCESS_EXIT_DELAY);
  };

  const handleSuccess = (user: SessionUser) => {
    // Multi-perfil: se elige antes de persistir la sesión. Un solo perfil:
    // se guarda y se entra directo.
    if (user.profiles.length > 1) {
      setPendingUser(user);
      setStage('select');
      return;
    }
    setSession(user);
    goToHome(user.role);
    showSuccess();
  };

  const handleProfileSelect = (profile: ProfileRef) => {
    // Recién acá se persiste la sesión (con el perfil elegido). Antes no se
    // toca el store: si se guardara al autenticar, LoginPage redirigiría al
    // dashboard y el selector nunca se vería.
    if (!pendingUser) return;
    setSession({ ...pendingUser, activeProfile: profile, role: profileToRole(profile.nombre) });
    setActiveProfile(profile);
    setPendingUser(null);
    goToHome(profileToRole(profile.nombre));
    showSuccess();
  };

  const handleAnimationComplete = (definition: AnimationDefinition) => {
    if (definition === 'exit') setStage('done');
  };

  return (
    <div className="w-full max-w-[440px]">
      <AnimatePresence mode="wait">
        {stage !== 'done' ? (
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
                {stage === 'select' && pendingUser ? (
                  <motion.div key="select" variants={modeSwapVariants} initial="hidden" animate="show" exit="exit">
                    <ProfilePicker profiles={pendingUser.profiles} onSelect={handleProfileSelect} />
                  </motion.div>
                ) : (
                  <motion.div key="login" variants={modeSwapVariants} initial="hidden" animate="show" exit="exit">
                    <LoginForm onSuccess={handleSuccess} />
                  </motion.div>
                )}
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
