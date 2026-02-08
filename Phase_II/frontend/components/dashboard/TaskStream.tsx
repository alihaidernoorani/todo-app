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
import { Plus } from "lucide-react"
import { listTasks } from "@/lib/api/tasks"
import { useOptimisticTask } from "@/lib/hooks/use-optimistic-task"
import { TaskItem } from "./TaskItem"
import { TaskForm } from "./TaskForm"
import { TaskModal } from "./TaskModal"
import { PrimaryButton } from "@/components/atoms/PrimaryButton"
import { EmptyState } from "./EmptyState"
import { TaskItemSkeleton } from "@/components/atoms/ShimmerSkeleton"
import { Toast } from "@/components/atoms/Toast"
import type { TaskRead, TaskCreate, TaskUpdate } from "@/lib/api/types"

interface TaskStreamProps {
  /**
   * Callback to notify parent when tasks change (for metrics calculation)
   */
  onTasksChange?: (tasks: TaskRead[]) => void
}

export function TaskStream({ onTasksChange }: TaskStreamProps = {}) {
  const [initialTasks, setInitialTasks] = useState<TaskRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const {
    tasks,
    createTask,
    toggleComplete,
    updateTask,
    deleteTask,
    clearError,
  } = useOptimisticTask(initialTasks)

  // Fetch tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const result = await listTasks()
        if (result.success) {
          const tasks = result.data.items
          setInitialTasks(tasks)
          // Notify parent immediately with fetched tasks
          onTasksChange?.(tasks)
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

  // Handle create task
  const handleCreate = async (taskData: TaskCreate) => {
    try {
      const newTask = await createTask(taskData)
      if (newTask) {
        setToastMessage("Task created successfully")
        // Update initialTasks after server confirms (removes temp task, adds real one)
        setInitialTasks(prev => {
          // Remove any temp tasks and add the new real task at the beginning
          const withoutTemp = prev.filter(t => !t.id.startsWith('temp-'))
          const updatedTasks = [newTask, ...withoutTemp]
          // Notify parent immediately with the updated task list
          onTasksChange?.(updatedTasks)
          return updatedTasks
        })
      }
    } catch (error) {
      // Error is already handled by optimistic hook
    }
  }

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

  // Empty state (no tasks and no modal open)
  if (tasks.length === 0 && !isModalOpen) {
    return <EmptyState onCreateTask={() => setIsModalOpen(true)} />
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
      {/* Create Task Button */}
      {/* FR-005b: Touch-friendly button with min-height 48px */}
      {!editingTaskId && (
        <div className="flex justify-end">
          <PrimaryButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
            className="min-h-[48px]"
          >
            Add Task
          </PrimaryButton>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreate}
      />

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
      {tasks.length === 0 && !isModalOpen && (
        <EmptyState onCreateTask={() => setIsModalOpen(true)} />
      )}
      </div>
    </>
  )
}
