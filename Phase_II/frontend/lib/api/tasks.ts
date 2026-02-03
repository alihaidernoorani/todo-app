/**
 * Task API Methods (Server Actions)
 *
 * Type-safe API client methods for task CRUD operations and metrics.
 * All methods are Server Actions that automatically:
 * - Extract user_id from JWT cookie
 * - Extract JWT token for Authorization header
 * - Make authenticated requests to backend API
 *
 * These must be called from client components using async functions.
 */

'use server'

import { getUserIdFromJWT, getJWTToken } from '../auth/jwt-utils'
import { AuthenticationError } from './errors'
import type {
  TaskCreate,
  TaskRead,
  TaskUpdate,
  TaskList,
  TaskMetrics,
} from './types'

/**
 * Internal helper to make authenticated API requests
 *
 * Returns null when not authenticated instead of throwing,
 * allowing components to handle gracefully and redirect.
 */
async function makeAuthenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Get user_id and JWT token from cookie
  const [userId, token] = await Promise.all([
    getUserIdFromJWT(),
    getJWTToken(),
  ])

  // Handle missing credentials gracefully
  if (!userId || !token) {
    throw new AuthenticationError('Not authenticated')
  }

  // Build full URL with user_id
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const url = `${baseURL}/api/${userId}${path}`

  // Merge headers with Authorization
  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  // Make request
  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    let errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}`

    // User-friendly error messages for specific status codes
    if (response.status === 403) {
      errorMessage = "Access denied. You can only access your own tasks."
    } else if (response.status === 401) {
      throw new AuthenticationError("Your session has expired. Please sign in again.")
    } else if (response.status === 404) {
      errorMessage = "Task not found or you don't have permission to access it."
    } else if (response.status === 422) {
      errorMessage = "Invalid task data. Please check your input."
    }

    throw new Error(errorMessage)
  }

  // Parse and return response
  return response.json()
}

/**
 * Create a new task
 * POST /api/{user_id}/tasks
 */
export async function createTask(taskData: TaskCreate): Promise<TaskRead> {
  return makeAuthenticatedRequest<TaskRead>('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  })
}

/**
 * List all tasks for the authenticated user
 * GET /api/{user_id}/tasks
 */
export async function listTasks(): Promise<TaskList> {
  return makeAuthenticatedRequest<TaskList>('/tasks', {
    method: 'GET',
  })
}

/**
 * Get a single task by ID
 * GET /api/{user_id}/tasks/{id}
 */
export async function getTask(taskId: string): Promise<TaskRead> {
  return makeAuthenticatedRequest<TaskRead>(`/tasks/${taskId}`, {
    method: 'GET',
  })
}

/**
 * Update a task (full replacement)
 * PUT /api/{user_id}/tasks/{id}
 */
export async function updateTask(
  taskId: string,
  updateData: TaskUpdate
): Promise<TaskRead> {
  return makeAuthenticatedRequest<TaskRead>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

/**
 * Toggle task completion status
 * PATCH /api/{user_id}/tasks/{id}/complete
 */
export async function toggleTaskComplete(taskId: string): Promise<TaskRead> {
  return makeAuthenticatedRequest<TaskRead>(`/tasks/${taskId}/complete`, {
    method: 'PATCH',
  })
}

/**
 * Delete a task
 * DELETE /api/{user_id}/tasks/{id}
 */
export async function deleteTask(taskId: string): Promise<TaskRead> {
  return makeAuthenticatedRequest<TaskRead>(`/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

/**
 * Get aggregated task metrics
 * GET /api/{user_id}/tasks/metrics
 */
export async function getTaskMetrics(): Promise<TaskMetrics> {
  return makeAuthenticatedRequest<TaskMetrics>('/tasks/metrics', {
    method: 'GET',
  })
}
