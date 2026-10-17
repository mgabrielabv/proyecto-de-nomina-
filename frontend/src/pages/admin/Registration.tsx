import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useOrgStore, useToastStore } from '../../store';
import { registerPerson, validateDraftStep } from '../../features/registration/services';
import { CONTRACT_TYPE_LABEL, ROLE_LABEL, TOAST_MESSAGES } from '../../constants';
import type { ContractType, EmployeeDraft, UserRole } from '../../types';

const STEPS = [
  { label: 'Datos personales', description: 'Identificación' },
  { label: 'Datos laborales', description: 'Cargo y contrato' },
  { label: 'Cuenta de acceso', description: 'Credenciales' },
  { label: 'Confirmación', description: 'Revisión' },
];

interface FormValues {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string;
  hireDate: string;
  contractType: ContractType;
  baseSalary: string;
  password: string;
  role: UserRole;
}

const INITIAL_VALUES: FormValues = {
  name: '',
  email: '',
  phone: '',
  jobTitle: '',
  departmentId: '',
  hireDate: '',
  contractType: 'indefinido',
  baseSalary: '',
  password: '',
  role: 'user',
};

export function AdminRegistration() {
  const push = useToastStore((state) => state.push);
  const { departments, load: loadDepartments } = useOrgStore();

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const draft: EmployeeDraft = useMemo(
    () => ({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      jobTitle: values.jobTitle.trim(),
      departmentId: values.departmentId,
      role: values.role,
      status: 'active',
      hireDate: values.hireDate,
      contractType: values.contractType,
      baseSalary: Number(values.baseSalary) || 0,
      password: values.password,
    }),
    [values],
  );

  const departmentOptions = departments.map((item) => ({ value: item.id, label: item.name }));
  const departmentName = (id: string) => departments.find((item) => item.id === id)?.name ?? '—';

  const set = (patch: Partial<FormValues>) => setValues((current) => ({ ...current, ...patch }));

  const next = () => {
    const stepErrors = validateDraftStep(draft, step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const back = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const submit = async () => {
    const stepErrors = [0, 1, 2].reduce<Record<string, string>>(
      (acc, index) => ({ ...acc, ...validateDraftStep(draft, index) }),
      {},
    );
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setStep(0);
      return;
    }
    setBusy(true);
    try {
      const result = await registerPerson(draft);
      if (!result.ok) {
        setErrors({ email: result.error ?? 'No se pudo registrar la persona.' });
        setStep(0);
        push(result.error ?? 'No se pudo registrar la persona.', 'error');
        return;
      }
      setDone(true);
      push(TOAST_MESSAGES.employeeCreated);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setStep(0);
    setDone(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Registrar personas" description="Dar de alta usuarios con rol user o superuser." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show">
        <Card padding="lg" className="space-y-7">
          {done ? (
            <motion.div variants={fadeUpItem} className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-success/30 bg-success-soft text-success">
                <CheckCircle2 className="h-8 w-8" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-text">Persona registrada</h3>
                <p className="mt-1.5 text-sm text-text-secondary">
                  {values.name} ya forma parte de la organización.
                </p>
              </div>
              <Button onClick={reset}>Registrar otra persona</Button>
            </motion.div>
          ) : (
            <>
              <Stepper steps={STEPS} current={step} onSelect={setStep} />

              <motion.div
                key={step}
                variants={fadeUpItem}
                initial="hidden"
                animate="show"
                className="space-y-5"
              >
                {step === 0 && (
                  <>
                    <Input
                      name="reg-name"
                      label="Nombre completo"
                      value={values.name}
                      error={errors.name}
                      onChange={(value) => set({ name: value })}
                    />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Input
                        name="reg-email"
                        label="Correo electrónico"
                        type="email"
                        value={values.email}
                        error={errors.email}
                        onChange={(value) => set({ email: value })}
                      />
                      <Input
                        name="reg-phone"
                        label="Teléfono"
                        value={values.phone}
                        error={errors.phone}
                        onChange={(value) => set({ phone: value })}
                      />
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <Input
                      name="reg-job"
                      label="Cargo"
                      value={values.jobTitle}
                      error={errors.jobTitle}
                      onChange={(value) => set({ jobTitle: value })}
                    />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Select
                        name="reg-department"
                        label="Departamento"
                        value={values.departmentId}
                        options={departmentOptions}
                        error={errors.departmentId}
                        onChange={(value) => set({ departmentId: value })}
                      />
                      <Select
                        name="reg-contract"
                        label="Tipo de contrato"
                        value={values.contractType}
                        options={[
                          { value: 'indefinido', label: 'Indefinido' },
                          { value: 'temporal', label: 'Temporal' },
                          { value: 'practicas', label: 'Prácticas' },
                          { value: 'becario', label: 'Becario' },
                        ]}
                        onChange={(value) => set({ contractType: value as ContractType })}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Input
                        name="reg-hire"
                        label="Fecha de alta"
                        type="date"
                        value={values.hireDate}
                        error={errors.hireDate}
                        onChange={(value) => set({ hireDate: value })}
                      />
                      <Input
                        name="reg-salary"
                        label="Salario base anual"
                        type="number"
                        value={values.baseSalary}
                        error={errors.baseSalary}
                        onChange={(value) => set({ baseSalary: value })}
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <Input
                      name="reg-password"
                      label="Contraseña temporal"
                      type="password"
                      value={values.password}
                      error={errors.password}
                      onChange={(value) => set({ password: value })}
                    />
                    <Select
                      name="reg-role"
                      label="Rol"
                      value={values.role}
                      options={[
                        { value: 'user', label: 'Usuario' },
                        { value: 'superuser', label: 'Superusuario' },
                      ]}
                      error={errors.role}
                      onChange={(value) => set({ role: value as UserRole })}
                    />
                  </>
                )}

                {step === 3 && (
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-xl border border-border bg-surface-soft/70 p-5 sm:grid-cols-2">
                    {[
                      ['Nombre', values.name],
                      ['Correo', values.email],
                      ['Teléfono', values.phone],
                      ['Cargo', values.jobTitle],
                      ['Departamento', departmentName(values.departmentId)],
                      ['Contrato', CONTRACT_TYPE_LABEL[values.contractType]],
                      ['Alta', values.hireDate],
                      ['Salario base', values.baseSalary ? `${values.baseSalary} €` : '—'],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</dt>
                        <dd className="mt-1 truncate text-sm text-text">{value || '—'}</dd>
                      </div>
                    ))}
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">Rol</dt>
                      <dd className="mt-1.5">
                        <Badge tone={values.role === 'superuser' ? 'warning' : 'neutral'}>
                          {ROLE_LABEL[values.role]}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                )}
              </motion.div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="h-11 rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-50"
                >
                  Anterior
                </button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={next}>Siguiente</Button>
                ) : (
                  <Button state={busy ? 'loading' : 'idle'} onClick={() => void submit()}>
                    Registrar persona
                  </Button>
                )}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
