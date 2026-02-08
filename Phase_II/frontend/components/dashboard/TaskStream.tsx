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
import { useRouter, usePathname } from "next/navigation"
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

export function TaskStream() {
  const [initialTasks, setInitialTasks] = useState<TaskRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const {
    tasks,
    createTask,
    toggleComplete,
    updateTask,
    deleteTask,
    clearError,
  } = useOptimisticTask(initialTasks)

  // Fetch initial tasks on mount
  // CRITICAL: This useEffect must handle the case where it runs before session is ready
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        console.log('[TaskStream] Starting task fetch...')

        const result = await listTasks()

        console.log('[TaskStream] Task fetch result:', {
          success: result.success,
          error: result.success ? null : result.error
        })

        // Handle API response failure
        if (!result.success) {
          console.error("Failed to fetch tasks:", result.error.message)
          console.error("Error code:", result.error.code)
          console.error("Error status:", result.error.status)

          // For other errors, continue with empty task list
          setInitialTasks([])
          return
        }

        // Success - set tasks from response data
        setInitialTasks(result.data.items)
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
        setInitialTasks([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [pathname, router])

  // Handle create task
  const handleCreate = async (taskData: TaskCreate) => {
    try {
      await createTask(taskData)
      setToastMessage("Task created successfully")
      // Modal will close automatically on success
    } catch (error) {
      // Error is already handled by optimistic hook
    }
  }

  // Handle update task
  const handleUpdate = async (taskData: TaskCreate | TaskUpdate) => {
    if (!editingTaskId) return
    try {
      // TaskForm in edit mode always provides TaskUpdate
      await updateTask(editingTaskId, taskData as TaskUpdate)
      setToastMessage("Task updated successfully")
      setEditingTaskId(null)
    } catch (error) {
      // Error is already handled by optimistic hook
    }
  }

  // Handle delete task
  const handleDelete = async (taskId: string) => {
    // Confirm before delete
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId)
        setToastMessage("Task deleted successfully")
      } catch (error) {
        // Error is already handled by optimistic hook
      }
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
              onToggle={() => toggleComplete(task.id)}
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
