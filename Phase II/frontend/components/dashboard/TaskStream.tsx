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
import { AuthenticationError } from "@/lib/api/errors"
import { useOptimisticTask } from "@/lib/hooks/use-optimistic-task"
import { TaskItem } from "./TaskItem"
import { TaskForm } from "./TaskForm"
import { LuxuryButton } from "@/components/atoms/LuxuryButton"
import { EmptyState } from "./EmptyState"
import { TaskItemSkeleton } from "@/components/atoms/ShimmerSkeleton"
import type { TaskRead, TaskCreate, TaskUpdate } from "@/lib/api/types"

export function TaskStream() {
  const [initialTasks, setInitialTasks] = useState<TaskRead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
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
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { items } = await listTasks()
        setInitialTasks(items)
      } catch (error) {
        // Check if it's an authentication error
        if (error instanceof AuthenticationError) {
          console.error("Not authenticated, redirecting to sign-in:", error)
          // Redirect to sign-in with return URL
          const signInUrl = `/sign-in?from=${encodeURIComponent(pathname)}`
          router.push(signInUrl)
          return
        }

        console.error("Failed to fetch tasks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [pathname, router])

  // Handle create task
  const handleCreate = async (taskData: TaskCreate) => {
    await createTask(taskData)
    setShowCreateForm(false)
  }

  // Handle update task
  const handleUpdate = async (taskData: TaskCreate | TaskUpdate) => {
    if (!editingTaskId) return
    // TaskForm in edit mode always provides TaskUpdate
    await updateTask(editingTaskId, taskData as TaskUpdate)
    setEditingTaskId(null)
  }

  // Handle delete task
  const handleDelete = async (taskId: string) => {
    // Confirm before delete
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Empty state (no tasks and no create form showing)
  if (tasks.length === 0 && !showCreateForm) {
    return <EmptyState onCreateTask={() => setShowCreateForm(true)} />
  }

  return (
    <div className="space-y-4">
      {/* Create Task Button */}
      {!showCreateForm && !editingTaskId && (
        <div className="flex justify-end">
          <LuxuryButton
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Task
          </LuxuryButton>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <TaskForm
          mode="create"
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

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
      <motion.div layout className="space-y-3">
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
      {tasks.length === 0 && !showCreateForm && (
        <EmptyState onCreateTask={() => setShowCreateForm(true)} />
      )}
    </div>
  )
}
