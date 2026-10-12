import { useCallback, useState, type FormEvent } from 'react';
import { signIn } from '../services';
import type { LoginValues, SubmitState } from '../types';
import { validateLogin } from '../validators';
import { useForm } from './useForm';

export interface UseLoginFormResult {
  values: LoginValues;
  getError: (field: keyof LoginValues) => string | undefined;
  setField: (field: keyof LoginValues, value: string) => void;
  handleBlur: (field: keyof LoginValues) => void;
  submitState: SubmitState;
  serverError: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function useLoginForm(onSuccess?: () => void): UseLoginFormResult {
  const form = useForm<LoginValues>({ initialValues: { username: '', password: '' }, validate: validateLogin });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (submitState === 'loading' || submitState === 'success') return;
      if (!form.submitAndValidate()) return;
      setSubmitState('loading');
      setServerError(null);
      void signIn({ username: form.values.username, password: form.values.password }).then((result) => {
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