import { motion, useReducedMotion } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_ANIMATION_DURATION, CHART_PALETTE } from '../../../constants';
import { chartDrawVariants } from '../../../animations/variants';
import { cn, formatNumber } from '../../../utils';
import { ChartTooltip } from '../ChartTooltip';

export interface DonutDatum {
  name: string;
  value: number;
}

export interface DonutChartCardProps {
  title: string;
  description?: string;
  data: DonutDatum[];
  formatter?: (value: number) => string;
  height?: number;
  className?: string;
  centerLabel?: string;
}

export function DonutChartCard(props: DonutChartCardProps) {
  const {
    title,
    description,
    data,
    formatter = formatNumber,
    height = 240,
    className,
    centerLabel,
  } = props;
  const reduce = useReducedMotion();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <motion.section
      variants={chartDrawVariants}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className={cn('glass-card p-6', className)}
    >
      <header className="mb-4">
        <h3 className="text-sm font-semibold tracking-tight text-text">{title}</h3>
        {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
      </header>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative w-full max-w-[200px]" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltip formatter={formatter} />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="var(--color-surface)"
                strokeWidth={2}
                isAnimationActive={!reduce}
                animationDuration={CHART_ANIMATION_DURATION}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums tracking-tight text-text">{formatNumber(total)}</span>
            {centerLabel && <span className="text-[11px] uppercase tracking-wider text-text-muted">{centerLabel}</span>}
          </div>
        </div>
        <ul className="w-full flex-1 space-y-2.5">
          {data.map((item, index) => (
            <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-text-secondary">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CHART_PALETTE[index % CHART_PALETTE.length] }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-medium tabular-nums text-text">{formatter(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
