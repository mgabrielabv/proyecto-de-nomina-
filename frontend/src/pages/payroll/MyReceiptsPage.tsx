import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useToastStore } from '../../store';
import {
  ReceiptService,
  type ReciboItem,
  type ReciboDetalle,
  type LineaReciboDetalle,
} from '../../features/payroll/services';
import { formatMoney, formatFechaLocal } from '../../utils';


export function MyReceiptsPage() {
  const [receipts, setReceipts] = useState<ReciboItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Desglose
  const [desgloseOpen, setDesgloseOpen] = useState(false);
  const [desgloseLoading, setDesgloseLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReciboDetalle | null>(null);
  const [receiptDetail, setReceiptDetail] = useState<LineaReciboDetalle[]>([]);

  const pushToast = useToastStore((s) => s.push);

  const loadMyReceipts = async () => {
    setLoading(true);
    try {
      const data = await ReceiptService.misRecibos();
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar tus recibos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyReceipts();
  }, []);

  const handleVerDesglose = async (recibo: ReciboItem) => {
    setSelectedReceipt(recibo as ReciboDetalle);
    setDesgloseOpen(true);
    setDesgloseLoading(true);
    try {
      const res = await ReceiptService.miDesglose(recibo.id);
      setSelectedReceipt(res.recibo ?? (recibo as ReciboDetalle));
      setReceiptDetail(res.detalle ?? []);
    } catch (err: any) {
      pushToast(err?.message ?? 'No se pudo cargar el desglose del recibo', 'error');
    } finally {
      setDesgloseLoading(false);
    }
  };

  const columns: TableColumn<ReciboItem>[] = [
    {
      key: 'periodo',
      header: 'Periodo de pago',
      render: (row) => (
        <div>
          <p className="font-semibold text-text">
            {formatFechaLocal(row.fecha_inicio)} — {formatFechaLocal(row.fecha_fin)}
          </p>
          <span className="text-xs text-text-muted">{row.frecuencia || 'Nómina regular'}</span>
        </div>
      ),
      sortValue: (row) => row.fecha_inicio || '',
    },
    {
      key: 'fecha_emision',
      header: 'Emisión',
      render: (row) => (
        <span className="tabular-nums text-text">{formatFechaLocal(row.fecha_emision)}</span>
      ),
      sortValue: (row) => row.fecha_emision,
    },
    {
      key: 'asignaciones',
      header: 'Asignaciones',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-success">
          +{formatMoney(row.total_asignaciones)}
        </span>
      ),
      sortValue: (row) => Number(row.total_asignaciones || 0),
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-error">
          −{formatMoney(row.total_deducciones)}
        </span>
      ),
      sortValue: (row) => Number(row.total_deducciones || 0),
    },
    {
      key: 'total',
      header: 'Neto a cobrar',
      align: 'right',
      render: (row) => (
        <span className="font-bold tabular-nums text-accent">
          {formatMoney(row.monto_total)}
        </span>
      ),
      sortValue: (row) => Number(row.monto_total || 0),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.estado === 'PAGADO' ? 'success' : 'warning'}>
          {row.estado}
        </Badge>
      ),
      sortValue: (row) => row.estado,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void handleVerDesglose(row);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-3 py-1.5 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver recibo
        </button>
      ),
    },
  ];

  const asignaciones = receiptDetail.filter((d) => d.tipo_concepto === 'ASIGNACION');
  const deducciones = receiptDetail.filter((d) => d.tipo_concepto === 'DEDUCCION');
  const aportes = receiptDetail.filter((d) => d.tipo_concepto === 'APORTE_PATRONAL');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Recibos de Nómina"
        description="Historial detallado de recibos de pago, deducciones legales, bonos y depósitos."
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
            rows={receipts}
            rowKey={(r) => r.id}
            caption="Recibos de nómina emitidos"
            loading={loading}
            emptyMessage="No tienes recibos de nómina emitidos en este momento."
            onRowClick={(r) => void handleVerDesglose(r)}
          />
        </motion.div>
      </motion.div>

      {/* Modal Desglose del Recibo */}
      <Modal
        open={desgloseOpen}
        onClose={() => setDesgloseOpen(false)}
        title="Desglose del Recibo de Pago"
        description={
          selectedReceipt
            ? `Periodo: ${formatFechaLocal(selectedReceipt.fecha_inicio)} al ${formatFechaLocal(selectedReceipt.fecha_fin)}`
            : undefined
        }
        size="lg"
        footer={
          <Button onClick={() => setDesgloseOpen(false)}>
            Cerrar recibo
          </Button>
        }
      >
        {desgloseLoading ? (
          <div className="py-12 text-center text-text-muted">
            Cargando desglose de conceptos...
          </div>
        ) : selectedReceipt ? (
          <div className="space-y-6">
            {/* Cabecera del recibo */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-soft p-4 sm:grid-cols-4">
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Estado</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  <Badge tone={selectedReceipt.estado === 'PAGADO' ? 'success' : 'warning'}>
                    {selectedReceipt.estado}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Fecha de emisión</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  {formatFechaLocal(selectedReceipt.fecha_emision)}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Fecha de pago</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  {selectedReceipt.fecha_pago ? formatFechaLocal(selectedReceipt.fecha_pago) : 'Pendiente'}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Método / Ref</span>
                <p className="mt-0.5 text-sm font-medium text-text">
                  {selectedReceipt.metodo_pago || '—'} {selectedReceipt.referencia_pago ? `(${selectedReceipt.referencia_pago})` : ''}
                </p>
              </div>
            </div>

            {/* Asignaciones */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-success">
                Asignaciones (Ingresos)
              </h4>
              <div className="rounded-xl border border-border/70 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft text-text-muted">
                    <tr>
                      <th className="p-2.5">Código / Concepto</th>
                      <th className="p-2.5 text-right">Cant. / Unid.</th>
                      <th className="p-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {asignaciones.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-text-muted">
                          Sin asignaciones adicionales
                        </td>
                      </tr>
                    ) : (
                      asignaciones.map((d) => (
                        <tr key={d.id}>
                          <td className="p-2.5 text-text">
                            <span className="font-mono text-text-muted mr-1">[{d.codigo}]</span>
                            {d.nombre_concepto}
                          </td>
                          <td className="p-2.5 text-right text-text-secondary">
                            {d.cantidad_unidades ? `${d.cantidad_unidades} ${d.unidad || ''}` : '—'}
                          </td>
                          <td className="p-2.5 text-right font-medium text-success">
                            +{formatMoney(d.monto)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deducciones */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-error">
                Deducciones y Retenciones
              </h4>
              <div className="rounded-xl border border-border/70 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-soft text-text-muted">
                    <tr>
                      <th className="p-2.5">Código / Concepto</th>
                      <th className="p-2.5 text-right">Base / Tasa</th>
                      <th className="p-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {deducciones.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-3 text-center text-text-muted">
                          Sin deducciones en este periodo
                        </td>
                      </tr>
                    ) : (
                      deducciones.map((d) => (
                        <tr key={d.id}>
                          <td className="p-2.5 text-text">
                            <span className="font-mono text-text-muted mr-1">[{d.codigo}]</span>
                            {d.nombre_concepto}
                          </td>
                          <td className="p-2.5 text-right text-text-secondary">
                            {d.tasa_aplicada && Number(d.tasa_aplicada) > 0
                              ? `${(Number(d.tasa_aplicada) * 100).toFixed(2)}%`
                              : '—'}
                          </td>
                          <td className="p-2.5 text-right font-medium text-error">
                            −{formatMoney(d.monto)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aportes Patronales (informativo) */}
            {aportes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Aportes Patronales (Informativo de Ley)
                </h4>
                <div className="rounded-xl border border-border/70 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-soft text-text-muted">
                      <tr>
                        <th className="p-2.5">Aporte</th>
                        <th className="p-2.5 text-right">Base</th>
                        <th className="p-2.5 text-right">Monto aporte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {aportes.map((d) => (
                        <tr key={d.id}>
                          <td className="p-2.5 text-text">
                            <span className="font-mono text-text-muted mr-1">[{d.codigo}]</span>
                            {d.nombre_concepto}
                          </td>
                          <td className="p-2.5 text-right text-text-secondary">
                            {formatMoney(d.base_calculo)}
                          </td>
                          <td className="p-2.5 text-right font-medium text-accent">
                            {formatMoney(d.monto)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resumen Totales */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-soft p-4 text-center">
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Total Asignaciones</span>
                <p className="mt-1 text-lg font-bold text-success">
                  +{formatMoney(selectedReceipt.total_asignaciones)}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Total Deducciones</span>
                <p className="mt-1 text-lg font-bold text-error">
                  −{formatMoney(selectedReceipt.total_deducciones)}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase">Neto Cobrado</span>
                <p className="mt-1 text-xl font-extrabold text-accent">
                  {formatMoney(selectedReceipt.monto_total)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
