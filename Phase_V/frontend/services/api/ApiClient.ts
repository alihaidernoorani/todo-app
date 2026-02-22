"use client"

import { authClient } from "@/lib/auth/better-auth-client"

/**
 * API Client for TaskFlow
 *
 * Provides type-safe API methods for:
 * - Task CRUD operations
 * - User authentication
 * - Real-time updates
 */

export const apiClient = {
  /**
   * Get current user session
   */
  getSession: async () => {
    try {
      const session = await authClient.getSession()
      return session
    } catch (error) {
      console.error("Failed to get session:", error)
      return null
    }
  },

  /**
   * List all tasks for current user
   */
  listTasks: async () => {
    try {
      // TODO: Implement actual API call when backend is ready
      // This is a mock implementation for now
      return {
        success: true,
        data: {
          items: [],
          total: 0,
          hasMore: false,
        },
      }
    } catch (error) {
      console.error("Failed to list tasks:", error)
      return {
        success: false,
        error: "Failed to fetch tasks",
      }
    }
  },

  /**
   * Create a new task
   */
  createTask: async (data: any) => {
    try {
      // TODO: Implement actual API call when backend is ready
      // This is a mock implementation for now
      return {
        success: true,
        data: {
          id: "temp-" + Date.now(),
          title: data.title,
          description: data.description || "",
          is_completed: false,
          priority: data.priority || "medium",
          due_date: data.due_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error("Failed to create task:", error)
      return {
        success: false,
        error: "Failed to create task",
      }
    }
  },

  /**
   * Update an existing task
   */
  updateTask: async (id: string, data: any) => {
    try {
      // TODO: Implement actual API call when backend is ready
      // This is a mock implementation for now
      return {
        success: true,
        data: {
          id,
          ...data,
          updated_at: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error("Failed to update task:", error)
      return {
        success: false,
        error: "Failed to update task",
      }
    }
  },

  /**
   * Toggle task completion status
   */
  toggleComplete: async (id: string) => {
    try {
      // TODO: Implement actual API call when backend is ready
      // This is a mock implementation for now
      return {
        success: true,
        data: {
          id,
          is_completed: true, // Toggle logic would be implemented
          updated_at: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error("Failed to toggle task:", error)
      return {
        success: false,
        error: "Failed to toggle task",
      }
    }
  },

  /**
   * Delete a task
   */
  deleteTask: async (id: string) => {
    try {
      // TODO: Implement actual API call when backend is ready
      // This is a mock implementation for now
      return {
        success: true,
        data: { id },
      }
    } catch (error) {
      console.error("Failed to delete task:", error)
      return {
        success: false,
        error: "Failed to delete task",
      }
    }
  },
}

// Type definitions for API responses
export interface Task {
  id: string
  title: string
  description?: string
  is_completed: boolean
  priority: "low" | "medium" | "high"
  due_date?: string | null
  created_at: string
  updated_at: string
}

export interface ListTasksResponse {
  success: boolean
  data?: {
    items: Task[]
    total: number
    hasMore: boolean
  }
  error?: string
}

export interface CreateTaskResponse {
  success: boolean
  data?: Task
  error?: string
}

export interface UpdateTaskResponse {
  success: boolean
  data?: Task
  error?: string
}

export interface ToggleTaskResponse {
  success: boolean
  data?: Task
  error?: string
}

export interface DeleteTaskResponse {
  success: boolean
  data?: { id: string }
  error?: string
}