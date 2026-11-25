import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type KeyboardEvent } from 'react';
import { iconSwapVariants } from '../../../animations/variants';
import { cn } from '../../../utils';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Pick<
  InputProps,
  'name' | 'label' | 'value' | 'error' | 'success' | 'onChange' | 'onBlurField' | 'autoComplete' | 'required' | 'hint'
> & {
  /** Límite duro de caracteres del input (seguridad). Por defecto 128. */
  maxLength?: number;
  /** Muestra contador (auto por defecto, cuenta bytes para contraseña). */
  showCounter?: boolean | 'auto';
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const { maxLength = 128, showCounter = 'auto', ...rest } = props;

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  };

  return (
    <div className="space-y-1">
      <Input
        {...rest}
        ref={ref}
        type={visible ? 'text' : 'password'}
        autoComplete={rest.autoComplete ?? 'current-password'}
        maxLength={maxLength}
        showCounter={showCounter}
        onKeyDown={handleKey as any}
        onKeyUp={handleKey as any}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            style={{ perspective: 500 }}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors duration-200 hover:bg-surface hover:text-text"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={visible ? 'visible' : 'hidden'}
                variants={iconSwapVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex"
              >
                {visible ? (
                  <EyeOff className="h-[18px] w-[18px]" aria-hidden />
                ) : (
                  <Eye className="h-[18px] w-[18px]" aria-hidden />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        }
      />
      <AnimatePresence initial={false}>
        {capsLock && (
          <motion.div
            initial={{ opacity: 0, y: -2, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -2, height: 0 }}
            className="overflow-hidden"
          >
            <span className={cn('inline-flex items-center rounded-md border border-warning/35 bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning')}>
              Bloq Mayús activado
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
