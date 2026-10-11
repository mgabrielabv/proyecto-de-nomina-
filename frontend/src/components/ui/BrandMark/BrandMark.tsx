import { Command } from 'lucide-react';
import { AUTH_BRAND_NAME } from '../../../constants';
import { cn } from '../../../utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent text-accent-text shadow-sm">
        <Command className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-text">{AUTH_BRAND_NAME}</span>
    </div>
  );
}