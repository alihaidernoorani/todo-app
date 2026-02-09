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

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { listTasks } from "@/lib/api/tasks"
import { useOptimisticTask } from "@/lib/hooks/use-optimistic-task"
import { TaskItem } from "./TaskItem"
import { TaskForm } from "./TaskForm"
import { TaskItemSkeleton } from "@/components/atoms/ShimmerSkeleton"
import { Toast } from "@/components/atoms/Toast"
import { useTasks } from "@/contexts/TasksContext"
import type { TaskRead, TaskCreate, TaskUpdate } from "@/lib/api/types"

interface TaskStreamProps {
  /**
   * Callback to notify parent when tasks change (for metrics calculation)
   */
  onTasksChange?: (tasks: TaskRead[]) => void
}

export function TaskStream({ onTasksChange }: TaskStreamProps = {}) {
  const { tasks: contextTasks, setTasks: setContextTasks } = useTasks()
  const [isLoading, setIsLoading] = useState(true)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const {
    tasks,
    toggleComplete,
    updateTask,
    deleteTask,
    clearError,
  } = useOptimisticTask(contextTasks)

  // Fetch tasks on mount and sync with context
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await listTasks()
        if (result.success) {
          const fetchedTasks = result.data.items
          setContextTasks(fetchedTasks)
          // Notify parent immediately with fetched tasks
          onTasksChange?.(fetchedTasks)
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only on mount

  // Handle update task
  const handleUpdate = async (taskData: TaskCreate | TaskUpdate) => {
    if (!editingTaskId) return
    try {
      const updated = await updateTask(editingTaskId, taskData as TaskUpdate)
      if (updated) {
        setToastMessage("Task updated successfully")
        setEditingTaskId(null)
        // Update context with the updated task
        const updatedTasks = contextTasks.map(t => t.id === editingTaskId ? updated : t)
        setContextTasks(updatedTasks)
        // Notify parent immediately with the updated task list
        onTasksChange?.(updatedTasks)
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
        // Update context with the toggled task
        const updatedTasks = contextTasks.map(t => t.id === taskId ? updated : t)
        setContextTasks(updatedTasks)
        // Notify parent immediately with the updated task list
        onTasksChange?.(updatedTasks)
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
      // Update context by removing the deleted task
      const updatedTasks = contextTasks.filter(t => t.id !== taskId)
      setContextTasks(updatedTasks)
      // Notify parent immediately with the updated task list
      onTasksChange?.(updatedTasks)
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

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-lg">No tasks yet. Use the form on the right to add your first task!</p>
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
