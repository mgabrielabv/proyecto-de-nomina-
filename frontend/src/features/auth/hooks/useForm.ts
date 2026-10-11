import { useCallback, useState } from 'react';
import type { FieldErrors } from '../types';

export interface UseFormConfig<T extends object> {
  initialValues: T;
  validate: (values: T) => FieldErrors<T>;
}

export interface UseFormResult<T extends object> {
  values: T;
  touched: Partial<Record<keyof T, boolean>>;
  getError: (field: keyof T) => string | undefined;
  setField: (field: keyof T, value: string) => void;
  handleBlur: (field: keyof T) => void;
  submitAndValidate: () => boolean;
  reset: () => void;
}

export function useForm<T extends object>(config: UseFormConfig<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(config.initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = config.validate(values);

  const getError = useCallback(
    (field: keyof T): string | undefined => (touched[field] || submitted ? errors[field] : undefined),
    [errors, submitted, touched],
  );

  const setField = useCallback((field: keyof T, value: string) => {
    setValues((current) => ({ ...current, [field]: value }) as T);
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const submitAndValidate = useCallback(() => {
    setSubmitted(true);
    return Object.values(errors).every((error) => !error);
  }, [errors]);

  const reset = useCallback(() => {
    setValues(config.initialValues);
    setTouched({});
    setSubmitted(false);
  }, [config.initialValues]);

  return { values, touched, getError, setField, handleBlur, submitAndValidate, reset };
}