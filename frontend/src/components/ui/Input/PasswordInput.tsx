import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { iconSwapVariants } from '../../../animations/variants';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Pick<
  InputProps,
  'name' | 'label' | 'value' | 'error' | 'success' | 'onChange' | 'onBlurField' | 'autoComplete' | 'required'
>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
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
  );
}