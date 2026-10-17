import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, Users } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useEmployeesStore, useOrgStore, useToastStore } from '../../store';
import { FORM_MESSAGES, TOAST_MESSAGES } from '../../constants';
import type { Department, Position } from '../../types';

interface DeptFormState {
  open: boolean;
  editing: Department | null;
  name: string;
  manager: string;
  errors: Record<string, string>;
}

interface PosFormState {
  open: boolean;
  editing: Position | null;
  title: string;
  departmentId: string;
  errors: Record<string, string>;
}

const emptyDept: DeptFormState = { open: false, editing: null, name: '', manager: '', errors: {} };
const emptyPos: PosFormState = { open: false, editing: null, title: '', departmentId: '', errors: {} };

export function AdminDepartments() {
  const push = useToastStore((state) => state.push);
  const { departments, positions, loading, load, addDepartment, editDepartment, addPosition, editPosition } =
    useOrgStore();
  const { employees, load: loadEmployees } = useEmployeesStore();

  const [dept, setDept] = useState<DeptFormState>(emptyDept);
  const [pos, setPos] = useState<PosFormState>(emptyPos);

  useEffect(() => {
    void load();
    void loadEmployees();
  }, [load, loadEmployees]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((employee) => {
      map.set(employee.departmentId, (map.get(employee.departmentId) ?? 0) + 1);
    });
    return map;
  }, [employees]);

  const departmentName = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((item) => map.set(item.id, item.name));
    return (id: string) => map.get(id) ?? '—';
  }, [departments]);

  const openDept = (department?: Department) => {
    setDept(
      department
        ? { open: true, editing: department, name: department.name, manager: department.manager, errors: {} }
        : { ...emptyDept, open: true },
    );
  };

  const saveDept = async () => {
    const errors: Record<string, string> = {};
    if (!dept.name.trim()) errors.name = FORM_MESSAGES.required;
    if (!dept.manager.trim()) errors.manager = FORM_MESSAGES.required;
    if (Object.keys(errors).length > 0) {
      setDept((current) => ({ ...current, errors }));
      return;
    }
    if (dept.editing) {
      await editDepartment(dept.editing.id, { name: dept.name.trim(), manager: dept.manager.trim() });
      push(TOAST_MESSAGES.departmentUpdated);
    } else {
      await addDepartment(dept.name.trim(), dept.manager.trim());
      push(TOAST_MESSAGES.departmentCreated);
    }
    setDept(emptyDept);
  };

  const openPos = (position?: Position) => {
    setPos(
      position
        ? { open: true, editing: position, title: position.title, departmentId: position.departmentId, errors: {} }
        : { ...emptyPos, open: true, departmentId: departments[0]?.id ?? '' },
    );
  };

  const savePos = async () => {
    const errors: Record<string, string> = {};
    if (!pos.title.trim()) errors.title = FORM_MESSAGES.required;
    if (!pos.departmentId) errors.departmentId = FORM_MESSAGES.required;
    if (Object.keys(errors).length > 0) {
      setPos((current) => ({ ...current, errors }));
      return;
    }
    if (pos.editing) {
      await editPosition(pos.editing.id, { title: pos.title.trim(), departmentId: pos.departmentId });
      push(TOAST_MESSAGES.positionUpdated);
    } else {
      await addPosition(pos.title.trim(), pos.departmentId);
      push(TOAST_MESSAGES.positionCreated);
    }
    setPos(emptyPos);
  };

  const departmentOptions = departments.map((item) => ({ value: item.id, label: item.name }));

  return (
    <div className="space-y-6">
      <PageHeader title="Departamentos y cargos" description="Gestión de estructura organizativa." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUpItem}>
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-text">Departamentos</h3>
                <p className="mt-1 text-xs text-text-muted">{departments.length} en la organización</p>
              </div>
              <Button onClick={() => openDept()} size="md" className="shrink-0">
                <span className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden />
                  Nuevo
                </span>
              </Button>
            </div>

            <ul className="space-y-2.5">
              {loading && departments.length === 0 && (
                <li className="space-y-2.5">
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={index} className="block h-12 animate-pulse rounded-xl bg-surface-soft" />
                  ))}
                </li>
              )}
              {!loading && departments.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
                  No hay departamentos todavía.
                </li>
              )}
              {departments.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openDept(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-soft/70 px-4 py-3 text-left transition-colors duration-200 hover:border-border-strong"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-text-secondary">
                        <Building2 className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-text">{item.name}</span>
                        <span className="block truncate text-xs text-text-muted">Responsable: {item.manager}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {counts.get(item.id) ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-text">Cargos</h3>
                <p className="mt-1 text-xs text-text-muted">{positions.length} definidos</p>
              </div>
              <Button onClick={() => openPos()} size="md" className="shrink-0">
                <span className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" aria-hidden />
                  Nuevo
                </span>
              </Button>
            </div>

            <ul className="space-y-2.5">
              {loading && positions.length === 0 && (
                <li className="space-y-2.5">
                  {Array.from({ length: 3 }, (_, index) => (
                    <span key={index} className="block h-12 animate-pulse rounded-xl bg-surface-soft" />
                  ))}
                </li>
              )}
              {!loading && positions.length === 0 && (
                <li className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
                  No hay cargos todavía.
                </li>
              )}
              {positions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openPos(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-soft/70 px-4 py-3 text-left transition-colors duration-200 hover:border-border-strong"
                  >
                    <span className="min-w-0 truncate text-sm font-medium text-text">{item.title}</span>
                    <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-text-muted">
                      {departmentName(item.departmentId)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </motion.div>

      <Modal
        open={dept.open}
        title={dept.editing ? 'Editar departamento' : 'Nuevo departamento'}
        onClose={() => setDept(emptyDept)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDept(emptyDept)}
              className="h-11 rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
            >
              Cancelar
            </button>
            <Button onClick={() => void saveDept()}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            name="dept-name"
            label="Nombre"
            value={dept.name}
            error={dept.errors.name}
            onChange={(value) => setDept((current) => ({ ...current, name: value, errors: { ...current.errors, name: '' } }))}
          />
          <Input
            name="dept-manager"
            label="Responsable"
            value={dept.manager}
            error={dept.errors.manager}
            onChange={(value) => setDept((current) => ({ ...current, manager: value, errors: { ...current.errors, manager: '' } }))}
          />
        </div>
      </Modal>

      <Modal
        open={pos.open}
        title={pos.editing ? 'Editar cargo' : 'Nuevo cargo'}
        onClose={() => setPos(emptyPos)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setPos(emptyPos)}
              className="h-11 rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text"
            >
              Cancelar
            </button>
            <Button onClick={() => void savePos()}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            name="pos-title"
            label="Título del cargo"
            value={pos.title}
            error={pos.errors.title}
            onChange={(value) => setPos((current) => ({ ...current, title: value, errors: { ...current.errors, title: '' } }))}
          />
          <Select
            name="pos-department"
            label="Departamento"
            value={pos.departmentId}
            options={departmentOptions}
            error={pos.errors.departmentId}
            onChange={(value) => setPos((current) => ({ ...current, departmentId: value, errors: { ...current.errors, departmentId: '' } }))}
          />
        </div>
      </Modal>
    </div>
  );
}
