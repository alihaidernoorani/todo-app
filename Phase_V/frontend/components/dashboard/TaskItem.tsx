/**
 * Task Item Component
 *
 * Displays a single task with interactive controls.
 * Features:
 * - AnimatedCheckbox for completion toggle
 * - Title and description display
 * - Priority badge with color coding
 * - Edit and delete buttons
 * - Inline error display with retry
 * - Optimistic state indicators
 * - Framer Motion animations
 *
 * Design:
 * - Clean light mode styling
 * - Subtle shadow and hover effects
 * - Pending state: Amber border + spinner
 * - Error state: Red border + inline error
 * - Layout: Checkbox | Content | Priority | Actions
 *
 * Usage:
 * ```tsx
 * <TaskItem
 *   task={task}
 *   onToggle={() => toggleComplete(task.id)}
 *   onEdit={() => setEditingTask(task)}
 *   onDelete={() => deleteTask(task.id)}
 * />
 * ```
 */

"use client"

import { motion } from "framer-motion"
import { Edit3, Trash2 } from "lucide-react"
import { AnimatedCheckbox } from "@/components/atoms/AnimatedCheckbox"
import { IconButton } from "@/components/atoms/PrimaryButton"
import { InlineError } from "./InlineError"
import type { OptimisticTask } from "@/lib/api/types"

interface TaskItemProps {
  /**
   * Task data (may include optimistic metadata)
   */
  task: OptimisticTask

  /**
   * Toggle completion callback
   */
  onToggle: () => void

  /**
   * Edit callback
   */
  onEdit: () => void

  /**
   * Delete callback
   */
  onDelete: () => void

  /**
   * Clear error callback
   */
  onClearError?: () => void
}

const priorityColors = {
  High: {
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-700 dark:text-red-300",
  },
  Medium: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
  },
  Low: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
  },
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onClearError,
}: TaskItemProps) {
  const priorityStyle = priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.Medium

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        layout: { duration: 0.3 },
        opacity: { duration: 0.2 },
      }}
      className={`
        bg-white dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 p-5 md:p-6 shadow-sm
        ${task._optimistic ? "optimistic-pending" : ""}
        ${task._error ? "border-red-200 dark:border-red-800" : "hover:border-slate-300 dark:hover:border-slate-600"}
        transition-all duration-150
        hover:shadow-sm
      `}
    >
      {/* Main Content - Responsive Layout */}
      {/* Mobile: Stacked layout with actions below */}
      {/* Tablet+: Side-by-side layout with actions on right */}
      {/* FR-008a: Generous spacing - p-5 to p-6 for cards */}
      <div className="space-y-3 md:space-y-0">
        {/* Top Row: Checkbox + Content + Priority */}
        <div className="flex items-start gap-3 md:gap-4">
          {/* Checkbox */}
          <div className="pt-0.5">
            <AnimatedCheckbox
              checked={task.is_completed}
              onChange={onToggle}
              isPending={task._optimistic}
              ariaLabel={`Mark "${task.title}" as ${task.is_completed ? "incomplete" : "complete"}`}
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            {/* FR-009b: Responsive typography */}
            <h3
              className={`
                text-base md:text-lg font-semibold mb-1 font-heading
                ${task.is_completed ? "text-slate-500 dark:text-slate-500 line-through" : "text-slate-900 dark:text-slate-50"}
                transition-all duration-200
              `}
            >
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p
                className={`
                  text-sm md:text-base
                  ${task.is_completed ? "text-slate-500 dark:text-slate-500" : "text-slate-600 dark:text-slate-300"}
                  line-clamp-2
                `}
              >
                {task.description}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {new Date(task.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Priority Badge - Always visible */}
          <div className="flex-shrink-0">
            <span
              className={`
                inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold
                ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.text}
                border
              `}
            >
              {task.priority}
            </span>
          </div>

          {/* Action Buttons - Hidden on mobile, shown on tablet+ */}
          {/* FR-005b: Touch-friendly buttons (min 44px handled by IconButton) */}
          <div className="hidden md:flex items-center gap-2">
            <IconButton
              icon={<Edit3 className="w-5 h-5" />}
              ariaLabel={`Edit task: ${task.title}`}
              onClick={onEdit}
              variant="ghost"
              size="md"
            />
            <IconButton
              icon={<Trash2 className="w-5 h-5" />}
              ariaLabel={`Delete task: ${task.title}`}
              onClick={onDelete}
              variant="ghost"
              size="md"
            />
          </div>
        </div>

        {/* Bottom Row: Action buttons for mobile only */}
        <div className="flex md:hidden items-center justify-end gap-2 pl-8">
          <IconButton
            icon={<Edit3 className="w-5 h-5" />}
            ariaLabel={`Edit task: ${task.title}`}
            onClick={onEdit}
            variant="ghost"
            size="md"
          />
          <IconButton
            icon={<Trash2 className="w-5 h-5" />}
            ariaLabel={`Delete task: ${task.title}`}
            onClick={onDelete}
            variant="ghost"
            size="md"
          />
        </div>
      </div>

      {/* Inline Error (if present) */}
      {task._error && (
        <div className="mt-3">
          <InlineError
            message={task._error}
            onRetry={task._retryFn || undefined}
            onDismiss={onClearError}
          />
        </div>
      )}
    </motion.div>
  )
}
