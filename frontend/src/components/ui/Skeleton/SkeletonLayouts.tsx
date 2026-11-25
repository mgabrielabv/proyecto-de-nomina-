import { Card } from '../Card';
import { Skeleton, SkeletonGroup } from './Skeleton';

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <SkeletonGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3.5 w-32" />
        </Card>
      ))}
    </SkeletonGroup>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <div className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </Card>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="space-y-4">
      <Skeleton className="h-5 w-36" />
      <SkeletonGroup className="space-y-3.5">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3.5">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </SkeletonGroup>
    </Card>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-4 border-b border-border px-5 py-4">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3.5 flex-1" />
        ))}
      </div>
      <SkeletonGroup className="divide-y divide-border">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-5 py-4">
            {Array.from({ length: columns }, (_, inner) => (
              <Skeleton key={inner} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </SkeletonGroup>
    </Card>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <Card className="space-y-5">
      <Skeleton className="h-5 w-44" />
      <SkeletonGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-input" />
        ))}
      </SkeletonGroup>
    </Card>
  );
}
