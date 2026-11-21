import { useEffect, useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import {
  FRECUENCIA_LABEL,
  RECIBO_ESTADO_LABEL,
  RECIBO_ESTADO_TONE,
  type ReciboEstado,
} from '../../constants';
import {
  PeriodService,
  ReceiptService,
  type PeriodoConTotales,
  type ReciboItem,
} from '../../features/payroll/services';
import { useToastStore } from '../../store';
import { aCentavos, deCentavos, descargarPdfBase64, formatFechaLocal, formatMoney } from '../../utils';

type ConceptoAgregado = {
  clave: string;
  codigo: string;
  nombre_concepto: string;
  tipo_concepto: string;
  lineas: number;
  totalCentavos: number;
};

type EmpleadoAgregado = {
  personaId: string;
  nombre: string;
  cedula: string;
  recibos: ReciboItem[];
  asignacionesCentavos: number;
  deduccionesCentavos: number;
  netoCentavos: number;
  ultimaFechaFin: string;
};

const TIPO_CONCEPTO_LABEL: Record<string, string> = {
  ASIGNACION: 'Asignación',
  DEDUCCION: 'Deducción',
  APORTE_PATRONAL: 'Aporte patronal',
};

const nombreDe = (recibo: ReciboItem) =>
  `${recibo.primer_nombre ?? ''} ${recibo.primer_apellido ?? ''}`.trim() || 'Sin nombre';

const etiquetaPeriodo = (periodo: PeriodoConTotales | undefined) =>
  periodo
    ? `${FRECUENCIA_LABEL[periodo.frecuencia] ?? periodo.frecuencia} · ${formatFechaLocal(periodo.fecha_inicio)} — ${formatFechaLocal(periodo.fecha_fin)}`
    : 'Período no disponible';

export function ReportsPage() {
  const push = useToastStore((state) => state.push);
  const [periodos, setPeriodos] = useState<PeriodoConTotales[]>([]);
  const [recibos, setRecibos] = useState<ReciboItem[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoAgregado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const historial = await PeriodService.listarConTotales();
        const emitidos = historial.filter(
          (periodo) => periodo.estado === 'PROCESADO' || periodo.estado === 'PAGADO',
        );

        const [recibosPorPeriodo, resumenesPorPeriodo] = await Promise.all([
          Promise.allSettled(emitidos.map((periodo) => ReceiptService.listarPorPeriodo(periodo.id))),
          Promise.allSettled(emitidos.map((periodo) => PeriodService.resumen(periodo.id))),
        ]);
        const fallos = [...recibosPorPeriodo, ...resumenesPorPeriodo].filter(
          (resultado) => resultado.status === 'rejected',
        ).length;
        if (fallos > 0) {
          push(`No se pudieron consultar ${fallos} períodos; se muestran los datos disponibles`, 'error');
        }

        if (!vivo) return;
        setPeriodos(emitidos);

        const todosLosRecibos = recibosPorPeriodo.flatMap((resultado) =>
          resultado.status === 'fulfilled' ? resultado.value : [],
        );
        setRecibos(todosLosRecibos);

        const porConcepto = new Map<string, ConceptoAgregado>();
        resumenesPorPeriodo.forEach((resultado) => {
          if (resultado.status !== 'fulfilled') return;
          resultado.value.por_concepto.forEach((linea) => {
            const clave = `${linea.codigo}-${linea.tipo_concepto}`;
            const actual = porConcepto.get(clave) ?? {
              clave,
              codigo: linea.codigo,
              nombre_concepto: linea.nombre_concepto,
              tipo_concepto: linea.tipo_concepto,
              lineas: 0,
              totalCentavos: 0,
            };
            actual.lineas += linea.lineas;
            actual.totalCentavos += aCentavos(linea.total);
            porConcepto.set(clave, actual);
          });
        });
        setConceptos(
          [...porConcepto.values()].sort((a, b) => b.totalCentavos - a.totalCentavos),
        );
      } catch (error: unknown) {
        if (vivo) {
          push(error instanceof Error ? error.message : 'Error al cargar los reportes', 'error');
        }
      } finally {
        if (vivo) setCargando(false);
      }
    };
    void cargar();
    return () => {
      vivo = false;
    };
  }, [push]);

  const periodoPorId = useMemo(
    () => new Map(periodos.map((periodo) => [periodo.id, periodo])),
    [periodos],
  );

  const totales = useMemo(() => {
    const suma = periodos.reduce(
      (acc, periodo) => ({
        asignaciones: acc.asignaciones + aCentavos(periodo.total_asignaciones),
        deducciones: acc.deducciones + aCentavos(periodo.total_deducciones),
        neto: acc.neto + aCentavos(periodo.total_neto),
        patronal: acc.patronal + aCentavos(periodo.total_aporte_patronal),
        costo: acc.costo + aCentavos(periodo.costo_total),
      }),
      { asignaciones: 0, deducciones: 0, neto: 0, patronal: 0, costo: 0 },
    );
    const personas = new Set(
      recibos.filter((recibo) => recibo.estado !== 'ANULADO').map((recibo) => recibo.persona_id),
    ).size;
    return { ...suma, personas };
  }, [periodos, recibos]);

  const porEmpleado = useMemo(() => {
    const mapa = new Map<string, EmpleadoAgregado>();
    recibos
      .filter((recibo) => recibo.estado !== 'ANULADO')
      .forEach((recibo) => {
        const actual = mapa.get(recibo.persona_id) ?? {
          personaId: recibo.persona_id,
          nombre: nombreDe(recibo),
          cedula: recibo.cedula ?? '—',
          recibos: [],
          asignacionesCentavos: 0,
          deduccionesCentavos: 0,
          netoCentavos: 0,
          ultimaFechaFin: '',
        };
        actual.recibos.push(recibo);
        actual.asignacionesCentavos += aCentavos(recibo.total_asignaciones);
        actual.deduccionesCentavos += aCentavos(recibo.total_deducciones);
        actual.netoCentavos += aCentavos(recibo.monto_total);
        const fin = periodoPorId.get(recibo.periodo_nomina_id)?.fecha_fin ?? '';
        if (fin > actual.ultimaFechaFin) actual.ultimaFechaFin = fin;
        mapa.set(recibo.persona_id, actual);
      });
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [recibos, periodoPorId]);

  const handleDescargarPdf = async (recibo: ReciboItem) => {
    setPdfBusyId(recibo.id);
    try {
      const pdf = await ReceiptService.generarPdf(recibo.id);
      descargarPdfBase64(pdf);
      push('Recibo descargado', 'success');
    } catch (error: unknown) {
      push(error instanceof Error ? error.message : 'No se pudo descargar el recibo', 'error');
    } finally {
      setPdfBusyId(null);
    }
  };

  const empleadoColumns: TableColumn<EmpleadoAgregado>[] = [
    {
      key: 'empleado',
      header: 'Empleado',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.nombre}</p>
          <p className="text-xs text-text-muted">CI: {row.cedula}</p>
        </div>
      ),
    },
    {
      key: 'recibos',
      header: 'Recibos',
      align: 'right',
      render: (row) => <span className="num text-text-secondary">{row.recibos.length}</span>,
    },
    {
      key: 'asignaciones',
      header: 'Asignaciones',
      align: 'right',
      render: (row) => <span className="num text-success">+{formatMoney(deCentavos(row.asignacionesCentavos))}</span>,
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      align: 'right',
      render: (row) => <span className="num text-error">−{formatMoney(deCentavos(row.deduccionesCentavos))}</span>,
    },
    {
      key: 'neto',
      header: 'Neto total',
      align: 'right',
      render: (row) => <span className="num font-semibold text-text">{formatMoney(deCentavos(row.netoCentavos))}</span>,
    },
    {
      key: 'ultimo',
      header: 'Último período',
      hideOnMobile: true,
      render: (row) => <span className="text-xs text-text-muted">{formatFechaLocal(row.ultimaFechaFin || null)}</span>,
    },
  ];

  const reciboColumns: TableColumn<ReciboItem>[] = [
    {
      key: 'empleado',
      header: 'Empleado',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{nombreDe(row)}</p>
          <p className="text-xs text-text-muted">CI: {row.cedula ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'periodo',
      header: 'Período',
      render: (row) => (
        <span className="text-xs text-text-secondary">{etiquetaPeriodo(periodoPorId.get(row.periodo_nomina_id))}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (row) => {
        const estado = row.estado as ReciboEstado;
        return (
          <Badge tone={RECIBO_ESTADO_TONE[estado] ?? 'neutral'} statusIcon={estado === 'PAGADO' ? 'paid' : estado === 'PROCESADO' ? 'processed' : 'none'}>
            {RECIBO_ESTADO_LABEL[estado] ?? row.estado}
          </Badge>
        );
      },
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
      key: 'neto',
      header: 'Neto',
      align: 'right',
      render: (row) => <span className="num font-semibold text-text">{formatMoney(row.monto_total)}</span>,
    },
    {
      key: 'pdf',
      header: 'PDF',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          disabled={pdfBusyId === row.id}
          onClick={() => void handleDescargarPdf(row)}
          title="Descargar el recibo en PDF"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {pdfBusyId === row.id ? 'Generando...' : 'PDF'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6" data-reporte-general>
      <div className="print-only hidden rounded-xl border border-border/60 bg-surface-soft p-4 text-sm">
        <p className="text-xs uppercase tracking-wide text-text-muted">Reportes de nómina</p>
        <p className="mt-1 font-semibold text-text">Resumen final de todos los períodos emitidos</p>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 no-print">
        <PageHeader
          title="Reportes"
          description="Resumen final de todos los reportes y un reporte por empleado, con su recibo en PDF."
        />
        <Button onClick={() => window.print()}>
          <Printer className="mr-1.5 h-4 w-4" />
          Imprimir / guardar PDF
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-text">Resumen final de todos los reportes</h2>
          <span className="text-xs text-text-muted">
            {cargando ? 'Calculando...' : `${periodos.length} períodos emitidos`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { etiqueta: 'Personas', valor: String(totales.personas), tono: 'text-text' },
            { etiqueta: 'Asignaciones', valor: `+${formatMoney(deCentavos(totales.asignaciones))}`, tono: 'text-success' },
            { etiqueta: 'Deducciones', valor: `−${formatMoney(deCentavos(totales.deducciones))}`, tono: 'text-error' },
            { etiqueta: 'Neto a pagar', valor: formatMoney(deCentavos(totales.neto)), tono: 'text-accent' },
            { etiqueta: 'Aporte patronal', valor: formatMoney(deCentavos(totales.patronal)), tono: 'text-text-secondary' },
            { etiqueta: 'Costo total', valor: formatMoney(deCentavos(totales.costo)), tono: 'text-text' },
          ].map((tarjeta) => (
            <div key={tarjeta.etiqueta} className="rounded-xl border border-border bg-surface-soft p-3">
              <span className="text-xs uppercase text-text-muted">{tarjeta.etiqueta}</span>
              <p className={`mt-1 text-lg font-bold ${tarjeta.tono}`}>{tarjeta.valor}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-muted">
          El aporte patronal es costo del patrono: se reporta aparte y no se descuenta al empleado.
        </p>
      </section>

      {conceptos.length > 0 && (
        <section className="reporte-tabla-scroll overflow-hidden rounded-xl border border-border/60 bg-surface-soft">
          <header className="border-b border-border/60 px-4 py-3">
            <h2 className="text-sm font-semibold text-text">Desglose por concepto</h2>
            <p className="mt-0.5 text-xs text-text-muted">Suma de todos los períodos emitidos.</p>
          </header>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-soft">
                <tr className="text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-2 font-medium">Código</th>
                  <th className="px-4 py-2 font-medium">Concepto</th>
                  <th className="px-4 py-2 font-medium">Tipo</th>
                  <th className="px-4 py-2 text-right font-medium">Líneas</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {conceptos.map((concepto) => (
                  <tr key={concepto.clave} className="border-t border-border/40">
                    <td className="num px-4 py-2 text-text-secondary">{concepto.codigo}</td>
                    <td className="px-4 py-2 text-text">{concepto.nombre_concepto}</td>
                    <td className="px-4 py-2 text-xs text-text-muted">
                      {TIPO_CONCEPTO_LABEL[concepto.tipo_concepto] ?? concepto.tipo_concepto}
                    </td>
                    <td className="num px-4 py-2 text-right text-text-secondary">{concepto.lineas}</td>
                    <td className="num px-4 py-2 text-right text-text">{formatMoney(deCentavos(concepto.totalCentavos))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text">Resumen por empleado</h2>
        <div className="reporte-tabla-scroll overflow-hidden rounded-xl border border-border">
          <ResponsiveTable
            columns={empleadoColumns}
            rows={porEmpleado}
            rowKey={(row) => row.personaId}
            caption="Totales acumulados por empleado en los períodos emitidos"
            loading={cargando}
            emptyTitle="Sin reportes"
            emptyMessage="Todavía no hay períodos emitidos con recibos."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-text">Reportes por empleado</h2>
        <div className="reporte-tabla-scroll max-h-[32rem] overflow-y-auto rounded-xl border border-border">
          <ResponsiveTable
            columns={reciboColumns}
            rows={recibos}
            rowKey={(row) => row.id}
            caption="Recibos definitivos de cada empleado, con descarga individual en PDF"
            loading={cargando}
            emptyTitle="Sin recibos"
            emptyMessage="Procesa un período para generar los recibos y sus reportes."
          />
        </div>
      </section>
    </div>
  );
}
