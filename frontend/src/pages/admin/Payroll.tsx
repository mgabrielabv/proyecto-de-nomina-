import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Receipt, PiggyBank } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useEmployeesStore, usePayrollStore, useToastStore } from '../../store';
import { PAYROLL_STATUS_LABEL, PAYROLL_STATUS_TONE, TOAST_MESSAGES } from '../../constants';
import { formatCurrency } from '../../utils';
import type { PayrollPeriodType, PayrollReceipt, PayrollStatus } from '../../types';

interface PendingStatus {
  ids: string[];
  status: PayrollStatus;
  title: string;
  description: string;
  message: string;
}

export function AdminPayroll() {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const push = useToastStore((state) => state.push);

  const periodType = usePayrollStore((state) => state.periodType);
  const periods = usePayrollStore((state) => state.periods);
  const receipts = usePayrollStore((state) => state.receipts);
  const selectedKey = usePayrollStore((state) => state.selectedKey);
  const loading = usePayrollStore((state) => state.loading);
  const loadPeriods = usePayrollStore((state) => state.loadPeriods);
  const selectPeriod = usePayrollStore((state) => state.selectPeriod);
  const setStatus = usePayrollStore((state) => state.setStatus);
  const getState = usePayrollStore.getState;

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
      const key = getState().selectedKey;
      if (key) await selectPeriod(periodType, key, employees);
    })();
    return () => {
      cancelled = true;
    };
  }, [periodType, employees, loadPeriods, selectPeriod, getState]);

  const totals = useMemo(() => {
    return receipts.reduce(
      (acc, receipt) => ({
        gross: acc.gross + receipt.grossPay,
        deductions: acc.deductions + receipt.totalDeductions,
        net: acc.net + receipt.netPay,
      }),
      { gross: 0, deductions: 0, net: 0 },
    );
  }, [receipts]);

  const employeeName = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((employee) => map.set(employee.id, employee.name));
    return (id: string) => map.get(id) ?? id;
  }, [employees]);

  const columns: TableColumn<PayrollReceipt>[] = [
    {
      key: 'employee',
      header: 'Persona',
      render: (row) => <span className="font-medium text-text">{employeeName(row.employeeId)}</span>,
      sortValue: (row) => employeeName(row.employeeId),
    },
    {
      key: 'gross',
      header: 'Bruto',
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

  const periodOptions = periods.map((period) => ({ value: period.key, label: period.label }));

  const toggleRow = (key: string) => {
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  const toggleAll = () => {
    setSelectedKeys((current) => (current.length === receipts.length ? [] : receipts.map((item) => item.id)));
  };

  const requestStatus = (
    status: PayrollStatus,
    title: string,
    description: string,
    message: string,
  ) => {
    const ids = selectedKeys.length > 0 ? selectedKeys : receipts.map((item) => item.id);
    if (ids.length === 0) return;
    setPendingStatus({ ids, status, title, description, message });
  };

  const confirmStatus = async () => {
    if (!pendingStatus || statusBusy) return;
    setStatusBusy(true);
    try {
      await setStatus(pendingStatus.ids, pendingStatus.status);
      setSelectedKeys([]);
      setPendingStatus(null);
      push(pendingStatus.message);
    } catch (error) {
      push(error instanceof Error ? error.message : 'No se pudo actualizar la nómina.', 'error');
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nómina" description="Periodo, desglose, totales y generación." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            layoutId="admin-payroll-tabs"
            value={periodType}
            onChange={(value) => void loadPeriods(value as PayrollPeriodType)}
            items={[
              { value: 'mensual', label: 'Mensual' },
              { value: 'quincenal', label: 'Quincenal' },
            ]}
          />
          <div className="w-full max-w-xs">
            <Select
              name="period"
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

        <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total bruto" value={totals.gross} icon={Wallet} formatter={formatCurrency} loading={loading} />
          <StatCard label="Deducciones" value={totals.deductions} icon={Receipt} formatter={formatCurrency} loading={loading} />
          <StatCard label="Total neto" value={totals.net} icon={PiggyBank} formatter={formatCurrency} loading={loading} tone="success" />
        </motion.div>

        <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {selectedKeys.length > 0
              ? `${selectedKeys.length} seleccionados`
              : `${receipts.length} recibos en el periodo`}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={statusBusy || receipts.length === 0}
              onClick={() =>
                requestStatus(
                  'aprobada',
                  'Aprobar nómina',
                  'La nómina seleccionada quedará aprobada y lista para pago.',
                  TOAST_MESSAGES.payrollApproved,
                )
              }
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
            >
              Aprobar
            </button>
            <button
              type="button"
              disabled={statusBusy || receipts.length === 0}
              onClick={() =>
                requestStatus(
                  'pagada',
                  'Marcar nómina como pagada',
                  'La nómina seleccionada quedará registrada como pagada.',
                  TOAST_MESSAGES.payrollPaid,
                )
              }
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
            >
              Marcar como pagada
            </button>
            <button
              type="button"
              disabled={statusBusy || receipts.length === 0}
              onClick={() =>
                requestStatus(
                  'borrador',
                  'Regenerar nómina',
                  'La nómina volverá a borrador y podrá recalcularse.',
                  TOAST_MESSAGES.payrollGenerated,
                )
              }
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
            >
              Regenerar
            </button>
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={receipts}
            rowKey={(row) => row.id}
            caption="Recibos del periodo seleccionado"
            loading={loading}
            selectedKeys={selectedKeys}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            emptyMessage="No hay recibos en este periodo."
          />
        </motion.div>
      </motion.div>

      <Modal
        open={pendingStatus !== null}
        title={pendingStatus?.title ?? 'Confirmar acción'}
        description={pendingStatus?.description}
        size="sm"
        onClose={() => {
          if (!statusBusy) setPendingStatus(null);
        }}
        footer={
          <>
            <button
              type="button"
              disabled={statusBusy}
              onClick={() => setPendingStatus(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
            >
              Cancelar
            </button>
            <Button
              state={statusBusy ? 'loading' : 'idle'}
              disabled={!pendingStatus}
              onClick={() => void confirmStatus()}
            >
              Confirmar
            </Button>
          </>
        }
      />
    </div>
  );
}
