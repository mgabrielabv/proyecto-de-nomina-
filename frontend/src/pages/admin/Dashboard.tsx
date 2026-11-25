import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Wallet, ClipboardList, CalendarCheck } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { BarChartCard } from '../../components/charts/BarChartCard';
import { DonutChartCard } from '../../components/charts/DonutChartCard';
import { SkeletonStatGrid, SkeletonChart, SkeletonList } from '../../components/ui/Skeleton';
import {
  fetchActivity,
  fetchDepartmentDistribution,
  fetchGlobalMetrics,
  fetchPayrollCostSeries,
  fetchWeeklyHours,
} from '../../features/dashboard/services';
import { formatCompactCurrency, formatDateShort, formatNumber } from '../../utils';
import type { ActivityItem } from '../../mocks';

interface Metrics {
  headcount: number;
  monthlyPayroll: number;
  pendingRequests: number;
  attendanceToday: number;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [costSeries, setCostSeries] = useState<Array<{ month: string; costo: number }>>([]);
  const [distribution, setDistribution] = useState<Array<{ name: string; value: number }>>([]);
  const [weeklyHours, setWeeklyHours] = useState<Array<{ week: string; horas: number }>>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    void (async () => {
      const [nextMetrics, nextCost, nextDistribution, nextHours, nextActivity] = await Promise.all([
        fetchGlobalMetrics(),
        fetchPayrollCostSeries(),
        fetchDepartmentDistribution(),
        fetchWeeklyHours(),
        fetchActivity(),
      ]);
      setMetrics(nextMetrics);
      setCostSeries(nextCost);
      setDistribution(nextDistribution);
      setWeeklyHours(nextHours);
      setActivity(nextActivity);
    })();
  }, []);

  const loading = metrics === null;

  return (
    <div className="space-y-6">
      <PageHeader title="Panel administrativo" description="Métricas globales y actividad de la organización." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-6">
        {loading ? (
          <SkeletonStatGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total de empleados" value={metrics?.headcount ?? 0} icon={Users} />
            <StatCard
              label="Nómina neta del mes"
              value={metrics?.monthlyPayroll ?? 0}
              icon={Wallet}
              formatter={formatCompactCurrency}
            />
            <StatCard
              label="Solicitudes pendientes"
              value={metrics?.pendingRequests ?? 0}
              icon={ClipboardList}
              tone={metrics && metrics.pendingRequests > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              label="Asistencia del día"
              value={metrics?.attendanceToday ?? 0}
              icon={CalendarCheck}
              tone="success"
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SkeletonChart className="lg:col-span-2" />
            <SkeletonList rows={5} />
          </div>
        ) : (
          <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <LineChartCard
              title="Costo de nómina por mes"
              description="Últimos periodos mensuales"
              data={costSeries}
              xKey="month"
              series={[{ key: 'costo', label: 'Costo' }]}
              formatter={formatCompactCurrency}
              className="lg:col-span-2"
            />
            <DonutChartCard title="Distribución por departamento" data={distribution} centerLabel="Empleados" />
          </motion.div>
        )}

        {!loading && (
          <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <BarChartCard
              title="Actividad reciente"
              description="Horas registradas por semana"
              data={weeklyHours}
              xKey="week"
              series={[{ key: 'horas', label: 'Horas' }]}
              formatter={formatNumber}
              className="lg:col-span-2"
            />
            <Card padding="lg" className="space-y-4">
              <header>
                <h3 className="text-sm font-semibold tracking-tight text-text">Últimos movimientos</h3>
                <p className="mt-1 text-xs text-text-muted">Actividad de la organización</p>
              </header>
              <ul className="space-y-3">
                {activity.slice(0, 5).map((item) => (
                  <li key={item.id} className="rounded-xl border border-border bg-surface-soft/70 p-3.5">
                    <p className="text-sm text-text">{item.text}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatDateShort(item.date)} • {item.meta}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
