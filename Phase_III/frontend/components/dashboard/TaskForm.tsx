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
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({})
  const [touched, setTouched] = useState<{ title?: boolean; description?: boolean }>({})

  // Validate title on blur
  const validateTitle = () => {
    if (!title.trim()) {
      setFieldErrors(prev => ({ ...prev, title: "Title is required" }))
      return false
    }
    if (title.length > 255) {
      setFieldErrors(prev => ({ ...prev, title: "Title must be 255 characters or less" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, title: undefined }))
    return true
  }

  // Validate description on blur
  const validateDescription = () => {
    if (description && description.length > 2000) {
      setFieldErrors(prev => ({ ...prev, description: "Description must be 2000 characters or less" }))
      return false
    }
    setFieldErrors(prev => ({ ...prev, description: undefined }))
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Mark all fields as touched for validation display
    setTouched({ title: true, description: true })

    // Validate all fields
    const isTitleValid = validateTitle()
    const isDescriptionValid = validateDescription()

    if (!isTitleValid || !isDescriptionValid) {
      setError("Please fix the errors above before submitting")
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 md:p-6 space-y-5 shadow-sm">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">
          {mode === "create" ? "Create New Task" : "Edit Task"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close form"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Display */}
      {/* FR-016: User-friendly inline error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Title Input */}
      {/* FR-005b: Auto-focus on modal open, floating label with focus state */}
      {/* T042: Inline validation with error display below field */}
      <div className="relative">
        <label
          htmlFor="task-title"
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${title || isSubmitting
              ? `top-2 text-xs ${fieldErrors.title && touched.title ? 'text-red-600' : 'text-blue-600'}`
              : 'top-3.5 text-sm text-slate-500'
            }
          `}
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            if (touched.title) validateTitle()
          }}
          onBlur={() => {
            setTouched(prev => ({ ...prev, title: true }))
            validateTitle()
          }}
          disabled={isSubmitting}
          maxLength={255}
          className={`
            w-full px-4 pt-6 pb-2 rounded-lg border text-slate-900 text-sm md:text-base focus:ring-2 transition-all duration-200 hover:border-slate-400 disabled:opacity-50 min-h-[56px]
            ${fieldErrors.title && touched.title
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
            }
          `}
          required
          autoFocus
        />
        <div className="flex items-center justify-between mt-1.5">
          {fieldErrors.title && touched.title ? (
            <p className="text-xs text-red-600">{fieldErrors.title}</p>
          ) : (
            <p className="text-xs text-slate-500">
              {title.length}/255 characters
              {title.length > 229 && (
                <span className="ml-1 text-amber-600 font-medium">
                  (approaching limit)
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Description Textarea */}
      {/* FR-005b: Floating label with focus state */}
      {/* T042: Character count with 90% warning (1800/2000) */}
      <div className="relative">
        <label
          htmlFor="task-description"
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none
            ${description || isSubmitting
              ? `top-2 text-xs ${fieldErrors.description && touched.description ? 'text-red-600' : 'text-blue-600'}`
              : 'top-3 text-sm text-slate-500'
            }
          `}
        >
          Description (optional)
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value)
            if (touched.description) validateDescription()
          }}
          onBlur={() => {
            setTouched(prev => ({ ...prev, description: true }))
            validateDescription()
          }}
          disabled={isSubmitting}
          maxLength={2000}
          rows={3}
          className={`
            w-full px-4 pt-7 pb-2 rounded-lg border text-slate-900 text-sm md:text-base focus:ring-2 transition-all duration-200 hover:border-slate-400 disabled:opacity-50 resize-none
            ${fieldErrors.description && touched.description
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
            }
          `}
        />
        <div className="flex items-center justify-between mt-1.5">
          {fieldErrors.description && touched.description ? (
            <p className="text-xs text-red-600">{fieldErrors.description}</p>
          ) : (
            <p className={`text-xs ${description.length >= 1800 ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
              {description.length}/2000 characters
              {description.length >= 1800 && description.length < 2000 && (
                <span className="ml-1">(approaching limit)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Priority Select */}
      <div className="relative">
        <label htmlFor="task-priority" className="absolute left-4 top-2 text-xs text-blue-600 pointer-events-none">
          Priority
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          disabled={isSubmitting}
          className="w-full px-4 pt-6 pb-2 rounded-lg border border-slate-300 text-slate-900 text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-slate-400 disabled:opacity-50 cursor-pointer appearance-none min-h-[56px]"
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
        {/* Custom dropdown arrow */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Action Buttons */}
      {/* FR-005b: Touch-friendly buttons with min-height 48px */}
      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton
          type="submit"
          variant="primary"
          icon={mode === "create" ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="min-h-[48px]"
        >
          {mode === "create" ? "Create Task" : "Update Task"}
        </PrimaryButton>

        <PrimaryButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-[48px]"
        >
          Cancel
        </PrimaryButton>
      </div>
    </form>
  )
}
