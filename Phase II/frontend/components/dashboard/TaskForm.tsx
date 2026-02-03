/**
 * Task Form Component
 *
 * Form for creating and editing tasks.
 * Features:
 * - Title input (required, max 255 chars)
 * - Description textarea (optional, max 2000 chars)
 * - Priority select (High, Medium, Low)
 * - Form validation
 * - Loading states
 * - Clean light mode styling
 *
 * Modes:
 * - Create: Empty form, "Create Task" button
 * - Edit: Pre-filled form, "Update Task" button
 *
 * Usage:
 * ```tsx
 * // Create mode
 * <TaskForm
 *   onSubmit={(data) => createTask(data)}
 *   onCancel={() => setShowForm(false)}
 * />
 *
 * // Edit mode
 * <TaskForm
 *   initialData={task}
 *   onSubmit={(data) => updateTask(task.id, data)}
 *   onCancel={() => setEditingTask(null)}
 * />
 * ```
 */

"use client"

import { useState, FormEvent } from "react"
import { PrimaryButton } from "@/components/atoms/PrimaryButton"
import { Plus, Save, X } from "lucide-react"
import type { TaskCreate, TaskUpdate, TaskPriority } from "@/lib/api/types"

interface TaskFormProps {
  /**
   * Initial data for edit mode
   */
  initialData?: Partial<TaskUpdate>

  /**
   * Submit callback (create or update)
   */
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<void>

  /**
   * Cancel callback
   */
  onCancel: () => void

  /**
   * Form mode
   */
  mode?: "create" | "edit"
}

export function TaskForm({
  initialData,
  onSubmit,
  onCancel,
  mode = initialData ? "edit" : "create",
}: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [priority, setPriority] = useState<TaskPriority>(
    (initialData?.priority as TaskPriority) || "Medium"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!title.trim()) {
      setError("Title is required")
      return
    }

    if (title.length > 255) {
      setError("Title must be 255 characters or less")
      return
    }

    if (description && description.length > 2000) {
      setError("Description must be 2000 characters or less")
      return
    }

    setIsSubmitting(true)

    try {
      const taskData =
        mode === "edit"
          ? {
              title: title.trim(),
              description: description.trim() || null,
              priority,
              is_completed: initialData?.is_completed || false,
            }
          : {
              title: title.trim(),
              description: description.trim() || null,
              priority,
            }

      await onSubmit(taskData as TaskCreate | TaskUpdate)

      // Reset form on success (create mode only)
      if (mode === "create") {
        setTitle("")
        setDescription("")
        setPriority("Medium")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-sm">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {mode === "create" ? "Create New Task" : "Edit Task"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Title Input */}
      <div>
        <label htmlFor="task-title" className="block text-sm font-medium text-slate-700 mb-2">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          maxLength={255}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 disabled:opacity-50"
          placeholder="Enter task title..."
          required
          autoFocus
        />
        <p className="text-xs text-slate-500 mt-1">
          {title.length}/255 characters
        </p>
      </div>

      {/* Description Textarea */}
      <div>
        <label htmlFor="task-description" className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          maxLength={2000}
          rows={3}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 disabled:opacity-50 resize-none"
          placeholder="Add details (optional)..."
        />
        <p className="text-xs text-slate-500 mt-1">
          {description.length}/2000 characters
        </p>
      </div>

      {/* Priority Select */}
      <div>
        <label htmlFor="task-priority" className="block text-sm font-medium text-slate-700 mb-2">
          Priority
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 disabled:opacity-50 cursor-pointer"
        >
          <option value="High" className="bg-white">
            High Priority
          </option>
          <option value="Medium" className="bg-white">
            Medium Priority
          </option>
          <option value="Low" className="bg-white">
            Low Priority
          </option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton
          type="submit"
          variant="primary"
          icon={mode === "create" ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {mode === "create" ? "Create Task" : "Update Task"}
        </PrimaryButton>

        <PrimaryButton
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </PrimaryButton>
      </div>
    </form>
  )
}
