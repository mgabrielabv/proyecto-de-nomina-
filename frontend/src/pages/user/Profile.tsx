import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { useOrgStore, useSessionStore, useToastStore } from '../../store';
import { updateProfile } from '../../features/profile/services';
import { useMockLoad } from '../../hooks';
import { SkeletonForm } from '../../components/ui/Skeleton';
import { CONTRACT_TYPE_LABEL, ROLE_LABEL, TOAST_MESSAGES } from '../../constants';
import type { ContractType } from '../../types';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
}

export function UserProfile() {
  const user = useSessionStore((state) => state.user);
  const push = useToastStore((state) => state.push);
  const { departments, load: loadDepartments } = useOrgStore();
  const loading = useMockLoad();
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<ProfileForm>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '+34 622 908 741',
    jobTitle: user?.jobTitle ?? '',
  });

  useEffect(() => {
    void loadDepartments();
  }, [loadDepartments]);

  const departmentName = useMemo(
    () => departments.find((item) => item.id === user?.departmentId)?.name ?? '—',
    [departments, user?.departmentId],
  );

  if (!user) return null;

  const handleSave = async () => {
    setBusy(true);
    try {
      await updateProfile(user.id, {
        name: state.name.trim(),
        email: state.email.trim(),
        phone: state.phone.trim(),
        jobTitle: state.jobTitle.trim(),
      });
      setEdit(false);
      push(TOAST_MESSAGES.profileSaved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi perfil"
        description="Datos personales, cargo y departamento."
        actions={
          edit ? (
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setEdit(false)}
                disabled={busy}
                className="h-11 rounded-button border border-border bg-surface-soft px-5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:border-border-strong hover:text-text disabled:cursor-default disabled:opacity-60"
              >
                Cancelar
              </button>
              <Button state={busy ? 'loading' : 'idle'} onClick={() => void handleSave()}>
                Guardar
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEdit(true)}>Editar</Button>
          )
        }
      />

      {loading ? (
        <SkeletonForm fields={5} />
      ) : (
        <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div variants={fadeUpItem} className="lg:col-span-1">
            <Card className="flex flex-col items-center text-center">
              <Avatar name={user.name} size="xl" />
              <h2 className="mt-5 text-lg font-semibold tracking-tight text-text">{user.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">{user.jobTitle}</p>
              <p className="mt-0.5 text-xs text-text-muted">{user.email}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge tone={user.role === 'superuser' ? 'warning' : 'neutral'}>{ROLE_LABEL[user.role]}</Badge>
                <Badge tone="neutral">{departmentName}</Badge>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUpItem} className="lg:col-span-2">
            <Card className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Input
                name="profile-name"
                label="Nombre completo"
                value={state.name}
                disabled={!edit}
                onChange={(value) => setState((current) => ({ ...current, name: value }))}
              />
              <Input
                name="profile-email"
                label="Correo electrónico"
                type="email"
                value={state.email}
                disabled={!edit}
                onChange={(value) => setState((current) => ({ ...current, email: value }))}
              />
              <Input
                name="profile-job"
                label="Cargo"
                value={state.jobTitle}
                disabled={!edit}
                onChange={(value) => setState((current) => ({ ...current, jobTitle: value }))}
              />
              <Input
                name="profile-phone"
                label="Teléfono"
                value={state.phone}
                disabled={!edit}
                onChange={(value) => setState((current) => ({ ...current, phone: value }))}
              />
              <Input name="profile-department" label="Departamento" value={departmentName} disabled onChange={() => undefined} />
              <div className="flex flex-col justify-center gap-1 rounded-input border border-border bg-surface-soft px-4 py-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">Contrato</span>
                <span className="text-sm text-text">{CONTRACT_TYPE_LABEL['indefinido' as ContractType]}</span>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
