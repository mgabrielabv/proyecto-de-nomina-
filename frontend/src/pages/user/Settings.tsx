import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { staggerContainer, fadeUpItem } from '../../animations/variants';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../hooks';
import { useToastStore } from '../../store';
import {
  changePassword,
  readPreferences,
  savePreferences,
  type AppPreferences,
} from '../../features/settings/services';
import { FORM_MESSAGES, TOAST_MESSAGES } from '../../constants';

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const EMPTY_PASSWORD: PasswordForm = { current: '', next: '', confirm: '' };

export function UserSettings() {
  const push = useToastStore((state) => state.push);
  const { theme } = useTheme();

  const [preferences, setPreferences] = useState<AppPreferences>(() => readPreferences());
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [password, setPassword] = useState<PasswordForm>(EMPTY_PASSWORD);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const update = (patch: Partial<AppPreferences>) =>
    setPreferences((current) => ({ ...current, ...patch }));

  const savePrefs = async () => {
    setSavingPrefs(true);
    try {
      await savePreferences(preferences);
      push(TOAST_MESSAGES.settingsSaved);
    } finally {
      setSavingPrefs(false);
    }
  };

  const submitPassword = async () => {
    const errors: Record<string, string> = {};
    if (!password.current) errors.current = FORM_MESSAGES.required;
    if (password.next.length < 8) errors.next = FORM_MESSAGES.shortPassword;
    if (password.next !== password.confirm) errors.confirm = FORM_MESSAGES.passwordMismatch;
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setSavingPassword(true);
    try {
      const result = await changePassword(password.current, password.next);
      if (!result.ok) {
        setPasswordErrors({ current: result.error ?? 'No se pudo cambiar la contraseña.' });
        push(result.error ?? 'No se pudo cambiar la contraseña.', 'error');
        return;
      }
      setPassword(EMPTY_PASSWORD);
      setPasswordErrors({});
      push(TOAST_MESSAGES.passwordChanged);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Tema, idioma, cambio de contraseña y preferencias." />

      <motion.div variants={staggerContainer(0.05)} initial="hidden" animate="show" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUpItem}>
          <Card className="space-y-6">
            <header>
              <h3 className="text-sm font-semibold tracking-tight text-text">Apariencia</h3>
              <p className="mt-1 text-xs text-text-muted">Personaliza cómo se ve la plataforma.</p>
            </header>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text">Tema</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {theme === 'dark' ? 'Modo oscuro activo' : 'Modo claro activo'}
                </p>
              </div>
              <ThemeToggle />
            </div>

            <Select
              name="settings-language"
              label="Idioma"
              value={preferences.language}
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'English' },
                { value: 'pt', label: 'Português' },
              ]}
              onChange={(value) => update({ language: value })}
            />
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem}>
          <Card className="space-y-6">
            <header>
              <h3 className="text-sm font-semibold tracking-tight text-text">Notificaciones</h3>
              <p className="mt-1 text-xs text-text-muted">Elige qué avisos quieres recibir.</p>
            </header>

            <div className="space-y-4">
              <Checkbox
                name="pref-email"
                label="Notificaciones por correo"
                checked={preferences.emailNotifications}
                onChange={(checked) => update({ emailNotifications: checked })}
              />
              <Checkbox
                name="pref-desktop"
                label="Notificaciones de escritorio"
                checked={preferences.desktopNotifications}
                onChange={(checked) => update({ desktopNotifications: checked })}
              />
              <Checkbox
                name="pref-digest"
                label="Resumen semanal"
                checked={preferences.weeklyDigest}
                onChange={(checked) => update({ weeklyDigest: checked })}
              />
            </div>

            <Button state={savingPrefs ? 'loading' : 'idle'} onClick={() => void savePrefs()}>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" aria-hidden />
                Guardar preferencias
              </span>
            </Button>
          </Card>
        </motion.div>

        <motion.div variants={fadeUpItem} className="lg:col-span-2">
          <Card className="space-y-6">
            <header>
              <h3 className="text-sm font-semibold tracking-tight text-text">Cambiar contraseña</h3>
              <p className="mt-1 text-xs text-text-muted">Usa al menos 8 caracteres.</p>
            </header>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Input
                name="pwd-current"
                label="Contraseña actual"
                type="password"
                value={password.current}
                error={passwordErrors.current}
                onChange={(value) => setPassword((current) => ({ ...current, current: value }))}
              />
              <Input
                name="pwd-next"
                label="Nueva contraseña"
                type="password"
                value={password.next}
                error={passwordErrors.next}
                onChange={(value) => setPassword((current) => ({ ...current, next: value }))}
              />
              <Input
                name="pwd-confirm"
                label="Confirmar contraseña"
                type="password"
                value={password.confirm}
                error={passwordErrors.confirm}
                onChange={(value) => setPassword((current) => ({ ...current, confirm: value }))}
              />
            </div>

            <Button state={savingPassword ? 'loading' : 'idle'} onClick={() => void submitPassword()}>
              Actualizar contraseña
            </Button>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
