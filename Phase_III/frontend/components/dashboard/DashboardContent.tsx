/**
 * Dashboard Content - Client Component Wrapper
 *
 * Manages shared state between MetricsGrid and TaskStream.
 * Metrics are calculated client-side from the task list for instant updates.
 *
 * Features:
 * - Shared task state between components
 * - Client-side metric calculation (no server calls)
 * - Smooth, instant metric updates as tasks change
 */

"use client"

import { useState, useCallback } from "react"
import { MetricsGrid } from "./MetricsGrid"
import { TaskStream } from "./TaskStream"
import type { TaskRead } from "@/lib/api/types"

export function DashboardContent() {
  const [tasks, setTasks] = useState<TaskRead[]>([])

  /**
   * Callback for TaskStream to update the shared task list
   * This automatically triggers metrics recalculation
   * Memoized to prevent unnecessary re-renders
   */
  const updateTasks = useCallback((newTasks: TaskRead[]) => {
    setTasks(newTasks)
  }, [])

  return (
    <>
      {/* Metrics Grid (Phase 4 - User Story 2) */}
      {/* FR-008a: Generous spacing with gap-5 to gap-6 for grids */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="text-base md:text-lg font-semibold text-slate-700 mb-5">
          System Status
        </h2>
        <MetricsGrid tasks={tasks} />
      </section>

      {/* Task Stream (Phase 5 - User Story 3) */}
      {/* FR-008a: Generous spacing with space-y-4 to space-y-5 for lists */}
      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className="text-base md:text-lg font-semibold text-slate-700 mb-5">
          Active Tasks
        </h2>
        <TaskStream onTasksChange={updateTasks} />
      </section>
    </>
  )
}
