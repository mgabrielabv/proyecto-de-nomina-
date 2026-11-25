import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, UserCheck, UserMinus, Wallet } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { LineChartCard } from '../../components/charts/LineChartCard';
import { DonutChartCard } from '../../components/charts/DonutChartCard';
import { useEmployeesStore, useToastStore } from '../../store';
import {
  buildEmployeesCsv,
  buildPayrollCsv,
  downloadCsv,
  fetchReportSummary,
} from '../../features/reports/services';
import { fetchDepartmentDistribution, fetchPayrollCostSeries } from '../../features/dashboard/services';
import { TOAST_MESSAGES } from '../../constants';
import { formatCompactCurrency, formatCurrency } from '../../utils';
import type { PayrollPeriodType } from '../../types';

interface Summary {
  active: number;
  inactive: number;
  payrollTotal: number;
  averageSalary: number;
}

export function AdminReports() {
  const push = useToastStore((state) => state.push);
  const { load: loadEmployees } = useEmployeesStore();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [costSeries, setCostSeries] = useState<Array<{ month: string; costo: number }>>([]);
  const [distribution, setDistribution] = useState<Array<{ name: string; value: number }>>([]);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    void loadEmployees();
    void (async () => {
      const [nextSummary, nextCost, nextDistribution] = await Promise.all([
        fetchReportSummary(),
        fetchPayrollCostSeries(),
        fetchDepartmentDistribution(),
      ]);
      setSummary(nextSummary);
      setCostSeries(nextCost);
      setDistribution(nextDistribution);
    })();
  }, [loadEmployees]);

  const loading = summary === null;

  const exportEmployees = async () => {
    setExporting('employees');
    try {
      const csv = await buildEmployeesCsv();
      downloadCsv('empleados.csv', csv);
      push(TOAST_MESSAGES.reportExported);
    } finally {
      setExporting(null);
    }
  };

  const exportPayroll = async (type: PayrollPeriodType) => {
    setExporting(type);
    try {
      const csv = await buildPayrollCsv(type);
      downloadCsv(`nomina-${type}.csv`, csv);
      push(TOAST_MESSAGES.reportExported);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reportes" description="Exportación y gráficas resumen." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Empleados activos" value={summary?.active ?? 0} icon={UserCheck} tone="success" loading={loading} />
          <StatCard label="Empleados inactivos" value={summary?.inactive ?? 0} icon={UserMinus} tone={summary && summary.inactive > 0 ? 'warning' : 'neutral'} loading={loading} />
          <StatCard label="Nómina neta del mes" value={summary?.payrollTotal ?? 0} icon={Wallet} formatter={formatCompactCurrency} loading={loading} />
          <StatCard label="Salario medio" value={summary?.averageSalary ?? 0} icon={TrendingUp} formatter={formatCurrency} loading={loading} />
        </motion.div>

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

        <motion.div variants={fadeUpItem}>
          <Card className="space-y-5">
            <header>
              <h3 className="text-sm font-semibold tracking-tight text-text">Exportar datos</h3>
              <p className="mt-1 text-xs text-text-muted">Descarga los datos en formato CSV.</p>
            </header>
            <div className="flex flex-wrap gap-2.5">
              <Button state={exporting === 'employees' ? 'loading' : 'idle'} onClick={() => void exportEmployees()}>
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  Empleados
                </span>
              </Button>
              <Button state={exporting === 'mensual' ? 'loading' : 'idle'} onClick={() => void exportPayroll('mensual')}>
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  Nómina mensual
                </span>
              </Button>
              <Button state={exporting === 'quincenal' ? 'loading' : 'idle'} onClick={() => void exportPayroll('quincenal')}>
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" aria-hidden />
                  Nómina quincenal
                </span>
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
