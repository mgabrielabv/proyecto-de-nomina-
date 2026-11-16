import type { ReactNode } from 'react';
import { cn } from '../../../utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <svg
        viewBox="0 0 120 80"
        className="mb-4 h-16 w-24 text-text-muted/60"
        fill="none"
        aria-hidden
      >
        <rect x="18" y="14" width="84" height="52" rx="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M34 34h28M34 44h52M34 54h40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="88" cy="58" r="14" fill="var(--color-surface)" stroke="currentColor" strokeWidth="1.5" />
        <path d="M83 58h10M88 53v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-medium text-text">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
