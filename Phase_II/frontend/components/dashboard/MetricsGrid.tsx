/**
 * Metrics Grid Component
 *
 * Displays aggregated task statistics in a responsive grid.
 * Features:
 * - Fetches data from backend /api/{user_id}/tasks/metrics endpoint
 * - Shows 4 metric cards: Total, Completed, Pending, Overdue
 * - Responsive grid layout (1 col mobile → 2 col tablet → 4 col desktop)
 * - Error handling with retry button
 * - Empty state when total === 0
 *
 * Data Flow:
 * 1. Component mounts
 * 2. Calls getTaskMetrics() Server Action
 * 3. Server Action extracts JWT, makes authenticated request
 * 4. Backend returns TaskMetrics schema
 * 5. Component renders metric cards with staggered animations
 *
 * Usage:
 * ```tsx
 * // In dashboard page with Suspense boundary
 * <Suspense fallback={<MetricsGridSkeleton />}>
 *   <MetricsGrid />
 * </Suspense>
 * ```
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getTaskMetrics } from "@/lib/api/tasks"
import { MetricCard } from "./MetricCard"
import { EmptyState } from "./EmptyState"
import type { TaskMetrics } from "@/lib/api/types"
import {
  CheckCircle,
  Clock,
  ListTodo,
  Calendar,
} from "lucide-react"

export function MetricsGrid() {
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchMetrics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getTaskMetrics()

      // Handle API response failure
      if (!result.success) {
        // TypeScript type narrowing: result is ApiError here
        const apiError = result.error
        console.error("Failed to fetch metrics:", {
          code: apiError.code,
          message: apiError.message,
          status: apiError.status
        })

        // Extract error message safely
        const errorMessage = typeof apiError.message === 'string'
          ? apiError.message
          : 'Failed to load metrics. Please try again.'

        setError(errorMessage)
        return
      }

      // Success - set metrics from response data
      setMetrics(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics")
      console.error("Failed to fetch metrics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchMetrics()
  }, [pathname, router])

  // T046: Polling with tab visibility detection
  // Refresh metrics every 30 seconds only when tab is active
  useEffect(() => {
    // Skip polling if no metrics loaded yet
    if (!metrics) return

    // Poll every 30 seconds
    const pollInterval = setInterval(() => {
      // Only fetch if document is visible (tab is active)
      if (document.visibilityState === 'visible') {
        fetchMetrics()
      }
    }, 30000) // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval)
  }, [metrics])

  // T046: Fetch fresh data when tab becomes visible after being hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && metrics) {
        // Fetch fresh data when user returns to tab
        fetchMetrics()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [metrics])

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center shadow-sm">
        <div className="mb-4">
          <Calendar className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Failed to Load Metrics
          </h3>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200"
        >
          Retry
        </button>
      </div>
    )
  }

  // Empty state (no tasks)
  if (metrics && metrics.total === 0) {
    return <EmptyState />
  }

  // Loading state is handled by Suspense boundary, but we keep this for manual refresh
  if (isLoading || !metrics) {
    return null // Suspense fallback will show instead
  }

  // Metrics grid
  // FR-008a: Generous spacing - gap-5 to gap-6 for grids (20-24px)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
      {/* Total Tasks */}
      <MetricCard
        icon={<ListTodo />}
        label="Total Tasks"
        value={metrics.total}
        color="blue"
        index={0}
      />

      {/* Completed Tasks */}
      <MetricCard
        icon={<CheckCircle />}
        label="Completed"
        value={metrics.completed}
        color="emerald"
        index={1}
      />

      {/* In Progress Tasks */}
      <MetricCard
        icon={<Clock />}
        label="In Progress"
        value={metrics.pending}
        color="amber"
        index={2}
      />

      {/* Overdue Tasks */}
      <MetricCard
        icon={<Calendar />}
        label="Overdue"
        value={metrics.overdue || 0}
        color="red"
        index={3}
      />
    </div>
  )
}
