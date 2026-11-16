import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASE } from '../../../constants';
import { useEffect, useRef, useState } from 'react';
import { PASSWORD_STRENGTH_LABELS } from '../../../constants';
import { getPasswordIssues, getPasswordStrengthScore } from '../../../features/auth/validators';
import { cn } from '../../../utils';

export interface PasswordStrengthProps {
  password: string;
  /** Muestra el checklist de requisitos (registro/cambio). */
  showChecklist?: boolean;
}

const SEGMENTS = 4;

function getBandColor(score: number): string {
  if (score <= 1) return 'var(--color-error)';
  if (score === 2) return 'var(--color-warning)';
  if (score === 3) return 'var(--color-text-secondary)';
  return 'var(--color-success)';
}

function getScoreLabel(score: number): string {
  return PASSWORD_STRENGTH_LABELS[Math.min(score, PASSWORD_STRENGTH_LABELS.length - 1)] ?? '';
}

export function PasswordStrength({ password, showChecklist = true }: PasswordStrengthProps) {
  const reduce = useReducedMotion();
  const score = getPasswordStrengthScore(password);
  const hasInput = password.length > 0;
  const bandColor = getBandColor(score);
  const issues = getPasswordIssues(password);
  const [interacted, setInteracted] = useState(false);
  const prev = useRef(password);

  useEffect(() => {
    if (password !== prev.current) {
      if (password.length > 0) setInteracted(true);
      prev.current = password;
    }
  }, [password]);

  return (
    <AnimatePresence initial={false}>
      {hasInput && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE.out }}
          className="overflow-hidden"
          role="status"
          aria-live="polite"
        >
          <div className="pt-1">
            <div className="flex items-center gap-1.5" aria-hidden>
              {Array.from({ length: SEGMENTS }, (_, index) => {
                const active = index < Math.max(1, score);
                const fill = score === 0 ? 0 : active ? 1 : 0;
                return (
                  <span key={index} className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/70">
                    <motion.span
                      className="block h-full origin-left rounded-full"
                      initial={false}
                      animate={{
                        scaleX: fill ? 1 : 0,
                        backgroundColor: fill ? bandColor : 'transparent',
                        opacity: fill ? 1 : 0.5,
                      }}
                      transition={{ duration: DURATION.fast, ease: EASE.out }}
                    />
                  </span>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <motion.span
                key={score}
                initial={reduce ? false : { opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  score <= 1 ? 'text-error' : score === 2 ? 'text-warning' : score === 3 ? 'text-text-secondary' : 'text-success',
                )}
              >
                {getScoreLabel(score)}
              </motion.span>
              <span className="text-text-muted">Fortaleza de la contraseña</span>
            </div>

            {showChecklist && (
              <ul className="mt-3 space-y-1.5" aria-label="Requisitos de la contraseña">
                {issues.map((issue) => {
                  const failed = interacted && password.length > 0 && !issue.ok;
                  return (
                    <li key={issue.id} className="flex items-center gap-2 text-xs">
                      <motion.span
                        aria-hidden
                        initial={false}
                        animate={{
                          backgroundColor: issue.ok ? 'var(--color-success)' : 'transparent',
                          borderColor: issue.ok ? 'var(--color-success)' : failed ? 'var(--color-error)' : 'var(--color-border-strong)',
                          scale: issue.ok ? 1 : 0.92,
                        }}
                        transition={{ duration: DURATION.fast }}
                        className="flex h-4 w-4 items-center justify-center rounded-full border"
                      >
                        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none">
                          <motion.path
                            d="M3.5 8.5L6.5 11.5L12.5 4.5"
                            stroke="var(--color-accent-text)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={false}
                            animate={{ pathLength: issue.ok ? 1 : 0, opacity: issue.ok ? 1 : 0 }}
                            transition={{ duration: DURATION.fast }}
                          />
                        </svg>
                      </motion.span>
                      <span
                        className={cn(
                          'transition-colors duration-150',
                          issue.ok ? 'text-success' : failed ? 'text-error' : 'text-text-muted',
                        )}
                      >
                        {issue.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
