import { cn } from '@/lib/utils'

// ─── Base Skeleton ─────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded-xl',
        className
      )}
    />
  )
}

// ─── Dashboard KPI Cards ────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header skeleton */}
      <div className="bg-navy px-5 pt-5 pb-6">
        <Skeleton className="h-3 w-28 bg-white/20 mb-1" />
        <Skeleton className="h-6 w-44 bg-white/20 mb-2" />
        <Skeleton className="h-3 w-36 bg-white/20 mb-4" />

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/10 rounded-2xl p-3">
              <Skeleton className="h-8 w-12 bg-white/20 mb-1" />
              <Skeleton className="h-3 w-24 bg-white/20 mb-1" />
              <Skeleton className="h-3 w-20 bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      {/* Body skeleton */}
      <div className="flex-1 px-4 py-5 space-y-4 max-w-2xl mx-auto w-full">
        {/* Plan 30j card */}
        <div className="card space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2.5 w-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="flex-1 h-8 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Assistant banner */}
        <Skeleton className="h-16 w-full rounded-2xl" />

        {/* Tâche du jour */}
        <Skeleton className="h-36 w-full rounded-2xl" />

        {/* Tasks */}
        <div>
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="card divide-y divide-gray-50">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-12 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Plan 30 jours ─────────────────────────────────────
export function PlanSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy px-5 py-5">
        <Skeleton className="h-6 w-32 bg-white/20 mb-2" />
        <Skeleton className="h-3 w-48 bg-white/20 mb-3" />
        <div className="flex items-center gap-3">
          <Skeleton className="flex-1 h-1.5 bg-white/20 rounded-full" />
          <Skeleton className="w-8 h-4 bg-white/20" />
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {/* IA bubble */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Weeks */}
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="w-12 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CRM Liste clients ──────────────────────────────────
export function CRMSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy px-5 py-5">
        <Skeleton className="h-6 w-24 bg-white/20 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white/10 rounded-2xl p-3">
              <Skeleton className="h-6 w-12 bg-white/20 mb-1" />
              <Skeleton className="h-3 w-20 bg-white/20" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {/* Search */}
        <Skeleton className="h-10 w-full rounded-xl" />

        {/* Filters */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Client cards */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="card flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex flex-col gap-2 items-end">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Fiche client ───────────────────────────────────────
export function ClientDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-navy px-5 py-5">
        <div className="flex items-center gap-3 mb-5">
          <Skeleton className="w-5 h-5 bg-white/20 rounded" />
          <Skeleton className="h-6 w-32 bg-white/20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl bg-white/20 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-36 bg-white/20" />
            <Skeleton className="h-3 w-28 bg-white/20" />
            <Skeleton className="h-6 w-48 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="flex-1 h-9 rounded-xl" />
          ))}
        </div>

        {/* Orders */}
        {[1, 2, 3].map(i => (
          <div key={i} className="card space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-8 rounded-xl" />
              <Skeleton className="flex-1 h-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
