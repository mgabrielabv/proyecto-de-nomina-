import { motion, useReducedMotion } from 'framer-motion';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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

export interface LineChartSeries {
  key: string;
  label: string;
}

export interface LineChartCardProps {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: LineChartSeries[];
  formatter?: (value: number) => string;
  height?: number;
  className?: string;
}

export function LineChartCard(props: LineChartCardProps) {
  const {
    title,
    description,
    data,
    xKey,
    series,
    formatter = formatNumber,
    height = 260,
    className,
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
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey={xKey}
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_AXIS, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(value: number) => formatter(value)}
            />
            <Tooltip content={<ChartTooltip formatter={formatter} />} />
            {series.map((item, index) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={CHART_PALETTE[index % CHART_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: CHART_PALETTE[index % CHART_PALETTE.length] }}
                activeDot={{ r: 5 }}
                isAnimationActive={!reduce}
                animationDuration={CHART_ANIMATION_DURATION}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
