import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { useSessionStore, useRequestsStore, useToastStore } from '../../store';
import {
  EMPTY_MESSAGES,
  FORM_MESSAGES,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE,
  REQUEST_TYPE_LABEL,
  TOAST_MESSAGES,
} from '../../constants';
import { formatDateShort } from '../../utils';
import type { LeaveRequest, RequestType } from '../../types';

interface RequestFormValues {
  type: RequestType;
  startDate: string;
  endDate: string;
  reason: string;
}

const INITIAL: RequestFormValues = { type: 'vacaciones', startDate: '', endDate: '', reason: '' };

export function UserRequests() {
  const user = useSessionStore((state) => state.user);
  const push = useToastStore((state) => state.push);
  const { requests, load, create } = useRequestsStore();

  const [values, setValues] = useState<RequestFormValues>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  const set = (patch: Partial<RequestFormValues>) => setValues((current) => ({ ...current, ...patch }));

  const columns: TableColumn<LeaveRequest>[] = useMemo(
    () => [
      {
        key: 'type',
        header: 'Tipo',
        render: (row) => <Badge tone="neutral">{REQUEST_TYPE_LABEL[row.type]}</Badge>,
      },
      {
        key: 'range',
        header: 'Periodo',
        render: (row) => (
          <span className="tabular-nums text-text-secondary">
            {formatDateShort(row.startDate)} – {formatDateShort(row.endDate)}
          </span>
        ),
      },
      {
        key: 'days',
        header: 'Días',
        align: 'right',
        render: (row) => <span className="tabular-nums">{row.days}</span>,
      },
      {
        key: 'status',
        header: 'Estado',
        render: (row) => <Badge tone={REQUEST_STATUS_TONE[row.status]}>{REQUEST_STATUS_LABEL[row.status]}</Badge>,
      },
    ],
    [],
  );

  if (!user) return null;

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!values.startDate) nextErrors.startDate = FORM_MESSAGES.required;
    if (!values.endDate) nextErrors.endDate = FORM_MESSAGES.required;
    if (values.startDate && values.endDate && values.endDate < values.startDate) {
      nextErrors.endDate = FORM_MESSAGES.endBeforeStart;
    }
    if (values.reason.trim().length < 10) nextErrors.reason = FORM_MESSAGES.reasonTooShort;
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    try {
      await create({
        employeeId: user.id,
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason.trim(),
      });
      setValues(INITIAL);
      setErrors({});
      push(TOAST_MESSAGES.requestCreated);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mis solicitudes" description="Solicita vacaciones o permisos y sigue su estado." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUpItem}>
          <Card className="space-y-5">
            <header>
              <h3 className="text-sm font-semibold tracking-tight text-text">Nueva solicitud</h3>
              <p className="mt-1 text-xs text-text-muted">Se enviará para revisión.</p>
            </header>
            <Select
              name="request-type"
              label="Tipo"
              value={values.type}
              options={[
                { value: 'vacaciones', label: 'Vacaciones' },
                { value: 'permiso', label: 'Permiso' },
              ]}
              onChange={(value) => set({ type: value as RequestType })}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                name="request-start"
                label="Fecha inicial"
                type="date"
                value={values.startDate}
                error={errors.startDate}
                onChange={(value) => set({ startDate: value })}
              />
              <Input
                name="request-end"
                label="Fecha final"
                type="date"
                value={values.endDate}
                error={errors.endDate}
                onChange={(value) => set({ endDate: value })}
              />
            </div>
            <div className="space-y-2">
              <Input
                name="request-reason"
                label="Motivo"
                value={values.reason}
                error={errors.reason}
                onChange={(value) => set({ reason: value })}
              />
            </div>
            <Button fullWidth state={busy ? 'loading' : 'idle'} onClick={() => void submit()}>
              Enviar solicitud
            </Button>
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem} className="space-y-4">
          <h3 className="text-sm font-semibold tracking-tight text-text">Historial</h3>
          <ResponsiveTable
            columns={columns}
            rows={requests}
            rowKey={(row) => row.id}
            caption="Historial de solicitudes"
            emptyMessage={EMPTY_MESSAGES.requests}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
