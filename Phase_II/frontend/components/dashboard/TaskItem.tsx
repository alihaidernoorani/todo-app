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
    bg: "bg-red-100",
    border: "border-red-200",
    text: "text-red-700",
  },
  Medium: {
    bg: "bg-amber-100",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  Low: {
    bg: "bg-blue-100",
    border: "border-blue-200",
    text: "text-blue-700",
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
        bg-white rounded-lg border border-slate-200/80 p-5 md:p-6 shadow-sm
        ${task._optimistic ? "optimistic-pending" : ""}
        ${task._error ? "border-red-200" : "hover:border-slate-300"}
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
                text-sm md:text-base font-medium mb-1 font-serif
                ${task.is_completed ? "text-slate-500 line-through" : "text-slate-900"}
                transition-all duration-200
              `}
            >
              {task.title}
            </h3>

            {/* Description */}
            {task.description && (
              <p
                className={`
                  text-xs md:text-sm
                  ${task.is_completed ? "text-slate-500" : "text-slate-600"}
                  line-clamp-2
                `}
              >
                {task.description}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-slate-500 mt-1">
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
                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                ${priorityStyle.bg} ${priorityStyle.border} ${priorityStyle.text}
                border
              `}
            >
              {task.priority}
            </span>
          </div>

          {/* Action Buttons - Hidden on mobile, shown on tablet+ */}
          {/* FR-005b: Touch-friendly buttons (min 44px handled by IconButton) */}
          <div className="hidden md:flex items-center gap-1">
            <IconButton
              icon={<Edit3 className="w-4 h-4" />}
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

        {/* Bottom Row: Action buttons for mobile only */}
        <div className="flex md:hidden items-center justify-end gap-2 pl-8">
          <IconButton
            icon={<Edit3 className="w-4 h-4" />}
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
