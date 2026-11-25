import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Copy,
  Lock,
  Loader2,
  Play,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useSessionStore, useToastStore } from '../../store';
import {
  ConceptService,
  PeriodService,
  PreNominaService,
  type ConceptoCatalogo,
  type PreNominaDetalle,
  type PreNominaLinea,
  type PreNominaRecibo,
  type PeriodoNomina,
} from '../../features/payroll/services';
import {
  formatFechaLocal,
  formatMoney,
  hasAnyProfile,
} from '../../utils';
import {
  FRECUENCIA_LABEL,
  PERIODO_ESTADO_LABEL,
  PERIODO_ESTADO_TONE,
  TIPO_CONCEPTO_LABEL,
  TIPO_CONCEPTO_TONE,
  CONFIRM_MESSAGES,
} from '../../constants';

type PageMode = 'periodos' | 'editor';

const EDITABLE_CATEGORIES = new Set(['OPCIONAL', 'BONO', 'AJUSTE']);

const ORIGEN_AYUDA: Record<string, string> = {
  RECURRENTE: 'Se corrige en Conceptos por persona y se regenera.',
  NOVEDAD: 'Se corrige en Novedades y se regenera.',
  PRESTAMO: 'Se corrige en Préstamos y se regenera.',
  LEY: 'Lo calcula el sistema con la tasa vigente; no se edita.',
};

const esDineroValido = (valor: string): boolean => {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 && Number(Number(valor).toFixed(2)) === n;
};

const esCantidadValida = (valor: string | null | undefined): boolean => {
  if (valor === null || valor === undefined || valor === '') return true;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 && Number(Number(valor).toFixed(2)) === n;
};

// Agrupa las líneas por tipo de concepto para pintar cada bloque. Vive fuera
// del componente porque no necesita estado ni hooks (llamarla dentro del
// render violaría las reglas de hooks).
const agruparPorTipo = (lineas: PreNominaLinea[]): Record<string, PreNominaLinea[]> =>
  lineas.reduce<Record<string, PreNominaLinea[]>>((acc, linea) => {
    (acc[linea.tipoConcepto] ??= []).push(linea);
    return acc;
  }, {});

export function PreNominaPage() {
  const user = useSessionStore((state) => state.user);
  const pushToast = useToastStore((s) => s.push);
  const puedePreNomina = hasAnyProfile(user, ['RRHH', 'Superusuario']);

  const [periods, setPeriods] = useState<PeriodoNomina[]>([]);
  const [periodsLoading, setPeriodsLoading] = useState(true);
  const [periodsError, setPeriodsError] = useState<string | null>(null);

  const [mode, setMode] = useState<PageMode>('periodos');
  const [detail, setDetail] = useState<PreNominaDetalle | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Línea manual por agregar en un recibo.
  const [addLine, setAddLine] = useState<{
    reciboId: string;
    conceptoId: number | '';
    monto: string;
    cantidadUnidades: string;
  } | null>(null);
  const [conceptos, setConceptos] = useState<ConceptoCatalogo[]>([]);

  // Recibos cuyas líneas editables cambiaron localmente (solo ellos se envían).
  const [touchedRecibos, setTouchedRecibos] = useState<Set<string>>(new Set());

  // Borrado / confirmación final
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; periodoId: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; version: number; periodoId: string } | null>(null);

  // Oferta de regenerar tras 409 de novedades/cuotas fuera del borrador.
  const [regenOffer, setRegenOffer] = useState<{ id: string; periodoId: string; message: string } | null>(null);

  const markTouched = useCallback((reciboId: string) => {
    setTouchedRecibos((prev) => {
      const next = new Set(prev);
      next.add(reciboId);
      return next;
    });
  }, []);

  const loadPeriods = useCallback(async () => {
    setPeriodsLoading(true);
    setPeriodsError(null);
    try {
      const data = await PeriodService.listar();
      setPeriods(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPeriodsError(err?.message ?? 'Error al cargar periodos');
    } finally {
      setPeriodsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  useEffect(() => {
    if (!puedePreNomina) return;
    let active = true;
    void (async () => {
      try {
        const data = await ConceptService.listar();
        if (!active) return;
        setConceptos(Array.isArray(data) ? data : []);
      } catch {
        // Los conceptos son solo para agregar líneas manuales; no bloquea la página.
      }
    })();
    return () => {
      active = false;
    };
  }, [puedePreNomina]);

  const openEditor = useCallback((detalle: PreNominaDetalle) => {
    setDetail(detalle);
    setError(null);
    setRegenOffer(null);
    setMode('editor');
  }, []);

  const handleAbrir = async (preNominaId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detalle = await PreNominaService.ver(preNominaId);
      openEditor(detalle);
    } catch (err: any) {
      // 404: el borrador ya no existe (lo eliminó o confirmó otra pestaña).
      // Recargar la lista es la única salida útil.
      if (err?.status === 404) {
        setError('Ese borrador ya no existe. Se actualizó la lista de periodos.');
        await loadPeriods();
      } else {
        setError(err?.message ?? 'Error al abrir la pre-nómina');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleGenerar = async (periodoId: string) => {
    setActionBusy(true);
    setError(null);
    try {
      const detalle = await PreNominaService.generar(periodoId);
      pushToast('Pre-nómina generada', 'success');
      openEditor(detalle);
    } catch (err: any) {
      // 409/404: la lista estaba desactualizada. El período ya tiene un
      // borrador (o dejó de estar en BORRADOR, o desapareció). Al recargar,
      // el botón pasa a "Abrir" o desaparece; el mensaje del backend explica
      // cuál de los dos casos es.
      if (err?.status === 409 || err?.status === 404) {
        setError(
          err?.message ??
            'El período cambió de estado. Se actualizó la lista de periodos.',
        );
        await loadPeriods();
      } else {
        setError(err?.message ?? 'Error al generar la pre-nómina');
      }
    } finally {
      setActionBusy(false);
    }
  };

  const conceptosParaRecibo = useCallback(
    (reciboId: string) => {
      const recibo = detail?.recibos.find((r) => r.id === reciboId);
      const usados = new Set(recibo?.lineas.map((l) => l.conceptoId));
      return conceptos
        .filter(
          (c) =>
            c.activo &&
            EDITABLE_CATEGORIES.has(c.categoria) &&
            c.tipo_concepto !== 'APORTE_PATRONAL' &&
            !usados.has(c.id),
        )
        .sort((a, b) => a.codigo.localeCompare(b.codigo));
    },
    [conceptos, detail],
  );

  const editableLineasDe = useCallback(
    (reciboId: string): PreNominaLinea[] =>
      detail?.recibos.find((r) => r.id === reciboId)?.lineas.filter((l) => l.editable) ?? [],
    [detail],
  );

  const updateLinea = useCallback(
    (reciboId: string, lineaId: string, changes: Partial<Pick<PreNominaLinea, 'monto' | 'cantidadUnidades'>>) => {
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recibos: prev.recibos.map((r) =>
            r.id === reciboId
              ? {
                  ...r,
                  lineas: r.lineas.map((l) =>
                    l.id === lineaId ? { ...l, ...changes } : l,
                  ),
                }
              : r,
          ),
        };
      });
      markTouched(reciboId);
    },
    [markTouched],
  );

  const removeLinea = useCallback((reciboId: string, lineaId: string) => {
    setDetail((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        recibos: prev.recibos.map((r) =>
          r.id === reciboId
            ? {
                ...r,
                lineas: r.lineas.filter((l) => !(l.id === lineaId && l.editable)),
              }
            : r,
        ),
      };
    });
    markTouched(reciboId);
    setAddLine((prev) => (prev?.reciboId === reciboId ? null : prev));
  }, [markTouched]);

  const setAddLineField = useCallback((field: 'conceptoId' | 'monto' | 'cantidadUnidades', value: string | number) => {
    setAddLine((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const handleAddLinea = async () => {
    if (!addLine) return;
    const { reciboId, conceptoId, monto, cantidadUnidades } = addLine;
    if (conceptoId === '' || typeof conceptoId !== 'number') {
      setError('Selecciona un concepto');
      return;
    }
    const concepto = conceptos.find((c) => c.id === conceptoId);
    if (!concepto) {
      setError('El concepto seleccionado ya no está disponible. Recarga la página.');
      return;
    }
    if (!esDineroValido(monto)) {
      setError('El monto debe ser mayor que cero y tener máximo 2 decimales.');
      return;
    }
    if (!esCantidadValida(cantidadUnidades)) {
      setError('La cantidad de unidades debe ser válida (máximo 2 decimales).');
      return;
    }
    setActionBusy(true);
    try {
      setDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recibos: prev.recibos.map((r) =>
            r.id === reciboId
              ? {
                  ...r,
                  lineas: [
                    ...r.lineas,
                    {
                      id: null,
                      conceptoId,
                      // Los datos del concepto vienen del catálogo, no se
                      // inventan: la línea manual debe mostrar su nombre y
                      // tipo reales aunque todavía no esté guardada.
                      codigo: concepto.codigo,
                      nombreConcepto: concepto.nombre_concepto,
                      tipoConcepto: concepto.tipo_concepto,
                      categoria: concepto.categoria,
                      unidad: concepto.unidad,
                      origen: 'MANUAL',
                      editable: true,
                      editada: true,
                      cuotaPrestamoId: null,
                      novedadId: null,
                      conceptoPersonaId: null,
                      parametroAporteId: null,
                      baseCalculo: null,
                      tasaAplicada: null,
                      cantidadUnidades: cantidadUnidades || null,
                      monto,
                    } as unknown as PreNominaLinea,
                  ],
                }
              : r,
          ),
        };
      });
      markTouched(reciboId);
      setAddLine(null);
      setError(null);
    } finally {
      setActionBusy(false);
    }
  };

  const handleGuardar = async () => {
    if (!detail) return;
    setError(null);

    // Validación local rápida de las líneas que se enviarán.
    for (const reciboId of touchedRecibos) {
      for (const linea of editableLineasDe(reciboId)) {
        if (!esDineroValido(linea.monto)) {
          setError(`El monto de "${linea.nombreConcepto}" es inválido.`);
          return;
        }
        if (!esCantidadValida(linea.cantidadUnidades)) {
          setError(`La cantidad de unidades de "${linea.nombreConcepto}" es inválida.`);
          return;
        }
      }
    }

    const body = {
      recibos: Array.from(touchedRecibos).map((reciboId) => ({
        reciboId,
        lineas: editableLineasDe(reciboId).map((l) => {
          const linea: { id: string | null; monto: string; cantidadUnidades: string | null; conceptoId?: number } = {
            id: l.id,
            monto: l.monto,
            cantidadUnidades: l.cantidadUnidades,
          };
          if (l.id === null) linea.conceptoId = l.conceptoId;
          return linea;
        }),
      })),
    };

    if (body.recibos.length === 0) {
      setError('No hay cambios que guardar.');
      return;
    }

    setActionBusy(true);
    try {
      const res = await PreNominaService.guardar(detail.preNomina.id, detail.preNomina.version, body);
      pushToast('Borrador guardado', 'success');
      setDetail(res);
      setTouchedRecibos(new Set());
    } catch (err: any) {
      if (err.status === 409) {
        const msg = err?.message ?? '';
        if (msg.includes('cambió desde que la abriste')) {
          setError('La pre-nómina cambió desde que la abriste. Se recargará y se perderá la edición local.');
          try {
            const recargada = await PreNominaService.ver(detail.preNomina.id);
            setDetail(recargada);
            setTouchedRecibos(new Set());
          } catch {
            // Ignorado: el error original ya se muestra.
          }
          return;
        }
        if (msg.includes('novedades aprobadas después') || msg.includes('cuotas pendientes después')) {
          setRegenOffer({ id: detail.preNomina.id, periodoId: detail.preNomina.periodoId, message: msg });
          return;
        }
      }
      setError(err?.message ?? 'Error al guardar el borrador');
    } finally {
      setActionBusy(false);
    }
  };

  const handleEliminar = async () => {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      await PreNominaService.eliminar(deleteTarget.id);
      pushToast('Borrador eliminado', 'success');
      setDeleteTarget(null);
      setMode('periodos');
      await loadPeriods();
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar el borrador');
    } finally {
      setActionBusy(false);
    }
  };

  const handleRegenerar = async () => {
    if (!regenOffer) return;
    setActionBusy(true);
    try {
      await PreNominaService.eliminar(regenOffer.id);
      const detalle = await PreNominaService.generar(regenOffer.periodoId);
      pushToast('Pre-nómina regenerada', 'success');
      setRegenOffer(null);
      openEditor(detalle);
    } catch (err: any) {
      setError(err?.message ?? 'Error al regenerar la pre-nómina');
    } finally {
      setActionBusy(false);
    }
  };

  const handleConfirmar = async () => {
    if (!confirmTarget) return;
    setActionBusy(true);
    try {
      const res = await PreNominaService.confirmar(confirmTarget.id, confirmTarget.version);
      pushToast(
        `Nómina confirmada. Novedades aplicadas: ${res.novedadesAplicadas}, cuotas descontadas: ${res.cuotasDescontadas}, préstamos pagados: ${res.prestamosPagados}`,
        'success',
      );
      setConfirmTarget(null);
      setMode('periodos');
      await loadPeriods();
    } catch (err: any) {
      if (err.status === 409) {
        const msg = err?.message ?? '';
        if (msg.includes('novedades aprobadas después') || msg.includes('cuotas pendientes después') || msg.includes('ya fue descontada')) {
          setRegenOffer({ id: confirmTarget.id, periodoId: confirmTarget.periodoId, message: msg });
          setConfirmTarget(null);
          return;
        }
      }
      setError(err?.message ?? 'Error al confirmar la nómina');
    } finally {
      setActionBusy(false);
    }
  };

  if (!puedePreNomina) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pre-nómina" description="Acceso restringido." />
        <div className="rounded-2xl border border-error/30 bg-error/10 p-8 text-center sm:p-12">
          <ShieldAlert className="mx-auto h-12 w-12 text-error" />
          <h2 className="mt-4 text-xl font-bold text-text">Acceso Restringido</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Esta pantalla es de uso exclusivo para los perfiles{' '}
            <strong>RRHH</strong> y <strong>Superusuario</strong>.
          </p>
        </div>
      </div>
    );
  }

  const detalle = detail;
  const periodo = detalle?.preNomina.periodo;

  const renderLinea = (linea: PreNominaLinea, reciboId: string) => {
    const editable = linea.editable;
    const montoId = `monto-${linea.id}`;
    const cantidadId = `cantidad-${linea.id}`;

    if (!editable) {
      return (
        <div key={linea.id} className="flex items-center gap-2 text-sm text-text-secondary">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium">{linea.nombreConcepto}</span>
          <span className="text-text-muted"> · {formatMoney(linea.monto)}</span>
          {linea.cantidadUnidades && (
            <span className="text-text-muted"> ({linea.cantidadUnidades} {linea.unidad})</span>
          )}
          <span className="ml-2 flex h-7 items-center rounded-md border border-border bg-surface-soft px-2 text-xs font-medium text-text-muted">
            {ORIGEN_AYUDA[linea.origen] || 'No se puede editar.'}
          </span>
        </div>
      );
    }

    return (
      <div key={linea.id} className="grid items-center gap-2 sm:grid-cols-4 sm:gap-4 border-b border-border pb-3">
        <div className="col-span-full sm:col-span-2 text-sm">
          <span className="font-medium text-text">{linea.nombreConcepto}</span>
          <p className="text-xs text-text-muted">
            {linea.codigo}{' '}
            <Badge tone={TIPO_CONCEPTO_TONE[linea.tipoConcepto] ?? 'neutral'}>
              {TIPO_CONCEPTO_LABEL[linea.tipoConcepto]}
            </Badge>
          </p>
        </div>
        <div className="sm:col-span-1">
          <Input
            name={montoId}
            label="Monto"
            value={linea.monto}
            onChange={(v) => updateLinea(reciboId, linea.id, { monto: v })}
          />
        </div>
        <div className="sm:col-span-1">
          <Input
            name={cantidadId}
            label="Cantidad unidades"
            value={linea.cantidadUnidades ?? ''}
            onChange={(v) => updateLinea(reciboId, linea.id, { cantidadUnidades: v || null })}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => removeLinea(reciboId, linea.id)}
            title="Quitar línea editable"
            className="h-8 w-8 shrink-0 rounded-md border border-error/30 bg-error/10 text-error flex items-center justify-center hover:bg-error/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderManualAdder = (reciboId: string) => {
    const active = addLine?.reciboId === reciboId;
    const disponibles = conceptosParaRecibo(reciboId);
    const options = disponibles.map((c) => ({
      value: String(c.id),
      label: `${c.codigo} — ${c.nombre_concepto}`,
    }));

    return (
      <div className="mt-3 rounded-xl border border-border/60 bg-surface-soft p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-accent" />
            <span className="text-sm font-medium text-text">Agregar línea manual</span>
          </div>
          {!active && (
            <button
              type="button"
              disabled={disponibles.length === 0 || actionBusy}
              onClick={() => setAddLine({ reciboId, conceptoId: '', monto: '', cantidadUnidades: '' })}
              className="h-9 rounded-md border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Agregar línea
            </button>
          )}
        </div>

        {!active && disponibles.length === 0 && (
          <p className="mt-2 text-xs text-text-muted">
            No quedan conceptos editables disponibles para este recibo.
          </p>
        )}

        {active && (
          <div className="mt-3 grid items-end gap-2 sm:grid-cols-4">
            <Select
              name={`nuevo-concepto-${reciboId}`}
              label="Concepto"
              value={String(addLine.conceptoId ?? '')}
              options={options}
              placeholder="Seleccionar concepto"
              onChange={(v) => setAddLineField('conceptoId', v === '' ? '' : Number(v))}
            />
            <Input
              name={`nuevo-monto-${reciboId}`}
              label="Monto"
              value={addLine.monto}
              onChange={(v) => setAddLineField('monto', v)}
            />
            <Input
              name={`nuevo-cantidad-${reciboId}`}
              label="Cantidad unidades"
              value={addLine.cantidadUnidades}
              onChange={(v) => setAddLineField('cantidadUnidades', v)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setAddLine(null)}
                className="h-11 flex-1 rounded-md border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition hover:bg-surface-soft disabled:opacity-50"
              >
                Cancelar
              </button>
              <Button onClick={handleAddLinea} size="lg" disabled={actionBusy}>
                {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Agregar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecibo = (recibo: PreNominaRecibo) => {
    const grupos = agruparPorTipo(recibo.lineas);

    return (
      <Card key={recibo.id} padding="sm" className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="font-medium text-text">{recibo.nombre}</p>
            <p className="text-xs text-text-muted">
              CI: {recibo.cedula} · Contrato: {recibo.contratoId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text">{formatMoney(recibo.montoTotal)}</p>
            <p className="text-xs text-text-secondary">
              +{formatMoney(recibo.totalAsignaciones)} −{formatMoney(recibo.totalDeducciones)}
            </p>
          </div>
        </div>
        {(['ASIGNACION', 'DEDUCCION', 'APORTE_PATRONAL'] as const).map((tipo) => {
          const lineas = (grupos[tipo] ?? []).slice();
          if (lineas.length === 0) return null;
          return (
            <div key={tipo} className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                {TIPO_CONCEPTO_LABEL[tipo]}
              </p>
              <div className="space-y-1">
                {lineas.map((l) => renderLinea(l, recibo.id))}
              </div>
            </div>
          );
        })}
        {renderManualAdder(recibo.id)}
      </Card>
    );
  };

  const periodoHeader = () => {
    if (!periodo) return null;
    return (
      <Card className="mb-4">
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
              Periodo
            </p>
            <p className="text-sm font-medium text-text">{periodo.descripcion || '—'}</p>
            <p className="text-xs text-text-secondary">
              {formatFechaLocal(periodo.fechaInicio)} — {formatFechaLocal(periodo.fechaFin)} ·{' '}
              {FRECUENCIA_LABEL[periodo.frecuencia] ?? periodo.frecuencia}
            </p>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">
                Versión del borrador
              </p>
              <p className="text-sm font-medium text-text">{detalle?.preNomina.version}</p>
            </div>
            <Copy className="h-4 w-4 shrink-0 text-text-muted" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface-soft p-3">
            <span className="text-xs text-text-muted uppercase">Total asignaciones</span>
            <p className="mt-1 font-semibold tabular-nums text-success">+{formatMoney(detalle?.preNomina.totalAsignaciones ?? '0')}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-soft p-3">
            <span className="text-xs text-text-muted uppercase">Total deducciones</span>
            <p className="mt-1 font-semibold tabular-nums text-error">−{formatMoney(detalle?.preNomina.totalDeducciones ?? '0')}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-soft p-3">
            <span className="text-xs text-text-muted uppercase">Neto a pagar</span>
            <p className="mt-1 font-semibold tabular-nums text-text">{formatMoney(detalle?.preNomina.montoTotal ?? '0')}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-soft p-3">
            <span className="text-xs text-text-muted uppercase">Costo patronal (aparte)</span>
            <p className="mt-1 font-semibold tabular-nums text-accent">{formatMoney(detalle?.preNomina.totalAportePatronal ?? '0')}</p>
          </div>
        </div>
      </Card>
    );
  };

  const renderPeriodos = () => {
    if (periodsLoading) {
      return (
        <div className="flex h-64 items-center justify-center text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" /> Cargando periodos...
        </div>
      );
    }
    if (periodsError) {
      return (
        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
          {periodsError}
        </div>
      );
    }
    if (periods.length === 0) {
      return <div className="rounded-xl border border-border/60 bg-surface-soft p-8 text-center text-sm text-text-secondary">No hay periodos registrados.</div>;
    }

    return (
      <div className="space-y-3">
        {periods.map((p) => (
          <Card key={p.id} padding="sm" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-spot transition-colors cursor-default">
            <div className="space-y-1">
              <p className="font-medium text-text">
                {FRECUENCIA_LABEL[p.frecuencia] ?? p.frecuencia} · {p.descripcion || '—'}
              </p>
              <p className="text-xs text-text-secondary">
                {formatFechaLocal(p.fecha_inicio)} — {formatFechaLocal(p.fecha_fin)}
              </p>
              <span className="inline-flex items-center gap-1 mt-1 rounded-md border px-2 py-0.5 text-xs font-medium">
                <Badge tone={PERIODO_ESTADO_TONE[p.estado] ?? 'neutral'}>
                  {PERIODO_ESTADO_LABEL[p.estado]}
                </Badge>
                {p.preNominaId && (
                  <span className="ml-1 h-5 shrink-0 rounded-md border border-border bg-surface-soft px-2 text-[10px] font-semibold text-text-secondary">
                    Borrador v{p.preNominaVersion ?? 0}
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {p.estado === 'BORRADOR' && p.preNominaId ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleAbrir(p.preNominaId!)}
                    className="h-9 shrink-0 rounded-button border border-border bg-surface-soft px-3 text-xs font-medium text-text-secondary hover:text-text hover:bg-surface"
                  >
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                    Abrir
                  </button>
                </>
              ) : p.estado === 'BORRADOR' ? (
                <Button onClick={() => void handleGenerar(p.id)}>
                  <Play className="mr-1.5 h-3.5 w-3.5" />
                  Generar pre-nómina
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderEditor = () => {
    if (!detalle) return null;
    const recibos = detalle.recibos;

    return (
      <div className="space-y-5">
        {periodoHeader()}

        {error && (
          <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
            {error}
          </div>
        )}

        {regenOffer && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            {regenOffer.message}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleRegenerar}
                disabled={actionBusy}
                className="h-9 rounded-button border border-border bg-surface-soft px-3 text-xs font-medium text-text-secondary hover:text-text"
              >
                Regenerar (eliminar + generar)
              </button>
              <button
                type="button"
                onClick={() => setRegenOffer(null)}
                className="h-9 rounded-button border border-border bg-surface-soft px-3 text-xs font-medium text-text-secondary hover:text-text"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {recibos.map((r) => renderRecibo(r))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 md:flex-nowrap">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionBusy || detailLoading}
              onClick={() => {
                setMode('periodos');
                setError(null);
                void loadPeriods();
              }}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text disabled:opacity-50"
            >
              Volver a periodos
            </button>
            <button
              type="button"
              disabled={actionBusy || detailLoading || !touchedRecibos.size}
              onClick={handleGuardar}
              className="h-11 rounded-button border border-transparent bg-accent text-accent-text hover:bg-accent-hover px-4 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar borrador
            </button>
            <button
              type="button"
              disabled={actionBusy || detailLoading}
              onClick={() => setDeleteTarget({ id: detalle.preNomina.id, periodoId: detalle.preNomina.periodoId })}
              className="h-11 rounded-button border border-error/40 bg-error/10 px-4 text-sm font-medium text-error hover:bg-error/20 disabled:opacity-50"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Eliminar borrador
            </button>
            <Button
              state={actionBusy ? 'loading' : 'idle'}
              disabled={actionBusy || detailLoading}
              onClick={() =>
                setConfirmTarget({
                  id: detalle.preNomina.id,
                  version: detalle.preNomina.version,
                  periodoId: detalle.preNomina.periodoId,
                })
              }
            >
              <Play className="mr-1.5 h-4 w-4" />
              Generar nómina final
            </Button>
          </div>
          <p className="text-xs text-text-muted">
            Solo se envían las líneas editables de los recibos que modificaste.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'editor' ? 'Editor de pre-nómina' : 'Pre-nómina'}
        description={
          mode === 'editor'
            ? 'Borrador editable de la nómina del periodo. Solo las líneas con ícono de candado abierto se pueden editar.'
            : 'Lista de periodos con su estado de borrador. Genera, abre, edita y confirma la pre-nómina.'
        }
      />

      <motion.div variants={fadeUpItem} initial="hidden" animate="show" className="space-y-5">
        {mode === 'periodos' ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Periodos de nómina</h2>
              {periods.length > 0 && (
                <button
                  type="button"
                  disabled={periodsLoading || actionBusy}
                  onClick={() => {
                    setError(null);
                    void loadPeriods();
                  }}
                  className="h-9 rounded-button border border-border bg-surface-soft px-3 text-xs font-medium text-text-secondary hover:text-text disabled:opacity-50"
                >
                  <Loader2 className={periodsLoading ? 'mr-2 h-3.5 w-3.5 animate-spin' : 'mr-2 h-3.5 w-3.5'} />
                  Refrescar
                </button>
              )}
            </div>
            {error && (
              <div className="mb-3 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                {error}
              </div>
            )}
            {renderPeriodos()}
          </>
        ) : (
          renderEditor()
        )}
      </motion.div>

      {/* Modal: eliminar borrador */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar borrador?"
        description="Esta acción elimina la pre-nómina en borrador y el periodo queda como estaba. No afecta novedades ni cuotas."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setDeleteTarget(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleEliminar}>
              Sí, eliminar borrador
            </Button>
          </>
        }
      />

      {/* Modal: confirmar nómina final */}
      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title="¿Generar nómina final?"
        description={
          CONFIRM_MESSAGES.confirmPreNomina +
          ' El borrador desaparece y la nómina no se puede reabrir desde esta pantalla.'
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setConfirmTarget(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleConfirmar}>
              Sí, generar nómina final
            </Button>
          </>
        }
      />
    </div>
  );
}
