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
 * - Glassmorphism card
 * - Hover effects with border glow
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
import { Edit2, Trash2 } from "lucide-react"
import { AnimatedCheckbox } from "@/components/atoms/AnimatedCheckbox"
import { IconButton } from "@/components/atoms/LuxuryButton"
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
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    text: "text-red-300",
  },
  Medium: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    text: "text-amber-300",
  },
  Low: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    text: "text-blue-300",
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
        glass-card border-ghost p-4
        ${task._optimistic ? "optimistic-pending" : ""}
        ${task._error ? "border-red-500/30" : ""}
        transition-all duration-300
        hover:border-white/20
      `}
    >
      {/* Main Content Row */}
      <div className="flex items-start gap-4">
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
          <h3
            className={`
              text-base font-medium mb-1
              ${task.is_completed ? "text-gray-500 line-through" : "text-gray-100"}
              transition-all duration-200
            `}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p
              className={`
                text-sm
                ${task.is_completed ? "text-gray-600" : "text-gray-400"}
                line-clamp-2
              `}
            >
              {task.description}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 mt-1">
            {new Date(task.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Priority Badge */}
        <div className="flex-shrink-0">
          <span
            className={`
              inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
              ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.text}
              border
            `}
          >
            {task.priority}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Edit2 className="w-4 h-4" />}
            ariaLabel={`Edit task: ${task.title}`}
            onClick={onEdit}
            variant="ghost"
            size="sm"
          />
          <IconButton
            icon={<Trash2 className="w-4 h-4" />}
            ariaLabel={`Delete task: ${task.title}`}
            onClick={onDelete}
            variant="ghost"
            size="sm"
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
