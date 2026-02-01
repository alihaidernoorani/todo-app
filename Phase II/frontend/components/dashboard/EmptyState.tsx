/**
 * Empty State Component
 *
 * Displayed when user has no tasks yet.
 * Features:
 * - Helpful onboarding message
 * - Call-to-action button to create first task
 * - Glassmorphism card design
 * - Animated icon
 *
 * Design:
 * - Centered layout with generous whitespace
 * - Amber accent for CTA button
 * - Friendly, encouraging copy
 * - Animated rocket icon for visual interest
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
      <div className="glass-card border-ghost-amber max-w-md text-center">
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
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-amber-400"
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
        <h2 className="heading-futuristic text-2xl mb-3">
          Your Command Center Awaits
        </h2>

        {/* Description */}
        <p className="text-gray-400 mb-6 text-sm leading-relaxed">
          No tasks found. Start organizing your work by creating your first task.
          Track progress, set priorities, and stay in control.
        </p>

        {/* CTA Button */}
        {onCreateTask && (
          <button
            onClick={onCreateTask}
            className="px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold transition-all duration-200 tactile-button glow-amber-subtle inline-flex items-center gap-2"
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
        <p className="mt-6 text-xs text-gray-500">
          Tasks you create will appear here with real-time metrics
        </p>
      </div>
    </motion.div>
  )
}
