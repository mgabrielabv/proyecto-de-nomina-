import { AnimatePresence, motion } from 'framer-motion';
import { PASSWORD_STRENGTH_HINT, PASSWORD_STRENGTH_LABELS } from '../../../constants';
import { getPasswordStrengthScore } from '../../../features/auth/validators';

export interface PasswordStrengthProps {
  password: string;
}

const SEGMENTS = 4;

function getBandColor(score: number): string {
  if (score <= 1) return 'var(--color-error)';
  if (score === 2) return 'var(--color-text-muted)';
  return 'var(--color-success)';
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = getPasswordStrengthScore(password);
  const hasInput = password.length > 0;
  const bandColor = getBandColor(score);

  return (
    <AnimatePresence initial={false}>
      {hasInput && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="overflow-hidden"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: SEGMENTS }, (_, index) => (
              <motion.span
                key={index}
                className="h-1 flex-1 rounded-full"
                initial={false}
                animate={{
                  backgroundColor: index < score ? bandColor : 'var(--color-border)',
                  opacity: index < score ? 1 : 0.5,
                }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={score <= 1 ? 'text-error' : score === 2 ? 'text-text-muted' : 'text-success'}>
              {PASSWORD_STRENGTH_LABELS[score]}
            </span>
            <span className="text-text-muted">{PASSWORD_STRENGTH_HINT}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}