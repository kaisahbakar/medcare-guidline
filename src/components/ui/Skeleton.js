function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <Skeleton className="mb-3 h-5 w-3/4" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-1 h-4 w-5/6" />
      <Skeleton className="mt-3 h-3 w-1/4" />
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <Skeleton className="mb-2 h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function TextSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export default Skeleton
