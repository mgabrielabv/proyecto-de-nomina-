import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { ResponsiveTable, type TableColumn } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Select } from '../../components/ui/Select';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useEmployeesStore, useOrgStore, useSessionStore, useToastStore } from '../../store';
import {
  CONFIRM_MESSAGES,
  CONTRACT_TYPE_LABEL,
  EMPLOYEE_STATUS_LABEL,
  EMPLOYEE_STATUS_TONE,
  EMPTY_MESSAGES,
  ROLE_LABEL,
  TOAST_MESSAGES,
} from '../../constants';
import { formatCurrency, formatDateShort } from '../../utils';
import type { Employee } from '../../types';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const ROLE_FILTERS = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'user', label: 'Usuario' },
  { value: 'superuser', label: 'Superusuario' },
];

export function AdminEmployees() {
  const push = useToastStore((state) => state.push);
  const currentUser = useSessionStore((state) => state.user);
  const { employees, loading, load, toggle, remove } = useEmployeesStore();
  const { departments, load: loadDepartments } = useOrgStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Employee | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void load();
    void loadDepartments();
  }, [load, loadDepartments]);

  const departmentName = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((item) => map.set(item.id, item.name));
    return (id: string) => map.get(id) ?? '—';
  }, [departments]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery =
        query.length === 0 ||
        employee.name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.jobTitle.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
      return matchesQuery && matchesStatus && matchesRole;
    });
  }, [employees, search, statusFilter, roleFilter]);

  const columns: TableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Empleado',
      render: (row) => (
        <span className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-text">{row.name}</span>
            <span className="block truncate text-xs text-text-muted">{row.email}</span>
          </span>
        </span>
      ),
      sortValue: (row) => row.name,
    },
    {
      key: 'jobTitle',
      header: 'Cargo',
      render: (row) => <span className="text-text-secondary">{row.jobTitle}</span>,
      sortValue: (row) => row.jobTitle,
    },
    {
      key: 'department',
      header: 'Departamento',
      render: (row) => <span className="text-text-secondary">{departmentName(row.departmentId)}</span>,
      sortValue: (row) => departmentName(row.departmentId),
      hideOnMobile: true,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (row) => (
        <Badge tone={row.role === 'superuser' ? 'warning' : 'neutral'}>{ROLE_LABEL[row.role]}</Badge>
      ),
      sortValue: (row) => row.role,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge tone={EMPLOYEE_STATUS_TONE[row.status]}>{EMPLOYEE_STATUS_LABEL[row.status]}</Badge>
      ),
      sortValue: (row) => row.status,
    },
  ];

  const handleToggle = async (employee: Employee) => {
    setBusy(true);
    try {
      await toggle(employee.id);
      setSelected((current) =>
        current && current.id === employee.id
          ? { ...current, status: current.status === 'active' ? 'inactive' : 'active' }
          : current,
      );
      push(TOAST_MESSAGES.employeeToggled);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    setBusy(true);
    try {
      await remove(confirmRemove.id);
      setConfirmRemove(null);
      setSelected(null);
      push(TOAST_MESSAGES.employeeRemoved);
    } finally {
      setBusy(false);
    }
  };

  const canRemove = confirmRemove && confirmRemove.id !== currentUser?.id;

  return (
    <div className="space-y-6">
      <PageHeader title="Empleados" description="Listado, filtros, acciones y detalle." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={fadeUpItem} className="flex flex-wrap items-end gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo o cargo"
              aria-label="Buscar empleados"
              className="h-11 w-full rounded-button border border-border bg-surface-soft pl-10 pr-4 text-sm text-text outline-none transition-colors duration-200 placeholder:text-text-muted focus:border-accent"
            />
          </div>
          <div className="w-full max-w-[200px]">
            <Select name="emp-status" label="Estado" value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} />
          </div>
          <div className="w-full max-w-[200px]">
            <Select name="emp-role" label="Rol" value={roleFilter} options={ROLE_FILTERS} onChange={setRoleFilter} />
          </div>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <ResponsiveTable
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            caption="Listado de empleados"
            loading={loading && employees.length === 0}
            onRowClick={setSelected}
            emptyMessage={EMPTY_MESSAGES.employees}
          />
        </motion.div>
      </motion.div>

      <Drawer open={selected !== null} title="Detalle del empleado" onClose={() => setSelected(null)} width="420px">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-text">{selected.name}</p>
                <p className="truncate text-sm text-text-secondary">{selected.jobTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={EMPLOYEE_STATUS_TONE[selected.status]}>{EMPLOYEE_STATUS_LABEL[selected.status]}</Badge>
                  <Badge tone={selected.role === 'superuser' ? 'warning' : 'neutral'}>{ROLE_LABEL[selected.role]}</Badge>
                </div>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              {[
                ['Correo', selected.email],
                ['Teléfono', selected.phone],
                ['Departamento', departmentName(selected.departmentId)],
                ['Contrato', CONTRACT_TYPE_LABEL[selected.contractType]],
                ['Alta', formatDateShort(selected.hireDate)],
                ['Salario base', formatCurrency(selected.baseSalary)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="text-text-muted">{label}</dt>
                  <dd className="text-right text-text">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-col gap-2.5 border-t border-border pt-4 sm:flex-row">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleToggle(selected)}
                className="h-11 flex-1 rounded-button border border-border bg-surface-soft text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
              >
                {selected.status === 'active' ? 'Desactivar' : 'Activar'}
              </button>
              {selected.id !== currentUser?.id && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmRemove(selected)}
                  className="h-11 flex-1 rounded-button border border-error/30 bg-error-soft text-sm font-medium text-error transition-colors duration-200 hover:border-error disabled:cursor-default disabled:opacity-60"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={confirmRemove !== null}
        title="Eliminar empleado"
        description={CONFIRM_MESSAGES.deleteEmployee}
        size="sm"
        onClose={() => setConfirmRemove(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmRemove(null)}
              className="h-11 rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
            >
              Cancelar
            </button>
            <Button state={busy ? 'loading' : 'idle'} disabled={!canRemove} onClick={() => void handleRemove()}>
              Eliminar
            </Button>
          </>
        }
      />
    </div>
  );
}
