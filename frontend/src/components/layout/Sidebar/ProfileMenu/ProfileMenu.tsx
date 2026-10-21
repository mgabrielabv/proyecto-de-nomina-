import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronRight, LogOut, Settings } from 'lucide-react';
import { menuVariants } from '../../../../animations/variants';
import { useClickOutside } from '../../../../hooks';
import { useSessionStore } from '../../../../store';
import type { ProfileRef, SessionUser } from '../../../../types';
import { cn, getRoleHomePath, profileToRole } from '../../../../utils';
import { Avatar } from '../../../ui/Avatar';

export interface ProfileMenuProps {
  user: SessionUser;
  collapsed: boolean;
}

// Footer modular del sidebar: reúne la identidad del usuario, el cambio de
// perfil (solo si tiene varios) y las acciones de cuenta en un único menú.
// Cambiar de perfil recalcula el rol y navega a la home de ese rol.
export function ProfileMenu({ user, collapsed }: ProfileMenuProps) {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const setActiveProfile = useSessionStore((state) => state.setActiveProfile);
  const clearSession = useSessionStore((state) => state.clearSession);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false), open);

  const canSwitch = user.profiles.length > 1;

  const handleSwitchProfile = (profile: ProfileRef) => {
    setActiveProfile(profile);
    setOpen(false);
    navigate(getRoleHomePath(profileToRole(profile.nombre)), { replace: true });
  };

  const handleSignOut = () => {
    setOpen(false);
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={menuRef} className="relative border-t border-border p-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={collapsed ? `${user.name} · ${user.activeProfile.nombre}` : undefined}
        className={cn(
          'flex w-full items-center rounded-xl border border-transparent px-2.5 py-2.5 text-left transition-colors duration-200 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          collapsed && 'justify-center px-0',
          open && 'bg-surface-soft',
        )}
      >
        <Avatar name={user.name} size="sm" />
        <div
          aria-hidden={collapsed || undefined}
          className={cn(
            'min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-[max-width,opacity,margin] duration-300 ease-sidebar',
            collapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-3 max-w-[12rem] opacity-100',
          )}
        >
          <p className="truncate text-sm font-semibold text-text">{user.name}</p>
          <p className="truncate text-xs text-text-muted">{user.activeProfile.nombre}</p>
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 shrink-0 overflow-hidden text-text-muted transition-[transform,opacity,max-width] duration-300 ease-sidebar',
            open && 'rotate-90',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[1rem] opacity-100',
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            variants={menuVariants}
            initial={reduce ? false : 'hidden'}
            animate="show"
            exit={reduce ? undefined : 'exit'}
            className={cn(
              'absolute bottom-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-card',
              collapsed ? 'left-3 w-56' : 'left-3 right-3',
            )}
          >
            {canSwitch && (
              <>
                <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Cambiar de perfil
                </p>
                <ul className="space-y-0.5">
                  {user.profiles.map((profile) => {
                    const active = profile.id === user.activeProfile.id;
                    return (
                      <li key={profile.id}>
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => handleSwitchProfile(profile)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors duration-150 hover:bg-surface-soft',
                            active ? 'font-medium text-text' : 'text-text-secondary hover:text-text',
                          )}
                        >
                          <span className="truncate">{profile.nombre}</span>
                          {active && <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="my-1.5 h-px bg-border" />
              </>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate(getRoleHomePath(user.role));
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-secondary transition-colors duration-150 hover:bg-surface-soft hover:text-text"
            >
              <Settings className="h-4 w-4" aria-hidden />
              Mi espacio
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-error transition-colors duration-150 hover:bg-error-soft"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
