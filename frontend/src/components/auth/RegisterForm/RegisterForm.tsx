import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { fadeUpItem, staggerContainer } from '../../../animations/variants';
import { useRegisterForm } from '../../../features/auth/hooks';
import { Button } from '../../ui/Button';
import { Input, PasswordInput } from '../../ui/Input';
import { PasswordStrength } from '../PasswordStrength';

export interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const reduce = useReducedMotion();
  const { values, getError, setField, handleBlur, submitState, serverError, handleSubmit } = useRegisterForm(onSuccess);

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
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-[28px]">Crea tu cuenta</h1>
        <p className="text-sm text-text-secondary">Empieza gratis en menos de un minuto.</p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-4">
        <Input
          name="name"
          label="Nombre"
          autoComplete="name"
          value={values.name}
          onChange={(value) => setField('name', value)}
          onBlurField={() => handleBlur('name')}
          error={getError('name')}
          success={values.name.length > 0 && !getError('name')}
        />
        <Input
          name="email"
          label="Correo electrónico"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={(value) => setField('email', value)}
          onBlurField={() => handleBlur('email')}
          error={getError('email')}
          success={values.email.length > 0 && !getError('email')}
        />
        <PasswordInput
          name="password"
          label="Contraseña"
          autoComplete="new-password"
          value={values.password}
          onChange={(value) => setField('password', value)}
          onBlurField={() => handleBlur('password')}
          error={getError('password')}
          success={values.password.length > 0 && !getError('password')}
        />
        <PasswordStrength password={values.password} />
        <PasswordInput
          name="confirmPassword"
          label="Confirma tu contraseña"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(value) => setField('confirmPassword', value)}
          onBlurField={() => handleBlur('confirmPassword')}
          error={getError('confirmPassword')}
          success={values.confirmPassword.length > 0 && !getError('confirmPassword')}
        />
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
        <Button type="submit" state={submitState} size="lg" fullWidth successLabel="Cuenta creada">
          {submitState === 'loading' ? 'Creando cuenta' : 'Crear cuenta'}
        </Button>
      </motion.div>

      <motion.p variants={fadeUpItem} className="text-center text-xs leading-relaxed text-text-muted">
        Al crear tu cuenta aceptas nuestros{' '}
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="font-medium text-text-secondary underline-offset-4 transition-colors duration-200 hover:text-text hover:underline"
        >
          términos
        </a>{' '}
        y la{' '}
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="font-medium text-text-secondary underline-offset-4 transition-colors duration-200 hover:text-text hover:underline"
        >
          política de privacidad
        </a>
        .
      </motion.p>
    </motion.form>
  );
}