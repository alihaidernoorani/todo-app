/**
 * Dashboard Page
 *
 * Main command center for task management.
 * Features:
 * - Real-time task metrics grid
 * - Task stream with CRUD operations
 * - Suspense boundaries for streaming data
 * - Optimistic UI updates
 *
 * Layout:
 * - Page header with title and description
 * - Metrics grid (4 cards: Total, Completed, Pending, High Priority)
 * - Task stream with create/edit/delete functionality
 *
 * Data Loading:
 * - Metrics: Server Action → Backend API → Suspense streaming
 * - Tasks: Server Action → Backend API → Optimistic updates
 */

import { Suspense } from "react"
import { MetricsGrid } from "@/components/dashboard/MetricsGrid"
import { TaskStream } from "@/components/dashboard/TaskStream"
import { MetricsGridSkeleton } from "@/components/atoms/ShimmerSkeleton"
import { PageTransition } from "@/components/layout/PageTransition"
import { useSession } from "@/lib/auth/useSession"

export default function DashboardPage() {
  const { session, status } = useSession()

  return (
    <PageTransition>
      {/* T077: Main landmark for accessibility and skip link target */}
      <main id="main-content" className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">
            {status === 'authenticated' && session.user?.name
              ? `Welcome back, ${session.user.name.split(' ')[0]}`
              : 'My Tasks'}
          </h1>
          <p className="text-slate-600 text-body">Task overview and management</p>
        </div>

        {/* Metrics Grid (Phase 4 - User Story 2) */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="text-lg font-semibold text-slate-700 mb-4">
            System Status
          </h2>
          <Suspense fallback={<MetricsGridSkeleton />}>
            <MetricsGrid />
          </Suspense>
        </section>

        {/* Task Stream (Phase 5 - User Story 3) */}
        <section aria-labelledby="tasks-heading">
          <h2 id="tasks-heading" className="text-lg font-semibold text-slate-700 mb-4">
            Active Tasks
          </h2>
          <TaskStream />
        </section>
      </main>
    </PageTransition>
  )
}
