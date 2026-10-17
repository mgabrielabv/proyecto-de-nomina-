import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Gift, Wallet } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { SkeletonStatGrid, SkeletonChart, SkeletonList } from '../../components/ui/Skeleton';
import { useSessionStore, useUiStore } from '../../store';
import { fetchAnnouncements, fetchWeeklyHours } from '../../features/dashboard/services';
import { getGreeting, formatCurrency, formatDateShort, formatNumber } from '../../utils';
import type { Announcement } from '../../types';

export function UserDashboard() {
  const user = useSessionStore((state) => state.user);
  const notifications = useUiStore((state) => state.notifications);

  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [weeklyHours, setWeeklyHours] = useState<Array<{ week: string; horas: number }>>([]);

  useEffect(() => {
    void (async () => {
      const [nextAnnouncements, nextHours] = await Promise.all([fetchAnnouncements(), fetchWeeklyHours()]);
      setAnnouncements(nextAnnouncements);
      setWeeklyHours(nextHours);
    })();
  }, []);

  if (!user) return null;

  const loading = announcements === null;
  const pendingCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${getGreeting()} ${user.name.split(' ')[0]}`}
        description="Resumen de tu actividad y novedades en la plataforma."
      />
      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-6">
        {loading ? (
          <SkeletonStatGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Días de vacaciones disponibles" value={24} icon={Gift} hint="Año en curso" tone="success" />
            <StatCard label="Próximo pago" value={3200} icon={Wallet} formatter={formatCurrency} hint="Quincena en curso" />
            <StatCard label="Horas del mes" value={144} icon={Clock} formatter={formatNumber} hint="Últimas 4 semanas" />
            <StatCard
              label="Solicitudes pendientes"
              value={pendingCount}
              icon={FileText}
              tone={pendingCount > 0 ? 'warning' : 'neutral'}
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
              title="Horas trabajadas por semana"
              description="Últimas semanas"
              data={weeklyHours}
              xKey="week"
              series={[{ key: 'horas', label: 'Horas' }]}
              formatter={formatNumber}
              className="lg:col-span-2"
            />
            <Card padding="lg" className="space-y-4">
              <header>
                <h3 className="text-sm font-semibold tracking-tight text-text">Anuncios de la empresa</h3>
                <p className="mt-1 text-xs text-text-muted">Actualizaciones y novedades</p>
              </header>
              <ul className="space-y-3.5">
                {announcements.slice(0, 3).map((item) => (
                  <li key={item.id} className="rounded-xl border border-border bg-surface-soft/70 p-3.5">
                    <p className="text-sm font-medium text-text">{item.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatDateShort(item.date)} • {item.tag}
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
