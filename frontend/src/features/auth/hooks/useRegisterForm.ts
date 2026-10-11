import { useCallback, useState, type FormEvent } from 'react';
import { signUp } from '../services';
import type { RegisterValues, SubmitState } from '../types';
import { validateRegister } from '../validators';
import { useForm } from './useForm';

export interface UseRegisterFormResult {
  values: RegisterValues;
  getError: (field: keyof RegisterValues) => string | undefined;
  setField: (field: keyof RegisterValues, value: string) => void;
  handleBlur: (field: keyof RegisterValues) => void;
  submitState: SubmitState;
  serverError: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useRegisterForm(onSuccess?: () => void): UseRegisterFormResult {
  const form = useForm<RegisterValues>({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate: validateRegister,
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitState === 'loading' || submitState === 'success') return;
      if (!form.submitAndValidate()) return;
      setSubmitState('loading');
      setServerError(null);
      void signUp({ email: form.values.email, password: form.values.password }).then((result) => {
        if (result.ok) {
          setSubmitState('success');
          onSuccess?.();
        } else {
          setSubmitState('idle');
          setServerError(result.error);
        }
      });
    },
    [form, onSuccess, submitState],
  );

  return { ...form, submitState, serverError, handleSubmit };
}