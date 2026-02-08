/**
 * T018: Shimmer Skeleton Loader - Clean Light Mode
 *
 * Animated placeholder component shown while data is loading.
 * Features:
 * - Light theme animated background (slate-200 with white shimmer)
 * - Configurable dimensions
 * - Matches final component size to prevent layout shift (0px CLS)
 *
 * Design Notes:
 * - Uses CSS animations for 60fps performance
 * - White shimmer overlay moves horizontally with cubic-bezier easing
 * - Background: slate-200 (#e2e8f0)
 *
 * Usage:
 * ```tsx
 * // Card skeleton
 * <ShimmerSkeleton className="h-32 rounded-lg" />
 *
 * // Text skeleton
 * <ShimmerSkeleton className="h-4 w-32 rounded" />
 *
 * // Grid of skeletons
 * <div className="grid grid-cols-4 gap-4">
 *   {Array.from({ length: 4 }).map((_, i) => (
 *     <ShimmerSkeleton key={i} className="h-32 rounded-lg" />
 *   ))}
 * </div>
 * ```
 */

"use client"

import { HTMLAttributes } from "react"

interface ShimmerSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes for sizing and positioning
   * Common patterns:
   * - Card: "h-32 rounded-xl"
   * - Text: "h-4 w-32 rounded"
   * - Circle: "w-12 h-12 rounded-full"
   */
  className?: string
}

export function ShimmerSkeleton({ className = "", ...props }: ShimmerSkeletonProps) {
  return (
    <div
      className={`shimmer ${className}`}
      role="status"
      aria-label="Loading..."
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

/**
 * Pre-configured shimmer skeletons for common use cases
 */

/**
 * Metric Card Skeleton
 * Matches the exact dimensions of MetricCard component
 */
export function MetricCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 h-32">
      <div className="space-y-3">
        {/* Icon skeleton */}
        <ShimmerSkeleton className="w-10 h-10 rounded-lg" />

        {/* Label skeleton */}
        <ShimmerSkeleton className="h-4 w-24 rounded" />

        {/* Value skeleton */}
        <ShimmerSkeleton className="h-8 w-16 rounded" />
      </div>
    </div>
  )
}

/**
 * Task List Item Skeleton
 * Matches task item dimensions
 */
export function TaskItemSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-4">
        {/* Checkbox skeleton */}
        <ShimmerSkeleton className="w-5 h-5 rounded" />

        <div className="flex-1 space-y-2">
          {/* Title skeleton */}
          <ShimmerSkeleton className="h-5 w-48 rounded" />

          {/* Description skeleton */}
          <ShimmerSkeleton className="h-3 w-64 rounded" />
        </div>

        {/* Priority badge skeleton */}
        <ShimmerSkeleton className="w-16 h-6 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Metrics Grid Skeleton
 * Shows 4 metric card skeletons in a grid
 */
export function MetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Task Stream Skeleton
 * Shows 5 task item skeletons in a list
 * Prevents Cumulative Layout Shift (CLS) per SC-003
 */
export function TaskStreamSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </div>
  )
}
