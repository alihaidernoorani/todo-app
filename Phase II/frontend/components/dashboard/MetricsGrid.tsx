/**
 * Metrics Grid Component
 *
 * Displays aggregated task statistics in a responsive grid.
 * Features:
 * - Fetches data from backend /api/{user_id}/tasks/metrics endpoint
 * - Shows 4 metric cards: Total, Completed, Pending, High Priority
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
import { AuthenticationError } from "@/lib/api/errors"
import { MetricCard } from "./MetricCard"
import { EmptyState } from "./EmptyState"
import type { TaskMetrics } from "@/lib/api/types"
import {
  CheckCircle,
  Clock,
  ListTodo,
  AlertCircle,
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
      const data = await getTaskMetrics()
      setMetrics(data)
    } catch (err) {
      // Check if it's an authentication error
      if (err instanceof AuthenticationError) {
        console.error("Not authenticated, redirecting to sign-in:", err)
        // Redirect to sign-in with return URL
        const signInUrl = `/sign-in?from=${encodeURIComponent(pathname)}`
        router.push(signInUrl)
        return
      }

      setError(err instanceof Error ? err.message : "Failed to load metrics")
      console.error("Failed to fetch metrics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [pathname, router])

  // Error state
  if (error) {
    return (
      <div className="glass-card border-ghost-amber p-8 text-center">
        <div className="mb-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Failed to Load Metrics
          </h3>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold transition-all duration-200 tactile-button"
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Pending Tasks */}
      <MetricCard
        icon={<Clock />}
        label="Pending"
        value={metrics.pending}
        color="amber"
        index={2}
      />

      {/* High Priority Tasks */}
      <MetricCard
        icon={<AlertCircle />}
        label="High Priority"
        value={metrics.high_priority}
        color="red"
        index={3}
      />
    </div>
  )
}
