import { Download } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../../components/ui/Table';
import {
  FRECUENCIA_LABEL,
  PERIODO_ESTADO_LABEL,
  RECIBO_ESTADO_LABEL,
  RECIBO_ESTADO_TONE,
  type PeriodoEstado,
  type ReciboEstado,
} from '../../../constants';
import { formatFechaLocal, formatMoney } from '../../../utils';
import type { PeriodoNomina, ReciboItem, ResumenNomina } from '../services';

// La misma vista se usa en el detalle del período y en el reporte final. Así el
// gestor ve exactamente los mismos totales y recibos antes y después de emitir.
const TIPO_CONCEPTO_LABEL: Record<string, string> = {
  ASIGNACION: 'Asignación',
  DEDUCCION: 'Deducción',
  APORTE_PATRONAL: 'Aporte patronal',
};

export interface ReporteFinalPeriodoProps {
  periodo: PeriodoNomina | null;
  resumen: ResumenNomina | null;
  recibos: ReciboItem[];
  cargando?: boolean;
  pdfBusyId?: string | null;
  onDescargarPdf?: (recibo: ReciboItem) => void;
  /** Marca el Contenedor para que la hoja de estilos solo lo imprima a él. */
  imprimible?: boolean;
}

export function ReporteFinalPeriodo({
  periodo,
  resumen,
  recibos,
  cargando = false,
  pdfBusyId = null,
  onDescargarPdf,
  imprimible = false,
}: ReporteFinalPeriodoProps) {
  const receiptColumns: TableColumn<ReciboItem>[] = [
    {
      key: 'persona',
      header: 'Empleado',
      render: (row) => (
        <div>
          <p className="font-medium text-text">
            {row.primer_nombre} {row.primer_apellido}
          </p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
    },
    {
      key: 'asignaciones',
      header: 'Asignaciones',
      align: 'right',
      render: (row) => <span className="num text-success">+{formatMoney(row.total_asignaciones)}</span>,
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      align: 'right',
      render: (row) => <span className="num text-error">−{formatMoney(row.total_deducciones)}</span>,
    },
    {
      key: 'total',
      header: 'Neto a cobrar',
      align: 'right',
      render: (row) => (
        <span className="num font-semibold text-text">{formatMoney(row.monto_total)}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => {
        const estado = row.estado as ReciboEstado;
        return (
          <Badge
            tone={RECIBO_ESTADO_TONE[estado] ?? 'neutral'}
            statusIcon={estado === 'PAGADO' ? 'paid' : estado === 'PROCESADO' ? 'processed' : 'none'}
          >
            {RECIBO_ESTADO_LABEL[estado] ?? row.estado}
          </Badge>
        );
      },
    },
    ...(onDescargarPdf
      ? [
          {
            key: 'acciones',
            header: 'PDF',
            align: 'right' as const,
            render: (row: ReciboItem) => (
              <button
                type="button"
                disabled={pdfBusyId === row.id}
                onClick={(event) => {
                  event.stopPropagation();
                  onDescargarPdf(row);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
                title="Descargar el recibo en PDF"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                {pdfBusyId === row.id ? 'Generando...' : 'PDF'}
              </button>
            ),
          },
        ]
      : []),
  ];

  const estado = periodo?.estado as PeriodoEstado | undefined;

  return (
    <div className="space-y-5" data-reporte-final={imprimible ? '' : undefined}>
      <div className="print-only hidden rounded-xl border border-border/60 bg-surface-soft p-4 text-sm">
        <p className="text-xs uppercase tracking-wide text-text-muted">Reporte final de nómina</p>
        <p className="mt-1 font-semibold text-text">
          {periodo?.frecuencia ? FRECUENCIA_LABEL[periodo.frecuencia] ?? periodo.frecuencia : ''} ·{' '}
          {formatFechaLocal(periodo?.fecha_inicio)} — {formatFechaLocal(periodo?.fecha_fin)}
        </p>
        {estado && (
          <p className="mt-1 text-text-secondary">
            Estado: {PERIODO_ESTADO_LABEL[estado] ?? periodo?.estado}
            {periodo?.fecha_proceso ? ` · Procesado el ${formatFechaLocal(periodo.fecha_proceso)}` : ''}
          </p>
        )}
      </div>

      {cargando || resumen === null ? (
        <div className="flex h-20 items-center justify-center rounded-xl border border-border/60 bg-surface-soft text-sm text-text-muted">
          Calculando totales del período...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs text-text-muted uppercase">Personas</span>
              <p className="mt-1 text-xl font-bold text-text">{resumen.totales.personas}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs text-text-muted uppercase">Asignaciones</span>
              <p className="mt-1 text-xl font-bold text-success">
                +{formatMoney(resumen.totales.total_asignaciones)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs text-text-muted uppercase">Deducciones</span>
              <p className="mt-1 text-xl font-bold text-error">
                −{formatMoney(resumen.totales.total_deducciones)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs text-text-muted uppercase">Neto a pagar</span>
              <p className="mt-1 text-xl font-bold text-accent">
                {formatMoney(resumen.totales.total_neto)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs text-text-muted uppercase">Aporte patronal</span>
              <p className="mt-1 text-xl font-bold text-text-secondary">
                {formatMoney(resumen.totales.total_aporte_patronal)}
              </p>
              <p className="mt-0.5 text-[11px] leading-tight text-text-muted">
                Costo del patrono, no se descuenta al empleado.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs text-text-muted uppercase">Costo total</span>
              <p className="mt-1 text-xl font-bold text-text">
                {formatMoney(resumen.totales.costo_total)}
              </p>
            </div>
          </div>

          {resumen.por_concepto.length > 0 && (
            <div className="reporte-tabla-scroll overflow-hidden rounded-xl border border-border/60 bg-surface-soft">
              <div className="border-b border-border/60 px-4 py-3">
                <h3 className="text-sm font-semibold text-text">Desglose por concepto</h3>
                <p className="mt-0.5 text-xs text-text-muted">
                  El aporte patronal se reporta aparte del neto.
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-soft">
                    <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                      <th className="px-4 py-2 font-medium">Código</th>
                      <th className="px-4 py-2 font-medium">Concepto</th>
                      <th className="px-4 py-2 font-medium">Tipo</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.por_concepto.map((linea) => (
                      <tr
                        key={`${linea.codigo}-${linea.tipo_concepto}`}
                        className="border-t border-border/40"
                      >
                        <td className="num px-4 py-2 text-text-secondary">{linea.codigo}</td>
                        <td className="px-4 py-2 text-text">{linea.nombre_concepto}</td>
                        <td className="px-4 py-2 text-xs text-text-muted">
                          {TIPO_CONCEPTO_LABEL[linea.tipo_concepto] ?? linea.tipo_concepto}
                        </td>
                        <td className="num px-4 py-2 text-right text-text">
                          {formatMoney(linea.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {cargando ? (
        <div className="flex h-36 items-center justify-center text-text-muted">
          Cargando recibos del periodo...
        </div>
      ) : recibos.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-surface-soft p-6 text-center text-sm text-text-secondary">
          {periodo?.estado === 'BORRADOR'
            ? 'El periodo está en BORRADOR. Procesa la nómina para generar los recibos.'
            : 'No se encontraron recibos generados.'}
        </div>
      ) : (
        <div className="reporte-tabla-scroll max-h-96 overflow-y-auto">
          <ResponsiveTable
            columns={receiptColumns}
            rows={recibos}
            rowKey={(r) => r.id}
            caption="Recibos generados en este periodo"
          />
        </div>
      )}
    </div>
  );
}
