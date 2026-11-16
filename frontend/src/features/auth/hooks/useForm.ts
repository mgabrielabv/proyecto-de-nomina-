import { useCallback, useEffect, useRef, useState } from 'react';
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
  clearField: (field: keyof T) => void;
  handleBlur: (field: keyof T) => void;
  submitAndValidate: () => boolean;
  reset: () => void;
  registerFieldRef: (field: keyof T) => (el: HTMLElement | null) => void;
}

export function useForm<T extends object>(config: UseFormConfig<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(config.initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [debouncedValues, setDebouncedValues] = useState<T>(config.initialValues);
  const fieldRefs = useRef<Partial<Record<keyof T, HTMLElement | null>>>({});
  const timers = useRef<Partial<Record<keyof T, number>>>({});

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((t) => {
        if (typeof t === 'number') window.clearTimeout(t);
      });
    };
  }, []);

  const errorsNow = config.validate(values);
  const errorsDebounced = config.validate(debouncedValues);

  const getError = useCallback(
    (field: keyof T): string | undefined => {
      if (!touched[field] && !submitted) return undefined;
      // While typing after touched: use debounced validation to avoid flicker
      if (touched[field] && !submitted) return errorsDebounced[field];
      return errorsNow[field];
    },
    [errorsDebounced, errorsNow, submitted, touched],
  );

  const scheduleDebounce = useCallback((field: keyof T, nextValues: T) => {
    const prev = timers.current[field];
    if (typeof prev === 'number') window.clearTimeout(prev);
    timers.current[field] = window.setTimeout(() => {
      setDebouncedValues((current) => ({ ...current, [field]: (nextValues as any)[field] }) as T);
    }, 300);
  }, []);

  const setField = useCallback(
    (field: keyof T, value: string) => {
      setValues((current) => {
        const next = { ...current, [field]: value } as T;
        // Only debounce-validate if already touched/submitted; do not mark touched on first type
        if (touched[field] || submitted) {
          scheduleDebounce(field, next);
        } else {
          // keep debounced in sync silently so first blur shows correct error
          setDebouncedValues((d) => ({ ...d, [field]: value }) as T);
        }
        return next;
      });
    },
    [scheduleDebounce, submitted, touched],
  );

  const clearField = useCallback((field: keyof T) => {
    setValues((current) => ({ ...current, [field]: '' }) as T);
    setDebouncedValues((current) => ({ ...current, [field]: '' }) as T);
    setTouched((current) => ({ ...current, [field]: false }));
    setSubmitted(false);
  }, []);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((current) => ({ ...current, [field]: true }));
    setDebouncedValues((current) => ({ ...current, [field]: (values as any)[field] }) as T);
  }, [values]);

  const registerFieldRef = useCallback(
    (field: keyof T) => (el: HTMLElement | null) => {
      fieldRefs.current[field] = el;
    },
    [],
  );

  const submitAndValidate = useCallback(() => {
    setSubmitted(true);
    setDebouncedValues(values);
    const errs = config.validate(values);
    const keys = Object.keys(values as object) as (keyof T)[];
    const firstInvalid = keys.find((k) => Boolean((errs as any)[k]));
    const ok = !firstInvalid;
    if (firstInvalid) {
      const el = fieldRefs.current[firstInvalid];
      if (el) {
        window.setTimeout(() => {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch {
            // ignore
          }
          if (typeof (el as any).focus === 'function') (el as any).focus({ preventScroll: true });
        }, 0);
      }
    }
    return ok;
  }, [config, values]);

  const reset = useCallback(() => {
    setValues(config.initialValues);
    setDebouncedValues(config.initialValues);
    setTouched({});
    setSubmitted(false);
  }, [config.initialValues]);

  return { values, touched, getError, setField, clearField, handleBlur, submitAndValidate, reset, registerFieldRef };
}
