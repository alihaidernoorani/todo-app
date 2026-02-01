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

export default function DashboardPage() {
  return (
    <PageTransition>
      {/* T077: Main landmark for accessibility and skip link target */}
      <main id="main-content" className="space-y-8">
        {/* Page header */}
        <div>
          <h1 className="heading-futuristic mb-2">Mission Control</h1>
          <p className="text-gray-400 text-body">Task overview and management</p>
        </div>

        {/* Metrics Grid (Phase 4 - User Story 2) */}
        <section aria-labelledby="metrics-heading">
          <h2 id="metrics-heading" className="text-lg font-semibold text-gray-300 mb-4 text-heading">
            System Status
          </h2>
          <Suspense fallback={<MetricsGridSkeleton />}>
            <MetricsGrid />
          </Suspense>
        </section>

        {/* Task Stream (Phase 5 - User Story 3) */}
        <section aria-labelledby="tasks-heading">
          <h2 id="tasks-heading" className="text-lg font-semibold text-gray-300 mb-4 text-heading">
            Active Tasks
          </h2>
          <TaskStream />
        </section>
      </main>
    </PageTransition>
  )
}
