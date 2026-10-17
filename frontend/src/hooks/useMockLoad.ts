import { useEffect, useMemo, useState } from 'react';
import { MOCK_LATENCY_MAX, MOCK_LATENCY_MIN } from '../constants';
import { randomLatency } from '../utils';

export function useMockLoad(): boolean {
  const latency = useMemo(() => randomLatency(MOCK_LATENCY_MIN, MOCK_LATENCY_MAX), []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), latency);
    return () => window.clearTimeout(timer);
  }, [latency]);

  return loading;
}
