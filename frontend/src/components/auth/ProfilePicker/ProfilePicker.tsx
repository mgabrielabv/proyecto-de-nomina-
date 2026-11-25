import { motion, useReducedMotion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import { useState } from 'react';
import { fadeUpItem, staggerContainer } from '../../../animations/variants';
import { useSessionStore } from '../../../store';
import type { ProfileRef } from '../../../types';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';

export interface ProfilePickerProps {
  profiles: ProfileRef[];
  onSelect: (profile: ProfileRef) => void;
}

// Paso posterior al login para usuarios con más de un perfil: se elige con cuál
// entrar. No filtra información (solo muestra los perfiles del propio usuario
// autenticado) y es puramente frontend: el backend autoriza con todos.
export function ProfilePicker({ profiles, onSelect }: ProfilePickerProps) {
  const reduce = useReducedMotion();
  const setActiveProfile = useSessionStore((state) => state.setActiveProfile);
  const [selectedId, setSelectedId] = useState(String(profiles[0]?.id ?? ''));

  const selected = profiles.find((profile) => String(profile.id) === selectedId) ?? profiles[0];

  const handleSubmit = () => {
    if (!selected) return;
    setActiveProfile(selected);
    onSelect(selected);
  };

  return (
    <motion.form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      variants={staggerContainer(0.06, reduce ? 0 : 0.08)}
      initial={reduce ? false : 'hidden'}
      animate="show"
      className="space-y-5"
    >
      <motion.div variants={fadeUpItem} className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-[28px]">Elige tu perfil</h1>
        <p className="text-sm text-text-secondary">Tu cuenta tiene varios perfiles. ¿Con cuál quieres entrar?</p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="relative z-20 space-y-4">
        <Select
          name="active-profile"
          label="Perfil"
          value={selectedId}
          onChange={setSelectedId}
          options={profiles.map((profile) => ({
            value: String(profile.id),
            label: profile.nombre,
          }))}
        />

        {selected && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-soft px-4 py-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-surface">
              <UserRound className="h-5 w-5 text-text-secondary" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{selected.nombre}</p>
              <p className="truncate text-xs text-text-muted">
                Entrarás como {selected.nombre}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <Button type="submit" size="lg" fullWidth>
          Continuar
        </Button>
      </motion.div>

      <motion.p variants={fadeUpItem} className="text-center text-xs leading-relaxed text-text-muted">
        Podrás cambiar de perfil más tarde desde tu espacio.
      </motion.p>
    </motion.form>
  );
}
