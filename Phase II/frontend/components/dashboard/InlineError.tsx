/**
 * Inline Error Component
 *
 * Displays error messages with retry functionality for failed optimistic updates.
 * Features:
 * - Compact error message display
 * - Blue "Retry" button
 * - Slide-in animation
 * - Auto-dismissible (optional)
 *
 * Design:
 * - Red accent for error state
 * - Clean light mode background
 * - Inline layout (doesn't disrupt flow)
 * - Clear error message with retry CTA
 *
 * Usage:
 * ```tsx
 * {task._error && (
 *   <InlineError
 *     message={task._error}
 *     onRetry={task._retryFn}
 *     onDismiss={() => clearError(task.id)}
 *   />
 * )}
 * ```
 */

"use client"

import { motion } from "framer-motion"
import { AlertCircle, RotateCcw, X } from "lucide-react"

interface InlineErrorProps {
  /**
   * Error message to display
   */
  message: string

  /**
   * Retry callback (triggers the failed operation again)
   */
  onRetry?: () => void | Promise<void>

  /**
   * Dismiss callback (clears the error)
   */
  onDismiss?: () => void

  /**
   * Auto-dismiss after N milliseconds (0 = no auto-dismiss)
   */
  autoDismissMs?: number
}

export function InlineError({
  message,
  onRetry,
  onDismiss,
  autoDismissMs = 0,
}: InlineErrorProps) {
  // Auto-dismiss timer
  if (autoDismissMs > 0 && onDismiss) {
    setTimeout(onDismiss, autoDismissMs)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm"
    >
      {/* Error Icon */}
      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />

      {/* Error Message */}
      <p className="flex-1 text-red-700 text-xs">{message}</p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        )}

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
