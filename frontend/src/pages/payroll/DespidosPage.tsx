import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { useSessionStore, useToastStore } from '../../store';
import {
  EmployeeService,
  type DespidoHistorico,
} from '../../features/payroll/services';
import { formatFechaLocal, hasAnyProfile } from '../../utils';

const PERFILES_REGISTRO = ['RRHH', 'Superusuario'] as const;

// Los motivos viven en el enum de la base; el front solo humaniza la etiqueta.
const motivoLabel = (motivo: string) =>
  motivo
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

export function DespidosPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);
  const puedeGestionar = hasAnyProfile(user, [...PERFILES_REGISTRO]);

  const [despidos, setDespidos] = useState<DespidoHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!puedeGestionar) {
      setLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      setLoading(true);
      try {
        const data = await EmployeeService.listarDespidos();
        if (active) setDespidos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        pushToast(err?.message ?? 'Error al cargar el histórico de despidos', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [puedeGestionar, pushToast]);

  const columns: TableColumn<DespidoHistorico>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (row) => (
        <span className="tabular-nums text-text">{formatFechaLocal(row.fecha_despido)}</span>
      ),
      sortValue: (row) => row.fecha_despido,
    },
    {
      key: 'persona',
      header: 'Persona',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            {row.primer_nombre} {row.primer_apellido}
          </p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
      sortValue: (row) => `${row.primer_apellido} ${row.primer_nombre}`,
    },
    {
      key: 'cargo',
      header: 'Cargo',
      render: (row) => <span className="text-text-secondary">{row.cargo || '—'}</span>,
    },
    {
      key: 'motivo',
      header: 'Motivo',
      render: (row) => <span className="text-text">{motivoLabel(row.motivo)}</span>,
      sortValue: (row) => row.motivo,
    },
    {
      key: 'contrato',
      header: 'Contrato',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-text-secondary">
          {formatFechaLocal(row.contrato_inicio)} — {formatFechaLocal(row.contrato_fin)}
        </span>
      ),
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-text-secondary">{row.descripcion || '—'}</span>
      ),
    },
    {
      key: 'registrado_por',
      header: 'Registrado por',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-text-secondary">
          {row.registrado_por_username || '—'}
        </span>
      ),
    },
  ];

  if (!puedeGestionar) {
    return (
      <div className="space-y-6">
        <PageHeader title="Despidos" description="Acceso restringido." />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla es de uso exclusivo para los perfiles <strong>Superusuario</strong> y{' '}
            <strong>RRHH</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico de despidos"
        description="Cierres laborales registrados. El despido cierra el contrato y deja a la persona inactiva."
      />

      <motion.div
        variants={staggerContainer(0.05)}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={despidos}
            rowKey={(r) => r.id}
            caption="Histórico de despidos registrados"
            loading={loading}
            emptyMessage="Todavía no hay despidos registrados."
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
