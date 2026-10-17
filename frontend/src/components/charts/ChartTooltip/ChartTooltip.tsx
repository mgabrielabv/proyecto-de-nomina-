import type { ReactNode } from 'react';
import { formatNumber } from '../../../utils';

export interface ChartTooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

export interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
  formatter?: (value: number) => string;
  labelFormatter?: (label: string | number) => string;
}

export function ChartTooltip({ active, payload, label, formatter = formatNumber, labelFormatter }: ChartTooltipProps): ReactNode {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 shadow-card">
      {label !== undefined && (
        <p className="mb-1.5 text-xs font-semibold tracking-tight text-text">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums text-text">
              {typeof entry.value === 'number' ? formatter(entry.value) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
