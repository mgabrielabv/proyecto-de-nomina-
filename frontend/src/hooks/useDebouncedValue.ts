import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, wait = 260): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), wait);
    return () => window.clearTimeout(timer);
  }, [value, wait]);

  return debounced;
}
