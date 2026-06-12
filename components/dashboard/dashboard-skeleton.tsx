import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 py-8 border-b border-gray-200 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function ArchiveSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-12 animate-in fade-in duration-300">
      <div className="border-b border-gray-200 pb-8 space-y-4">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export function InsightsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-16 animate-in fade-in duration-300">
      <div className="border-b border-gray-900 pb-8 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-96 max-w-full" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <Skeleton className="lg:col-span-7 h-64 rounded-lg" />
        <Skeleton className="lg:col-span-5 h-64 rounded-lg" />
      </div>
    </div>
  )
}
