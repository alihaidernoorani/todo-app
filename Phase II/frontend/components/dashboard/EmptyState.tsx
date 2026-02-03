/**
 * Empty State Component
 *
 * Displayed when user has no tasks yet.
 * Features:
 * - Helpful onboarding message
 * - Call-to-action button to create first task
 * - Clean light mode card design
 * - Animated icon
 *
 * Design:
 * - Centered layout with generous whitespace
 * - Blue accent for CTA button
 * - Friendly, encouraging copy
 * - Animated checkmark icon for visual interest
 *
 * Usage:
 * ```tsx
 * {tasks.length === 0 ? (
 *   <EmptyState onCreateTask={() => setShowTaskForm(true)} />
 * ) : (
 *   <TaskList tasks={tasks} />
 * )}
 * ```
 */

"use client"

import { motion } from "framer-motion"

interface EmptyStateProps {
  /**
   * Callback when user clicks "Create your first task" button
   */
  onCreateTask?: () => void
}

export function EmptyState({ onCreateTask }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-center min-h-[400px] p-8"
    >
      <div className="bg-white rounded-lg border border-slate-200 max-w-md text-center p-8 shadow-sm">
        {/* Animated Icon */}
        <motion.div
          initial={{ y: -10 }}
          animate={{ y: 0 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className="mb-6 flex justify-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
        </motion.div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3 font-serif">
          Welcome to TaskFlow
        </h2>

        {/* Description */}
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          No tasks found. Start organizing your work by creating your first task.
          Track progress, set priorities, and stay in control.
        </p>

        {/* CTA Button */}
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-200 inline-flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Your First Task
          </button>
        )}

        {/* Help Text */}
        <p className="mt-6 text-xs text-slate-500">
          Tasks you create will appear here with real-time metrics
        </p>
      </div>
    </motion.div>
  )
}
