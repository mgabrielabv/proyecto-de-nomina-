import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Button } from '../../components/ui/Button';
import { useSessionStore, useToastStore } from '../../store';
import { listProfiles, type SystemProfile } from '../../features/auth/services';
import {
  listCargos,
  registerPerson,
  type Cargo,
  type MaritalStatus,
  type PaymentFrequency,
  type PaymentType,
  type RegistrationPayload,
  type Sex,
} from '../../features/registration/services';
import { FORM_MESSAGES } from '../../constants';

const STEPS = [
  { label: 'Datos personales', description: 'Identificación y contacto' },
  { label: 'Cuenta de usuario', description: 'Credenciales y perfiles' },
  { label: 'Datos laborales', description: 'Cargo y contrato' },
  { label: 'Confirmación', description: 'Revisión final' },
];

const PROFILE_MANAGER_NAMES = ['Superusuario', 'RRHH'];
const PRIVILEGED_PROFILE_NAMES = ['Superusuario', 'Administrador', 'RRHH'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SEX_LABEL: Record<Sex, string> = { M: 'Hombre', F: 'Mujer' };

const MARITAL_STATUS_LABEL: Record<MaritalStatus, string> = {
  SOLTERO: 'Soltero/a',
  CASADO: 'Casado/a',
  DIVORCIADO: 'Divorciado/a',
  VIUDO: 'Viudo/a',
  CONCUBINO: 'Concubino/a',
};

const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  POR_HORA: 'Por hora',
  SALARIO_FIJO: 'Salario fijo',
};

const PAYMENT_FREQUENCY_LABEL: Record<PaymentFrequency, string> = {
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  MENSUAL: 'Mensual',
};

interface FormValues {
  cedula: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  fecha_nacimiento: string;
  sexo: '' | Sex;
  estado_civil: '' | MaritalStatus;
  nro_tlf: string;
  email: string;
  direccion: string;
  username: string;
  password: string;
  confirmPassword: string;
  cargoId: string;
  fechaInicio: string;
  tipoPago: '' | PaymentType;
  frecuenciaPago: '' | PaymentFrequency;
  monto: string;
  horasSemanales: string;
  fechaFin: string;
  motivo: string;
}

const INITIAL_VALUES: FormValues = {
  cedula: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  fecha_nacimiento: '',
  sexo: '',
  estado_civil: '',
  nro_tlf: '',
  email: '',
  direccion: '',
  username: '',
  password: '',
  confirmPassword: '',
  cargoId: '',
  fechaInicio: '',
  tipoPago: '',
  frecuenciaPago: '',
  monto: '',
  horasSemanales: '',
  fechaFin: '',
  motivo: '',
};

const PERSONAL_KEYS = ['cedula', 'primer_nombre', 'primer_apellido', 'email'];
const ACCOUNT_KEYS = ['username', 'password', 'confirmPassword', 'profiles'];

const optionalText = (value: string) => value.trim() || undefined;

const positiveNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

export function AdminRegistration() {
  const push = useToastStore((state) => state.push);
  const user = useSessionStore((state) => state.user);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [profiles, setProfiles] = useState<SystemProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<number[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [cargosLoading, setCargosLoading] = useState(true);
  const [includeLaboral, setIncludeLaboral] = useState(true);

  const canListProfiles = useMemo(() => {
    if (!user) return false;
    if (PROFILE_MANAGER_NAMES.includes(user.activeProfile.nombre)) return true;
    return user.profiles.some((profile) => PROFILE_MANAGER_NAMES.includes(profile.nombre));
  }, [user]);

  const canAssignPrivilegedProfiles = user?.activeProfile.nombre === 'Superusuario';

  useEffect(() => {
    if (!canListProfiles) {
      setProfilesLoading(false);
      setCargosLoading(false);
      setProfiles([]);
      setSelectedProfiles([]);
      setCargos([]);
      push('La sesión actual no tiene autorización para registrar usuarios.', 'error');
      return;
    }

    let active = true;
    void listProfiles()
      .then((list) => {
        if (!active) return;
        const assignable = canAssignPrivilegedProfiles
          ? list
          : list.filter((profile) => !PRIVILEGED_PROFILE_NAMES.includes(profile.nombre));
        setProfiles(assignable);
        const empleado = assignable.find((profile) => profile.nombre === 'Empleado');
        setSelectedProfiles(empleado ? [empleado.id] : []);
      })
      .catch((error: unknown) => {
        if (active) push(error instanceof Error ? error.message : 'No se pudieron cargar los perfiles.', 'error');
      })
      .finally(() => {
        if (active) setProfilesLoading(false);
      });

    void listCargos()
      .then((list) => {
        if (active) setCargos(list);
      })
      .catch((error: unknown) => {
        if (active) push(error instanceof Error ? error.message : 'No se pudieron cargar los cargos.', 'error');
      })
      .finally(() => {
        if (active) setCargosLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canAssignPrivilegedProfiles, canListProfiles, push]);

  const set = (patch: Partial<FormValues>) => setValues((current) => ({ ...current, ...patch }));

  const validate = (targetStep: number) => {
    const next: Record<string, string> = {};
    if (targetStep === 0) {
      if (!values.cedula.trim()) next.cedula = FORM_MESSAGES.required;
      if (!values.primer_nombre.trim()) next.primer_nombre = FORM_MESSAGES.required;
      if (!values.primer_apellido.trim()) next.primer_apellido = FORM_MESSAGES.required;
      if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) next.email = FORM_MESSAGES.invalidEmail;
    }
    if (targetStep === 1) {
      if (!values.username.trim()) next.username = FORM_MESSAGES.required;
      if (values.password.length < 8) {
        next.password = FORM_MESSAGES.shortPassword;
      } else if (!/[A-Za-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
        next.password = 'La contraseña debe incluir al menos una letra y un número.';
      }
      if (values.confirmPassword !== values.password) next.confirmPassword = FORM_MESSAGES.passwordMismatch;
      if (!selectedProfiles.length) next.profiles = 'Selecciona al menos un perfil.';
    }
    if (targetStep === 2 && includeLaboral) {
      if (!values.cargoId) next.cargoId = FORM_MESSAGES.required;
      if (!values.fechaInicio) next.fechaInicio = FORM_MESSAGES.required;
      if (!values.tipoPago) next.tipoPago = FORM_MESSAGES.required;
      if (!values.frecuenciaPago) next.frecuenciaPago = FORM_MESSAGES.required;
      if (!positiveNumber(values.monto)) next.monto = 'Ingresa un monto mayor que cero.';
      if (values.tipoPago === 'POR_HORA' && !positiveNumber(values.horasSemanales)) {
        next.horasSemanales = 'Ingresa las horas semanales (mayor que cero).';
      }
      if (values.fechaFin && values.fechaInicio && values.fechaFin < values.fechaInicio) {
        next.fechaFin = 'La fecha de fin no puede ser anterior al inicio.';
      }
    }
    return next;
  };

  const next = () => {
    const nextErrors = validate(step);
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const buildPayload = (): RegistrationPayload => ({
    cedula: values.cedula.trim(),
    primer_nombre: values.primer_nombre.trim(),
    primer_apellido: values.primer_apellido.trim(),
    username: values.username.trim(),
    password: values.password,
    perfiles: selectedProfiles.filter((id) => profiles.some((profile) => profile.id === id)),
    segundo_nombre: optionalText(values.segundo_nombre),
    segundo_apellido: optionalText(values.segundo_apellido),
    fecha_nacimiento: optionalText(values.fecha_nacimiento),
    sexo: values.sexo || undefined,
    estado_civil: values.estado_civil || undefined,
    nro_tlf: optionalText(values.nro_tlf),
    email: optionalText(values.email),
    direccion: optionalText(values.direccion),
    laboral:
      includeLaboral && values.cargoId && values.fechaInicio && values.tipoPago && values.frecuenciaPago
        ? {
            cargo_id: Number(values.cargoId),
            fecha_inicio: values.fechaInicio,
            tipo_pago: values.tipoPago,
            frecuencia_pago: values.frecuenciaPago,
            monto: Number(values.monto),
            horas_semanales:
              values.tipoPago === 'POR_HORA' ? positiveNumber(values.horasSemanales) : undefined,
            fecha_fin: optionalText(values.fechaFin),
            motivo: optionalText(values.motivo),
          }
        : undefined,
  });

  const submit = async () => {
    const nextErrors = [0, 1, 2].reduce<Record<string, string>>(
      (all, currentStep) => ({ ...all, ...validate(currentStep) }),
      {},
    );
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const keys = Object.keys(nextErrors);
      setStep(keys.some((key) => PERSONAL_KEYS.includes(key)) ? 0 : keys.some((key) => ACCOUNT_KEYS.includes(key)) ? 1 : 2);
      return;
    }
    setBusy(true);
    const result = await registerPerson(buildPayload());
    setBusy(false);
    if (!result.ok) {
      push(result.error ?? 'No se pudo registrar la persona.', 'error');
      return;
    }
    setDone(true);
    push('Persona registrada correctamente.', 'success');
  };

  const reset = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setStep(0);
    setDone(false);
    setIncludeLaboral(true);
    const empleado = profiles.find((profile) => profile.nombre === 'Empleado');
    setSelectedProfiles(empleado ? [empleado.id] : []);
  };

  const profileNames = profiles
    .filter((profile) => selectedProfiles.includes(profile.id))
    .map((profile) => profile.nombre)
    .join(', ');

  const selectedCargo = cargos.find((cargo) => String(cargo.id) === values.cargoId);

  const summaryRows = [
    ['Cédula', values.cedula],
    ['Nombres', [values.primer_nombre, values.segundo_nombre].filter(Boolean).join(' ')],
    ['Apellidos', [values.primer_apellido, values.segundo_apellido].filter(Boolean).join(' ')],
    ['Fecha de nacimiento', values.fecha_nacimiento],
    ['Sexo', values.sexo ? SEX_LABEL[values.sexo] : ''],
    ['Estado civil', values.estado_civil ? MARITAL_STATUS_LABEL[values.estado_civil] : ''],
    ['Teléfono', values.nro_tlf],
    ['Correo', values.email],
    ['Dirección', values.direccion],
    ['Usuario', values.username],
    ['Perfiles', profileNames],
    ...(includeLaboral
      ? [
          ['Cargo', selectedCargo?.nombre ?? ''],
          ['Inicio del contrato', values.fechaInicio],
          ['Fin del contrato', values.fechaFin],
          ['Tipo de pago', values.tipoPago ? PAYMENT_TYPE_LABEL[values.tipoPago] : ''],
          ['Frecuencia de pago', values.frecuenciaPago ? PAYMENT_FREQUENCY_LABEL[values.frecuenciaPago] : ''],
          ['Monto', values.monto ? `$${Number(values.monto).toFixed(2)}` : ''],
          ['Horas semanales', values.tipoPago === 'POR_HORA' ? values.horasSemanales : ''],
          ['Motivo', values.motivo],
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Registrar personas" description="Crea la persona, su cuenta de acceso, asigna sus perfiles y registra su contrato." />
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
                  {values.primer_nombre} {values.primer_apellido} ya forma parte de la organización.
                </p>
              </div>
              <Button onClick={reset}>Registrar otra persona</Button>
            </motion.div>
          ) : (
            <>
              <Stepper steps={STEPS} current={step} onSelect={setStep} />
              <motion.div key={step} variants={fadeUpItem} initial="hidden" animate="show" className="space-y-5">
                {step === 0 && (
                  <>
                    <div>
                      <h2 className="text-base font-semibold text-text">Datos personales</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Identificación de la persona. Solo cédula y nombres son obligatorios.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <Input name="cedula" label="Cédula" value={values.cedula} error={errors.cedula} onChange={(value) => set({ cedula: value })} />
                      <Input name="primer-nombre" label="Primer nombre" value={values.primer_nombre} error={errors.primer_nombre} onChange={(value) => set({ primer_nombre: value })} />
                      <Input name="segundo-nombre" label="Segundo nombre" value={values.segundo_nombre} onChange={(value) => set({ segundo_nombre: value })} />
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Input name="primer-apellido" label="Primer apellido" value={values.primer_apellido} error={errors.primer_apellido} onChange={(value) => set({ primer_apellido: value })} />
                      <Input name="segundo-apellido" label="Segundo apellido" value={values.segundo_apellido} onChange={(value) => set({ segundo_apellido: value })} />
                      <Input name="birth-date" label="Fecha de nacimiento" type="date" value={values.fecha_nacimiento} onChange={(value) => set({ fecha_nacimiento: value })} />
                      <Select
                        name="sex"
                        label="Sexo"
                        value={values.sexo}
                        options={[
                          { value: 'M', label: SEX_LABEL.M },
                          { value: 'F', label: SEX_LABEL.F },
                        ]}
                        onChange={(value) => set({ sexo: value as FormValues['sexo'] })}
                      />
                      <Select
                        name="marital-status"
                        label="Estado civil"
                        value={values.estado_civil}
                        options={(Object.keys(MARITAL_STATUS_LABEL) as MaritalStatus[]).map((value) => ({
                          value,
                          label: MARITAL_STATUS_LABEL[value],
                        }))}
                        onChange={(value) => set({ estado_civil: value as FormValues['estado_civil'] })}
                      />
                      <Input name="phone" label="Teléfono" value={values.nro_tlf} onChange={(value) => set({ nro_tlf: value })} />
                      <Input name="email" label="Correo electrónico" type="email" value={values.email} error={errors.email} onChange={(value) => set({ email: value })} />
                    </div>
                    <Input name="address" label="Dirección" value={values.direccion} onChange={(value) => set({ direccion: value })} />
                  </>
                )}

                {step === 1 && (
                  <>
                    <div>
                      <h2 className="text-base font-semibold text-text">Cuenta de usuario</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Credenciales de acceso y perfiles autorizados.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                      <Input name="username" label="Nombre de usuario" value={values.username} error={errors.username} onChange={(value) => set({ username: value })} />
                      <Input name="password" label="Contraseña" type="password" value={values.password} error={errors.password} onChange={(value) => set({ password: value })} />
                      <Input name="confirm-password" label="Confirmar contraseña" type="password" value={values.confirmPassword} error={errors.confirmPassword} onChange={(value) => set({ confirmPassword: value })} />
                    </div>
                    <fieldset className="space-y-3">
                      <legend className="text-sm font-semibold text-text">Perfiles</legend>
                      {profilesLoading && <p className="text-xs text-text-muted">Cargando perfiles...</p>}
                      {!profilesLoading && profiles.length === 0 && (
                        <p className="text-xs text-text-muted">No hay perfiles disponibles.</p>
                      )}
                      {!profilesLoading && !canAssignPrivilegedProfiles && profiles.length > 0 && (
                        <p className="text-xs text-text-muted">
                          Solo un Superusuario puede asignar perfiles administrativos.
                        </p>
                      )}
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {profiles.map((profile) => (
                          <label key={profile.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={selectedProfiles.includes(profile.id)}
                              onChange={() =>
                                setSelectedProfiles((current) =>
                                  current.includes(profile.id)
                                    ? current.filter((id) => id !== profile.id)
                                    : [...current, profile.id],
                                )
                              }
                            />
                            <span>
                              <span className="font-medium text-text">{profile.nombre}</span>
                              {profile.descripcion && (
                                <span className="block text-xs text-text-muted">{profile.descripcion}</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.profiles && <p className="text-xs text-error">{errors.profiles}</p>}
                    </fieldset>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <h2 className="text-base font-semibold text-text">Datos laborales</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        Cargo y condiciones del contrato. Puedes registrar a la persona sin contrato por ahora.
                      </p>
                    </div>
                    <Checkbox
                      name="include-laboral"
                      label="Registrar contrato laboral ahora"
                      checked={includeLaboral}
                      onChange={(checked) => {
                        setIncludeLaboral(checked);
                        if (!checked) {
                          setErrors((current) => {
                            const nextErrors = { ...current };
                            ['cargoId', 'fechaInicio', 'tipoPago', 'frecuenciaPago', 'monto', 'horasSemanales', 'fechaFin'].forEach(
                              (key) => delete nextErrors[key],
                            );
                            return nextErrors;
                          });
                        }
                      }}
                    />
                    {includeLaboral && (
                      <>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                          <Select
                            name="cargo"
                            label="Cargo"
                            value={values.cargoId}
                            options={cargos.map((cargo) => ({ value: String(cargo.id), label: cargo.nombre }))}
                            disabled={cargosLoading}
                            placeholder={cargosLoading ? 'Cargando cargos...' : 'Selecciona un cargo'}
                            error={errors.cargoId}
                            onChange={(value) => set({ cargoId: value })}
                          />
                          <Input name="fecha-inicio" label="Fecha de inicio" type="date" value={values.fechaInicio} error={errors.fechaInicio} onChange={(value) => set({ fechaInicio: value })} />
                          <Select
                            name="tipo-pago"
                            label="Tipo de pago"
                            value={values.tipoPago}
                            options={(Object.keys(PAYMENT_TYPE_LABEL) as PaymentType[]).map((value) => ({
                              value,
                              label: PAYMENT_TYPE_LABEL[value],
                            }))}
                            error={errors.tipoPago}
                            onChange={(value) => set({ tipoPago: value as FormValues['tipoPago'] })}
                          />
                          <Select
                            name="frecuencia-pago"
                            label="Frecuencia de pago"
                            value={values.frecuenciaPago}
                            options={(Object.keys(PAYMENT_FREQUENCY_LABEL) as PaymentFrequency[]).map((value) => ({
                              value,
                              label: PAYMENT_FREQUENCY_LABEL[value],
                            }))}
                            error={errors.frecuenciaPago}
                            onChange={(value) => set({ frecuenciaPago: value as FormValues['frecuenciaPago'] })}
                          />
                          <Input name="monto" label="Monto" type="number" min="0" step="0.01" value={values.monto} error={errors.monto} onChange={(value) => set({ monto: value })} />
                          {values.tipoPago === 'POR_HORA' && (
                            <Input name="horas-semanales" label="Horas semanales" type="number" min="0" step="0.5" value={values.horasSemanales} error={errors.horasSemanales} onChange={(value) => set({ horasSemanales: value })} />
                          )}
                          <Input name="fecha-fin" label="Fecha de fin (opcional)" type="date" value={values.fechaFin} error={errors.fechaFin} onChange={(value) => set({ fechaFin: value })} />
                          <Input name="motivo" label="Motivo del salario (opcional)" value={values.motivo} onChange={(value) => set({ motivo: value })} />
                        </div>
                        {!cargosLoading && cargos.length === 0 && (
                          <p className="text-xs text-text-muted">No hay cargos activos disponibles.</p>
                        )}
                      </>
                    )}
                  </>
                )}

                {step === 3 && (
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-xl border border-border bg-surface-soft/70 p-5 sm:grid-cols-2">
                    {summaryRows.map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</dt>
                        <dd className="mt-1 truncate text-sm text-text">{value || '—'}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </motion.div>

              <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setErrors({});
                    setStep((current) => Math.max(current - 1, 0));
                  }}
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
