import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { fadeUpItem, staggerContainer } from '../../../animations/variants';
import { useLoginForm } from '../../../features/auth/hooks';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { Input, PasswordInput } from '../../ui/Input';

export interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const reduce = useReducedMotion();
  const [remember, setRemember] = useState(false);
  const { values, getError, setField, handleBlur, submitState, serverError, handleSubmit } = useLoginForm(onSuccess);

  return (
    <motion.form
      noValidate
      onSubmit={handleSubmit}
      variants={staggerContainer(0.06, reduce ? 0 : 0.08)}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={fadeUpItem} className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-[28px]">Bienvenido de nuevo</h1>
        <p className="text-sm text-text-secondary">Inicia sesión para continuar con tu cuenta.</p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-4">
        <Input
          name="username"
          label="Usuario"
          type="text"
          autoComplete="username"
          value={values.username}
          onChange={(value) => setField('username', value)}
          onBlurField={() => handleBlur('username')}
          error={getError('username')}
          success={values.username.length > 0 && !getError('username')}
        />
        <PasswordInput
          name="password"
          label="Contraseña"
          autoComplete="current-password"
          value={values.password}
          onChange={(value) => setField('password', value)}
          onBlurField={() => handleBlur('password')}
          error={getError('password')}
          success={values.password.length > 0 && !getError('password')}
        />
      </motion.div>

      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-4 pt-1">
        <Checkbox name="remember" label="Recordarme" checked={remember} onChange={setRemember} />
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="text-sm font-medium text-text-secondary underline-offset-4 transition-colors duration-200 hover:text-text hover:underline"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </motion.div>

      <AnimatePresence initial={false}>
        {serverError && (
          <motion.div
            key={serverError}
            variants={fadeUpItem}
            initial="hidden"
            animate="show"
            exit="hidden"
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-2.5 rounded-lg border border-error/25 bg-error-soft px-3.5 py-2.5 text-sm text-error"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUpItem}>
        <Button type="submit" state={submitState} size="lg" fullWidth successLabel="¡Listo!">
          {submitState === 'loading' ? 'Iniciando sesión' : 'Iniciar sesión'}
        </Button>
      </motion.div>
    </motion.form>
  );
}