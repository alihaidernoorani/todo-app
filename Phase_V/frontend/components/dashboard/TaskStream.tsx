/**
 * Task Stream Component
 *
 * Main task management interface with optimistic updates.
 * Features:
 * - Real-time task list with CRUD operations
 * - Optimistic UI updates using React 19 useOptimistic
 * - Create, edit, delete, and toggle completion
 * - Staggered list animations with Framer Motion
 * - Empty state when no tasks exist
 * - Loading skeleton during initial fetch
 *
 * Data Flow:
 * 1. Fetch initial tasks from backend
 * 2. User performs action (create, toggle, update, delete)
 * 3. UI updates immediately (optimistic)
 * 4. Server Action called in background
 * 5. On success: State reconciled
 * 6. On error: State rolled back + error displayed
 *
 * Usage:
 * ```tsx
 * <TaskStream />
 * ```
 */

"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { listTasks } from "@/lib/api/tasks"
import { useOptimisticTask } from "@/lib/hooks/use-optimistic-task"
import { TaskItem } from "./TaskItem"
import { TaskForm } from "./TaskForm"
import { TaskItemSkeleton } from "@/components/atoms/ShimmerSkeleton"
import { Toast } from "@/components/atoms/Toast"
import type { TaskRead, TaskCreate, TaskUpdate, TaskFilters, TaskStatus, TaskPriority } from "@/lib/api/types"

interface TaskStreamProps {
  /**
   * Callback to notify parent when tasks change (for metrics calculation)
   */
  onTasksChange?: (tasks: TaskRead[]) => void
  /**
   * Increment to trigger a full task re-fetch (e.g. after a chat action)
   */
  refreshKey?: number
}

export function TaskStream({ onTasksChange, refreshKey }: TaskStreamProps = {}) {
  const [initialTasks, setInitialTasks] = useState<TaskRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  // T061: Filter state
  const [filters, setFilters] = useState<TaskFilters>({})
  const [totalCount, setTotalCount] = useState<number>(0)

  const {
    tasks,
    toggleComplete,
    updateTask,
    deleteTask,
    clearError,
  } = useOptimisticTask(initialTasks)

  const fetchTasks = useCallback(async (activeFilters?: TaskFilters) => {
    setIsLoading(true)
    try {
      const result = await listTasks(activeFilters)
      if (result.success) {
        const fetched = result.data.items
        setInitialTasks(fetched)
        setTotalCount(result.data.count)
        onTasksChange?.(fetched)
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchTasks(filters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTasks])

  // Re-fetch when chat triggers a refresh
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      fetchTasks(filters)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  // Re-fetch when filters change
  useEffect(() => {
    fetchTasks(filters)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Filter bar helpers (T061)
  const handleStatusFilter = (status: TaskStatus | '') => {
    setFilters(prev => ({ ...prev, status: status || undefined }))
  }
  const handlePriorityFilter = (priority: TaskPriority | '') => {
    setFilters(prev => ({ ...prev, priority: priority || undefined }))
  }
  const clearFilters = () => setFilters({})

  // Handle update task
  const handleUpdate = async (taskData: TaskCreate | TaskUpdate) => {
    if (!editingTaskId) return
    try {
      const updated = await updateTask(editingTaskId, taskData as TaskUpdate)
      if (updated) {
        setToastMessage("Task updated successfully")
        setEditingTaskId(null)
        // Update initialTasks with the updated task
        setInitialTasks(prev => {
          const updatedTasks = prev.map(t => t.id === editingTaskId ? updated : t)
          // Notify parent immediately with the updated task list
          onTasksChange?.(updatedTasks)
          return updatedTasks
        })
      }
    } catch (error) {
      // Error is already handled by optimistic hook
    }
  }

  // Handle toggle complete
  const handleToggle = async (taskId: string) => {
    try {
      const updated = await toggleComplete(taskId)
      if (updated) {
        // Update initialTasks with the toggled task
        setInitialTasks(prev => {
          const updatedTasks = prev.map(t => t.id === taskId ? updated : t)
          // Notify parent immediately with the updated task list
          onTasksChange?.(updatedTasks)
          return updatedTasks
        })
      }
    } catch (error) {
      // Error is already handled by optimistic hook
    }
  }

  // Handle delete task
  const handleDelete = async (taskId: string) => {
    // Prevent deleting tasks with temporary IDs (not yet confirmed by server)
    if (taskId.startsWith('temp-')) {
      setToastMessage("Please wait for the task to be created before deleting")
      return
    }

    try {
      await deleteTask(taskId)
      setToastMessage("Task deleted successfully")
      // Update initialTasks by removing the deleted task
      setInitialTasks(prev => {
        const updatedTasks = prev.filter(t => t.id !== taskId)
        // Notify parent immediately with the updated task list
        onTasksChange?.(updatedTasks)
        return updatedTasks
      })
    } catch (error) {
      // Error is already handled by optimistic hook
      console.error('Delete error:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state (outside loading)
  if (!isLoading && tasks.length === 0) {
    const hasFilters = filters.status || filters.priority || filters.tags?.length
    return (
      <div className="text-center py-12">
        {hasFilters ? (
          <>
            <p className="text-slate-400 text-lg mb-2">No tasks match the current filters.</p>
            <button onClick={clearFilters} className="text-blue-400 hover:text-blue-300 text-sm underline">
              Clear filters to see all tasks
            </button>
          </>
        ) : (
          <p className="text-slate-500 text-lg">No tasks yet. Use the form on the right to add your first task!</p>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Success Toast Notification */}
      <Toast
        message={toastMessage || ""}
        variant="success"
        show={!!toastMessage}
        onClose={() => setToastMessage(null)}
        duration={2000}
      />

      {/* T061: Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <select
          value={filters.status || ''}
          onChange={e => handleStatusFilter(e.target.value as TaskStatus | '')}
          className="text-sm bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.priority || ''}
          onChange={e => handlePriorityFilter(e.target.value as TaskPriority | '')}
          className="text-sm bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {(filters.status || filters.priority) && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Clear filters
          </button>
        )}

        {totalCount > 0 && (
          <span className="ml-auto text-xs text-slate-500">
            {totalCount} task{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-5">

      {/* Edit Form */}
      {editingTaskId && (
        <TaskForm
          mode="edit"
          initialData={tasks.find((t) => t.id === editingTaskId)}
          onSubmit={handleUpdate}
          onCancel={() => setEditingTaskId(null)}
        />
      )}

      {/* Task List */}
      {/* FR-008a: Generous spacing - space-y-4 to space-y-5 for lists (16-20px) */}
      {/* FR-011: Staggered entrance animation with 50ms delay between items */}
      <motion.div
        layout
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05, // 50ms delay between items
            },
          },
        }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task.id)}
              onEdit={() => setEditingTaskId(task.id)}
              onDelete={() => handleDelete(task.id)}
              onClearError={() => clearError(task.id)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State (all tasks deleted) */}
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No tasks yet. Use the form on the right to add your first task!</p>
        </div>
      )}
      </div>
    </>
  )
}
