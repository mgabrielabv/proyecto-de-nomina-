import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { useEmployeesStore, usePayrollStore, useSessionStore } from '../../store';
import { EMPTY_MESSAGES, PAYROLL_STATUS_LABEL, PAYROLL_STATUS_TONE } from '../../constants';
import { formatCurrency, formatCurrencyPrecise } from '../../utils';
import type { PayrollPeriodType, PayrollReceipt } from '../../types';

export function UserPayroll() {
  const user = useSessionStore((state) => state.user);
  const [selected, setSelected] = useState<PayrollReceipt | null>(null);

  const periodType = usePayrollStore((state) => state.periodType);
  const periods = usePayrollStore((state) => state.periods);
  const receipts = usePayrollStore((state) => state.receipts);
  const selectedKey = usePayrollStore((state) => state.selectedKey);
  const loading = usePayrollStore((state) => state.loading);
  const loadPeriods = usePayrollStore((state) => state.loadPeriods);
  const selectPeriod = usePayrollStore((state) => state.selectPeriod);

  const { employees, load: loadEmployees } = useEmployeesStore();

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (employees.length === 0) return;
    let cancelled = false;
    void (async () => {
      await loadPeriods(periodType);
      if (cancelled) return;
      const key = usePayrollStore.getState().selectedKey;
      if (key) await selectPeriod(periodType, key, employees);
    })();
    return () => {
      cancelled = true;
    };
  }, [periodType, employees, loadPeriods, selectPeriod]);

  const ownReceipts = useMemo(
    () => (user ? receipts.filter((receipt) => receipt.employeeId === user.id) : []),
    [receipts, user],
  );

  const columns: TableColumn<PayrollReceipt>[] = [
    {
      key: 'period',
      header: 'Periodo',
      render: (row) => <span className="font-medium capitalize text-text">{row.periodLabel}</span>,
      sortValue: (row) => row.periodKey,
    },
    {
      key: 'gross',
      header: 'Salario bruto',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.grossPay)}</span>,
      sortValue: (row) => row.grossPay,
    },
    {
      key: 'deductions',
      header: 'Deducciones',
      align: 'right',
      render: (row) => <span className="tabular-nums text-text-secondary">−{formatCurrency(row.totalDeductions)}</span>,
      sortValue: (row) => row.totalDeductions,
      hideOnMobile: true,
    },
    {
      key: 'net',
      header: 'Neto',
      align: 'right',
      render: (row) => <span className="tabular-nums font-medium text-text">{formatCurrency(row.netPay)}</span>,
      sortValue: (row) => row.netPay,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge tone={PAYROLL_STATUS_TONE[row.status]}>{PAYROLL_STATUS_LABEL[row.status]}</Badge>,
      sortValue: (row) => row.status,
    },
  ];

  if (!user) return null;

  const periodOptions = periods.map((period) => ({ value: period.key, label: period.label }));

  const detailRows: Array<[string, number]> = selected
    ? [
        ['Salario base', selected.baseSalary],
        ['Complementos', selected.bonus],
        ['Horas extra', selected.overtimePay],
        ['Retención de impuestos', -selected.taxDeduction],
        ['Seguridad social', -selected.insuranceDeduction],
        ['Otras deducciones', -selected.otherDeductions],
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Mi nómina" description="Consulta tus recibos y su desglose." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            layoutId="user-payroll-tabs"
            value={periodType}
            onChange={(value) => void loadPeriods(value as PayrollPeriodType)}
            items={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'quincenal', label: 'Quincenal' },
            ]}
          />
          <div className="w-full max-w-xs">
            <Select
              name="user-period"
              label="Periodo"
              value={selectedKey ?? ''}
              options={periodOptions}
              placeholder="Selecciona un periodo"
              onChange={(value) => {
                if (employees.length > 0) void selectPeriod(periodType, value, employees);
              }}
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={ownReceipts}
            rowKey={(row) => row.id}
            caption="Recibos de nómina"
            loading={loading}
            onRowClick={setSelected}
            emptyMessage={EMPTY_MESSAGES.receipts}
          />
        </motion.div>
      </motion.div>

      <Drawer open={selected !== null} title="Desglose del recibo" onClose={() => setSelected(null)} width="420px">
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface-soft/70 p-4">
              <p className="text-sm font-semibold capitalize text-text">{selected.periodLabel}</p>
              <p className="mt-1 text-xs text-text-muted">
                {selected.periodType === 'mensual' ? 'Periodo mensual' : 'Periodo quincenal'}
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              {detailRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="text-text-secondary">{label}</dt>
                  <dd className="tabular-nums text-text">{formatCurrencyPrecise(value)}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-secondary">Total bruto</dt>
                <dd className="tabular-nums font-medium text-text">{formatCurrencyPrecise(selected.grossPay)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-text-secondary">Total deducciones</dt>
                <dd className="tabular-nums font-medium text-text">−{formatCurrencyPrecise(selected.totalDeductions)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
                <dt className="font-medium text-success">Neto a percibir</dt>
                <dd className="tabular-nums font-semibold text-success">{formatCurrencyPrecise(selected.netPay)}</dd>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Estado</span>
              <Badge tone={PAYROLL_STATUS_TONE[selected.status]}>{PAYROLL_STATUS_LABEL[selected.status]}</Badge>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
