export function Skeleton({ className = "h-4 w-full rounded-lg" }) {
  return (
    <div
      className={`animate-pulse bg-[var(--surface-hover)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3.5 w-2/3 rounded-md" />
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default Skeleton;
