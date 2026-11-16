function Skeleton({ className = "", ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-[var(--cv-surface-2)] ${className}`}
      {...props}
    />
  )
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  )
}

export function SkeletonCards({ count = 4, className = "" }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-5"
        >
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--cv-border)] ${className}`} aria-hidden="true">
      <div className="flex gap-4 border-b border-[var(--cv-border)] bg-black/[0.02] p-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 border-b border-[var(--cv-border)] p-4 last:border-b-0">
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <Skeleton key={columnIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ count = 5, className = "" }) {
  return (
    <ul className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex items-center gap-4 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="mt-2 h-3 w-4/5" />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SkeletonProfile({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      </div>
      <SkeletonText className="mt-6" lines={4} />
    </div>
  )
}

export function SkeletonPage({ cards = 4, table = false, className = "" }) {
  return (
    <div className={`space-y-6 ${className}`} aria-hidden="true">
      <Skeleton className="h-10 w-64" />
      <SkeletonText lines={2} className="max-w-xl" />
      <SkeletonCards count={cards} />
      {table && <SkeletonTable />}
    </div>
  )
}

export default Skeleton
