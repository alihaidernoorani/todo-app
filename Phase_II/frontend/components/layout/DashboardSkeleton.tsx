'use client'

/**
 * Loading skeleton displayed while checking authentication status
 * Maintains layout structure to prevent CLS (Cumulative Layout Shift)
 */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Skeleton */}
      <aside className="hidden md:flex w-72 bg-slate-50 border-r border-slate-200 flex-col p-4">
        <div className="mb-8">
          {/* Logo skeleton */}
          <div className="h-8 bg-slate-200 rounded animate-pulse w-32" />
        </div>

        {/* Nav items skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-6 md:ml-0">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-slate-200 rounded animate-pulse w-48 mb-4" />
          <div className="h-6 bg-slate-200 rounded animate-pulse w-64" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 p-6"
            >
              <div className="h-4 bg-slate-200 rounded animate-pulse w-24 mb-4" />
              <div className="h-8 bg-slate-200 rounded animate-pulse w-16" />
            </div>
          ))}
        </div>

        {/* Task List Skeleton */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="h-6 bg-slate-200 rounded animate-pulse w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </main>

      {/* Mobile Nav Skeleton */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="flex justify-around">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-10 bg-slate-200 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
