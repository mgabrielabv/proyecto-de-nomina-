import { Command } from 'lucide-react';
import { AUTH_BRAND_NAME } from '../../../constants';
import { cn } from '../../../utils';

export function BrandMark({ className, collapsed = false }: { className?: string; collapsed?: boolean }) {
  return (
    <div className={cn('flex items-center', className)} aria-label={AUTH_BRAND_NAME}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-accent text-accent-text shadow-sm">
        <Command className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <span
        aria-hidden={collapsed || undefined}
        className={cn(
          'overflow-hidden whitespace-nowrap text-[15px] font-semibold tracking-tight text-text transition-[max-width,opacity,margin] duration-300 ease-sidebar',
          collapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-2.5 max-w-[8rem] opacity-100',
        )}
      >
        {AUTH_BRAND_NAME}
      </span>
    </div>
  );
}