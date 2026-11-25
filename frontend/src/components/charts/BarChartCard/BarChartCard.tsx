import { motion, useReducedMotion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  CHART_ANIMATION_DURATION,
  CHART_AXIS,
  CHART_GRID,
  CHART_MARGIN,
  CHART_PALETTE,
} from '../../../constants';
import { chartDrawVariants } from '../../../animations/variants';
import { cn, formatNumber } from '../../../utils';
import { ChartTooltip } from '../ChartTooltip';

export interface BarChartSeries {
  key: string;
  label: string;
}

export interface BarChartCardProps {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: BarChartSeries[];
  formatter?: (value: number) => string;
  height?: number;
  className?: string;
  layout?: 'horizontal' | 'vertical';
  stacked?: boolean;
}

export function BarChartCard(props: BarChartCardProps) {
  const {
    title,
    description,
    data,
    xKey,
    series,
    formatter = formatNumber,
    height = 260,
    className,
    layout = 'horizontal',
    stacked = false,
  } = props;
  const reduce = useReducedMotion();

  return (
    <motion.section
      variants={chartDrawVariants}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className={cn('glass-card p-6', className)}
    >
      <header className="mb-5">
        <h3 className="text-sm font-semibold tracking-tight text-text">{title}</h3>
        {description && <p className="mt-1 text-xs text-text-muted">{description}</p>}
      </header>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={layout} margin={CHART_MARGIN}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={layout === 'vertical'} horizontal={layout === 'horizontal'} />
            <XAxis
              dataKey={layout === 'vertical' ? undefined : xKey}
              type={layout === 'vertical' ? 'number' : 'category'}
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
              tickFormatter={layout === 'vertical' ? (value: number) => formatter(value) : undefined}
            />
            <YAxis
              dataKey={layout === 'vertical' ? xKey : undefined}
              type={layout === 'vertical' ? 'category' : 'number'}
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={layout === 'vertical' ? 92 : 48}
              tickFormatter={layout === 'vertical' ? undefined : (value: number) => formatter(value)}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-spot)' }}
              content={<ChartTooltip formatter={formatter} />}
            />
            {series.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                stackId={stacked ? 'stack' : undefined}
                fill={CHART_PALETTE[index % CHART_PALETTE.length]}
                radius={layout === 'vertical' ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                maxBarSize={layout === 'vertical' ? 22 : 40}
                isAnimationActive={!reduce}
                animationDuration={CHART_ANIMATION_DURATION}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
