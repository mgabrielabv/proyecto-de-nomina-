import { motion } from 'framer-motion';
import { cn, getInitials } from '../../../utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
  muted?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export function Avatar({ name, size = 'md', className, muted = false }: AvatarProps) {
  return (
    <motion.span
      whileHover={{ scale: 1.04 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full border border-border bg-surface-soft font-semibold tracking-tight text-text-secondary',
        sizeClasses[size],
        className,
      )}
    >
      {muted ? '·' : getInitials(name)}
    </motion.span>
  );
}
