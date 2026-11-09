import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2 } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';

import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useToastStore } from '../../store';
import { CargoService, type CargoTarifa } from '../../features/payroll/services';
import { formatMoney } from '../../utils';

export function CargosPage() {
  const [cargos, setCargos] = useState<CargoTarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);

  // Modal Actualizar Valor Hora
  const [editCargo, setEditCargo] = useState<CargoTarifa | null>(null);
  const [nuevoValor, setNuevoValor] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const pushToast = useToastStore((s) => s.push);

  const loadCargos = async () => {
    setLoading(true);
    try {
      const data = await CargoService.listarCargosTarifa();
      setCargos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      pushToast(err?.message ?? 'Error al cargar cargos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCargos();
  }, []);

  const openEdit = (cargo: CargoTarifa) => {
    setEditCargo(cargo);
    setNuevoValor(cargo.valor_hora_base || '0.00');
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCargo) return;
    setEditError(null);

    const valNum = Number(nuevoValor);
    if (valNum < 0 || Number.isNaN(valNum)) {
      setEditError('El valor por hora debe ser un número mayor o igual a 0');
      return;
    }

    setActionBusy(true);
    try {
      await CargoService.actualizarValorHora(editCargo.id, nuevoValor);
      pushToast(`Tarifa de ${editCargo.nombre} actualizada correctamente`, 'success');
      setEditCargo(null);
      await loadCargos();
    } catch (err: any) {
      setEditError(err?.message ?? 'Error al actualizar valor de hora');
    } finally {
      setActionBusy(false);
    }
  };

  const columns: TableColumn<CargoTarifa>[] = [
    {
      key: 'nombre',
      header: 'Cargo',
      render: (row) => <span className="font-semibold text-text">{row.nombre}</span>,
      sortValue: (row) => row.nombre,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (row) => (
        <span className="text-text-secondary">{row.descripcion || '—'}</span>
      ),
    },
    {
      key: 'valor_hora_base',
      header: 'Valor hora base',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums text-accent">
          {formatMoney(row.valor_hora_base)}
        </span>
      ),
      sortValue: (row) => Number(row.valor_hora_base),
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (row) => (
        <Badge tone={row.activo ? 'success' : 'neutral'}>
          {row.activo ? 'ACTIVO' : 'INACTIVO'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => openEdit(row)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-soft px-3 py-1.5 text-xs font-medium text-text transition hover:border-border-strong hover:bg-surface"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Editar tarifa
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarifas por Cargo"
        description="Gestión y actualización de los valores de hora base estipulados para cada cargo en la nómina."
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
            rows={cargos}
            rowKey={(r) => String(r.id)}
            caption="Cargos y tarifas por hora registradas"
            loading={loading}
            emptyMessage="No hay cargos registrados."
          />
        </motion.div>
      </motion.div>

      {/* Modal Editar Tarifa */}
      <Modal
        open={Boolean(editCargo)}
        onClose={() => setEditCargo(null)}
        title={`Actualizar tarifa: ${editCargo?.nombre ?? ''}`}
        description="El nuevo valor de hora base se aplicará a los cálculos de nómina de horas regulares y horas extras."
        size="sm"
        footer={
          <>
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => setEditCargo(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-4 text-sm font-medium text-text-secondary hover:text-text"
            >
              Cancelar
            </button>
            <Button state={actionBusy ? 'loading' : 'idle'} onClick={handleUpdate}>
              Guardar tarifa
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {editError && (
            <div className="rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
              {editError}
            </div>
          )}

          <Input
            type="number"
            step="0.01"
            min="0"
            name="nuevoValor"
            label="Valor hora base ($)"
            placeholder="0.00"
            value={nuevoValor}
            onChange={(val) => setNuevoValor(val)}
            required
            autoFocus
          />

        </form>
      </Modal>
    </div>
  );
}
