/**
 * Optimistic Task Hook
 *
 * Wrapper around React 19's useOptimistic for task-specific operations.
 * Provides instant UI feedback for CRUD operations with automatic rollback on errors.
 *
 * Features:
 * - Optimistic create: Task appears instantly with pending state
 * - Optimistic toggle: Checkbox updates immediately
 * - Optimistic update: Changes visible before server confirmation
 * - Optimistic delete: Task fades out immediately
 * - Automatic rollback: Reverts on server error
 * - Error display: Shows inline error with retry button
 *
 * State Flow:
 * 1. User action triggers optimistic update
 * 2. Local state updates immediately (UI reflects change)
 * 3. Server Action called in background
 * 4. On success: State reconciled with server response
 * 5. On error: State rolled back + error displayed
 *
 * Usage:
 * ```tsx
 * const {
 *   tasks,
 *   createTask,
 *   toggleComplete,
 *   updateTask,
 *   deleteTask,
 * } = useOptimisticTask(initialTasks)
 *
 * <button onClick={() => createTask({ title: "New Task", ... })}>
 *   Create
 * </button>
 * ```
 */

"use client"

import { useOptimistic, useTransition } from "react"
import {
  createTask as apiCreateTask,
  toggleTaskComplete as apiToggleComplete,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
} from "@/lib/api/tasks"
import type { TaskRead, TaskCreate, TaskUpdate, OptimisticTask } from "@/lib/api/types"

type OptimisticAction =
  | { type: "CREATE"; task: OptimisticTask }
  | { type: "TOGGLE"; taskId: string }
  | { type: "UPDATE"; taskId: string; updates: Partial<OptimisticTask> }
  | { type: "DELETE"; taskId: string }
  | { type: "ERROR"; taskId: string; error: string; retryFn: () => Promise<void> }
  | { type: "CLEAR_ERROR"; taskId: string }

/**
 * Reducer function for optimistic state updates
 */
function optimisticReducer(
  state: OptimisticTask[],
  action: OptimisticAction
): OptimisticTask[] {
  switch (action.type) {
    case "CREATE":
      // Add new task to the beginning with optimistic flag
      return [action.task, ...state]

    case "TOGGLE":
      // Toggle completion status
      return state.map((task) =>
        task.id === action.taskId
          ? { ...task, is_completed: !task.is_completed, _optimistic: true }
          : task
      )

    case "UPDATE":
      // Apply partial updates
      return state.map((task) =>
        task.id === action.taskId
          ? { ...task, ...action.updates, _optimistic: true }
          : task
      )

    case "DELETE":
      // Remove task from list
      return state.filter((task) => task.id !== action.taskId)

    case "ERROR":
      // Mark task with error state
      return state.map((task) =>
        task.id === action.taskId
          ? {
              ...task,
              _error: action.error,
              _retryFn: action.retryFn,
              _optimistic: false,
            }
          : task
      )

    case "CLEAR_ERROR":
      // Clear error state
      return state.map((task) =>
        task.id === action.taskId
          ? { ...task, _error: null, _retryFn: null }
          : task
      )

    default:
      return state
  }
}

export function useOptimisticTask(initialTasks: TaskRead[]) {
  const [isPending, startTransition] = useTransition()
  const [optimisticTasks, updateOptimisticTasks] = useOptimistic(
    initialTasks as OptimisticTask[],
    optimisticReducer
  )

  /**
   * Create a new task with optimistic update
   */
  const createTask = async (taskData: TaskCreate) => {
    // Generate temporary ID for optimistic task
    const tempId = `temp-${Date.now()}`
    const optimisticTask: OptimisticTask = {
      id: tempId,
      title: taskData.title,
      description: taskData.description,
      is_completed: false,
      priority: taskData.priority || "Medium",
      created_at: new Date().toISOString(),
      user_id: "pending", // Will be replaced by server response
      _optimistic: true,
    }

    const retryFn = async () => {
      updateOptimisticTasks({ type: "CLEAR_ERROR", taskId: tempId })
      await createTask(taskData)
    }

    startTransition(() => {
      updateOptimisticTasks({ type: "CREATE", task: optimisticTask })
    })

    try {
      const createdTask = await apiCreateTask(taskData)

      // Replace optimistic task with real task
      startTransition(() => {
        updateOptimisticTasks({ type: "DELETE", taskId: tempId })
        updateOptimisticTasks({
          type: "CREATE",
          task: { ...createdTask, _optimistic: false },
        })
      })

      return createdTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create task"

      startTransition(() => {
        updateOptimisticTasks({
          type: "ERROR",
          taskId: tempId,
          error: errorMessage,
          retryFn,
        })
      })

      throw error
    }
  }

  /**
   * Toggle task completion with optimistic update
   */
  const toggleComplete = async (taskId: string) => {
    const retryFn = async () => {
      updateOptimisticTasks({ type: "CLEAR_ERROR", taskId })
      await toggleComplete(taskId)
    }

    startTransition(() => {
      updateOptimisticTasks({ type: "TOGGLE", taskId })
    })

    try {
      const updatedTask = await apiToggleComplete(taskId)

      // Reconcile with server response
      startTransition(() => {
        updateOptimisticTasks({
          type: "UPDATE",
          taskId,
          updates: { ...updatedTask, _optimistic: false },
        })
      })

      return updatedTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to toggle task"

      // Rollback optimistic update
      startTransition(() => {
        updateOptimisticTasks({ type: "TOGGLE", taskId }) // Toggle back
        updateOptimisticTasks({
          type: "ERROR",
          taskId,
          error: errorMessage,
          retryFn,
        })
      })

      throw error
    }
  }

  /**
   * Update task with optimistic update
   */
  const updateTask = async (taskId: string, updates: TaskUpdate) => {
    const retryFn = async () => {
      updateOptimisticTasks({ type: "CLEAR_ERROR", taskId })
      await updateTask(taskId, updates)
    }

    startTransition(() => {
      updateOptimisticTasks({ type: "UPDATE", taskId, updates })
    })

    try {
      const updatedTask = await apiUpdateTask(taskId, updates)

      // Reconcile with server response
      startTransition(() => {
        updateOptimisticTasks({
          type: "UPDATE",
          taskId,
          updates: { ...updatedTask, _optimistic: false },
        })
      })

      return updatedTask
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update task"

      startTransition(() => {
        updateOptimisticTasks({
          type: "ERROR",
          taskId,
          error: errorMessage,
          retryFn,
        })
      })

      throw error
    }
  }

  /**
   * Delete task with optimistic update
   */
  const deleteTask = async (taskId: string) => {
    // Store original task for rollback
    const originalTask = optimisticTasks.find((t) => t.id === taskId)
    if (!originalTask) return

    const retryFn = async () => {
      await deleteTask(taskId)
    }

    startTransition(() => {
      updateOptimisticTasks({ type: "DELETE", taskId })
    })

    try {
      await apiDeleteTask(taskId)
      // Success - task stays deleted
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete task"

      // Rollback - restore task with error
      startTransition(() => {
        updateOptimisticTasks({
          type: "CREATE",
          task: {
            ...originalTask,
            _error: errorMessage,
            _retryFn: retryFn,
            _optimistic: false,
          },
        })
      })

      throw error
    }
  }

  /**
   * Clear error for a specific task
   */
  const clearError = (taskId: string) => {
    startTransition(() => {
      updateOptimisticTasks({ type: "CLEAR_ERROR", taskId })
    })
  }

  return {
    tasks: optimisticTasks,
    isPending,
    createTask,
    toggleComplete,
    updateTask,
    deleteTask,
    clearError,
  }
}
