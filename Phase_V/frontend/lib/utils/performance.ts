/**
 * Performance Tracking Utility
 *
 * Provides utilities for monitoring task action performance to ensure
 * all operations complete within the <3s requirement.
 *
 * Features:
 * - Action timing measurement
 * - Slow action detection (>3s threshold)
 * - Performance logging with context
 * - Minimal overhead (<5ms)
 *
 * Usage:
 * ```ts
 * const stopTracking = trackActionTiming('addTask', { taskId: '123' })
 * await apiClient.post('/tasks', data)
 * stopTracking() // Logs if > 3s
 * ```
 */

export interface PerformanceMetrics {
  /**
   * Action identifier (e.g., 'addTask', 'deleteTask')
   */
  action: string

  /**
   * Duration in milliseconds
   */
  duration: number

  /**
   * Additional context for debugging
   */
  context?: Record<string, unknown>

  /**
   * Timestamp when action started
   */
  timestamp: number

  /**
   * Whether action exceeded 3s threshold
   */
  isSlow: boolean
}

/**
 * Performance threshold in milliseconds (2 seconds)
 * Operations exceeding this are logged as slow
 */
export const PERFORMANCE_THRESHOLD = 2000

/**
 * Tracks action timing and logs slow operations
 *
 * @param action - Name of the action being tracked
 * @param context - Optional context for debugging
 * @returns Function to stop tracking and log results
 *
 * @example
 * ```ts
 * const stopTracking = trackActionTiming('completeTask', { taskId: '123' })
 * try {
 *   await completeTaskAction(taskId)
 * } finally {
 *   stopTracking()
 * }
 * ```
 */
export function trackActionTiming(
  action: string,
  context?: Record<string, unknown>
): () => PerformanceMetrics {
  const startTime = performance.now()
  const timestamp = Date.now()

  return () => {
    const endTime = performance.now()
    const duration = endTime - startTime

    const metrics: PerformanceMetrics = {
      action,
      duration,
      context,
      timestamp,
      isSlow: duration > PERFORMANCE_THRESHOLD,
    }

    // Log slow actions for monitoring
    if (metrics.isSlow) {
      console.warn(
        `⚠️ Slow action detected: ${action} took ${duration.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLD}ms)`,
        {
          duration: `${duration.toFixed(0)}ms`,
          threshold: `${PERFORMANCE_THRESHOLD}ms`,
          context,
          timestamp: new Date(timestamp).toISOString(),
        }
      )
    }

    // Log all actions in development for debugging
    if (process.env.NODE_ENV === 'development') {
      const emoji = metrics.isSlow ? '🐌' : '⚡'
      console.log(
        `${emoji} Performance: ${action} - ${duration.toFixed(0)}ms`,
        context || {}
      )
    }

    return metrics
  }
}

/**
 * Measures async function execution time
 *
 * @param action - Name of the action
 * @param fn - Async function to measure
 * @param context - Optional context
 * @returns Promise resolving to function result and metrics
 *
 * @example
 * ```ts
 * const { result, metrics } = await measureAsync(
 *   'fetchTasks',
 *   () => apiClient.get('/tasks')
 * )
 * ```
 */
export async function measureAsync<T>(
  action: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const stopTracking = trackActionTiming(action, context)

  try {
    const result = await fn()
    const metrics = stopTracking()
    return { result, metrics }
  } catch (error) {
    stopTracking()
    throw error
  }
}

/**
 * Creates a performance-tracked version of an async function
 *
 * @param action - Name of the action
 * @param fn - Function to wrap
 * @returns Wrapped function that tracks performance
 *
 * @example
 * ```ts
 * const trackedAddTask = withPerformanceTracking(
 *   'addTask',
 *   (data) => apiClient.post('/tasks', data)
 * )
 * ```
 */
export function withPerformanceTracking<TArgs extends unknown[], TResult>(
  action: string,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const stopTracking = trackActionTiming(action, {
      argsCount: args.length,
    })

    try {
      const result = await fn(...args)
      stopTracking()
      return result
    } catch (error) {
      stopTracking()
      throw error
    }
  }
}

/**
 * Formats duration for display
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 *
 * @example
 * ```ts
 * formatDuration(1234) // "1.2s"
 * formatDuration(456)  // "456ms"
 * ```
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  return `${Math.round(ms)}ms`
}
