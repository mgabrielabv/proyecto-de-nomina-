import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { useEmployeesStore, useRequestsStore, useToastStore } from '../../store';
import {
  EMPTY_MESSAGES,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE,
  REQUEST_TYPE_LABEL,
  TOAST_MESSAGES,
} from '../../constants';
import { formatDateShort } from '../../utils';
import type { LeaveRequest, RequestStatus } from '../../types';

type TabValue = 'todas' | 'pendiente' | 'aprobada' | 'rechazada';

const TAB_ITEMS = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
] as const;

export function AdminRequests() {
  const [tab, setTab] = useState<TabValue>('todas');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const push = useToastStore((state) => state.push);
  const { employees, load: loadEmployees } = useEmployeesStore();
  const { requests, load: loadRequests, decide } = useRequestsStore();

  useEffect(() => {
    void loadRequests();
    void loadEmployees();
  }, [loadRequests, loadEmployees]);

  const employeeName = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((employee) => map.set(employee.id, employee.name));
    return (id: string) => map.get(id) ?? id;
  }, [employees]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesTab = tab === 'todas' || request.status === tab;
      const name = employeeName(request.employeeId).toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        name.includes(query) ||
        REQUEST_TYPE_LABEL[request.type].toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [requests, tab, search, employeeName]);

  const counts = useMemo(() => {
    const byStatus: Record<RequestStatus, number> = { pendiente: 0, aprobada: 0, rechazada: 0 };
    requests.forEach((request) => {
      byStatus[request.status] += 1;
    });
    return byStatus;
  }, [requests]);

  const columns: TableColumn<LeaveRequest>[] = [
    {
      key: 'employee',
      header: 'Persona',
      render: (row) => (
        <span className="font-medium text-text">{employeeName(row.employeeId)}</span>
      ),
      sortValue: (row) => employeeName(row.employeeId),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => <Badge tone="neutral">{REQUEST_TYPE_LABEL[row.type]}</Badge>,
      sortValue: (row) => REQUEST_TYPE_LABEL[row.type],
    },
    {
      key: 'range',
      header: 'Periodo',
      render: (row) => (
        <span className="tabular-nums text-text-secondary">
          {formatDateShort(row.startDate)} – {formatDateShort(row.endDate)}
        </span>
      ),
      sortValue: (row) => row.startDate,
      hideOnMobile: true,
    },
    {
      key: 'days',
      header: 'Días',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.days}</span>,
      sortValue: (row) => row.days,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge tone={REQUEST_STATUS_TONE[row.status]}>{REQUEST_STATUS_LABEL[row.status]}</Badge>,
      sortValue: (row) => row.status,
    },
  ];

  const openDetail = (row: LeaveRequest) => {
    setSelected(row);
    setComment(row.reviewComment || '');
  };

  const closeDetail = () => {
    if (busy) return;
    setSelected(null);
    setComment('');
  };

  const applyDecision = async (status: RequestStatus) => {
    if (!selected) return;
    setBusy(true);
    try {
      await decide(selected.id, status, comment.trim());
      setSelected(null);
      setComment('');
      push(
        status === 'aprobada' ? TOAST_MESSAGES.requestApproved : TOAST_MESSAGES.requestRejected,
        status === 'aprobada' ? 'success' : 'info',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Solicitudes" description="Bandeja con aprobación o rechazo." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUpItem} className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            layoutId="admin-requests-tabs"
            value={tab}
            onChange={(value) => setTab(value as TabValue)}
            items={[
              { ...TAB_ITEMS[0], count: requests.length },
              { ...TAB_ITEMS[1], count: counts.pendiente },
              { ...TAB_ITEMS[2], count: counts.aprobada },
              { ...TAB_ITEMS[3], count: counts.rechazada },
            ]}
          />
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por persona o tipo"
              aria-label="Buscar solicitudes"
              className="h-11 w-full rounded-button border border-border bg-surface-soft pl-10 pr-4 text-sm text-text outline-none transition-colors duration-200 placeholder:text-text-muted focus:border-accent"
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            caption="Bandeja de solicitudes"
            onRowClick={openDetail}
            loading={requests.length === 0}
            emptyMessage={EMPTY_MESSAGES.requests}
          />
        </motion.div>
      </motion.div>

      <Drawer
        open={selected !== null}
        title="Detalle de la solicitud"
        onClose={closeDetail}
        width="420px"
      >
        {selected && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface-soft/70 p-4">
              <p className="text-sm font-semibold text-text">{employeeName(selected.employeeId)}</p>
              <p className="mt-1 text-xs text-text-muted">
                {REQUEST_TYPE_LABEL[selected.type]} • {selected.days} días
              </p>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-text-muted">Periodo</dt>
                <dd className="text-right text-text">
                  {formatDateShort(selected.startDate)} – {formatDateShort(selected.endDate)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-text-muted">Creada</dt>
                <dd className="text-right text-text">{formatDateShort(selected.createdAt)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-text-muted">Estado</dt>
                <dd>
                  <Badge tone={REQUEST_STATUS_TONE[selected.status]}>{REQUEST_STATUS_LABEL[selected.status]}</Badge>
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Motivo</h3>
              <p className="rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-text-secondary">
                {selected.reason}
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="review-comment"
                className="block text-xs font-semibold uppercase tracking-wider text-text-muted"
              >
                Comentario de revisión
              </label>
              <textarea
                id="review-comment"
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Añade una nota opcional"
                className="w-full rounded-input border border-border bg-surface-soft px-4 py-3 text-sm text-text outline-none transition-colors duration-200 placeholder:text-text-muted focus:border-accent"
              />
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button state={busy ? 'loading' : 'idle'} onClick={() => void applyDecision('aprobada')} className="flex-1">
                Aprobar
              </Button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void applyDecision('rechazada')}
                className="h-11 flex-1 rounded-button border border-border bg-surface-soft text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
              >
                Rechazar
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
