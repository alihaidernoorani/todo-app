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
import {
  mapStatusToErrorCode,
  getUserFriendlyMessage,
  ERROR_CODES
} from './errors'
import type {
  TaskCreate,
  TaskRead,
  TaskUpdate,
  TaskList,
  TaskMetrics,
  ApiResponse,
} from './types'

/**
 * Internal helper to make authenticated API requests
 *
 * Returns structured ApiResponse for type-safe error handling.
 * No longer throws exceptions - all errors returned as ApiError objects.
 */
async function makeAuthenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get user_id and JWT token from cookie
    const [userId, token] = await Promise.all([
      getUserIdFromJWT(),
      getJWTToken(),
    ])

    // Handle missing credentials gracefully
    if (!userId || !token) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.AUTH_FAILED,
          message: 'Not authenticated. Please sign in to continue.',
          status: 401
        }
      }
    }

    // Build full URL with user_id
    // CRITICAL FIX: Use BACKEND_URL (server-only) instead of NEXT_PUBLIC_API_URL
    const baseURL = process.env.BACKEND_URL

    // Explicit check for missing BACKEND_URL
    if (!baseURL) {
      return {
        success: false,
        error: {
          code: ERROR_CODES.CONFIG_ERROR,
          message: 'Backend URL not configured. Please check environment variables.',
          status: 500
        }
      }
    }

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

    // Handle non-OK responses with structured errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      return {
        success: false,
        error: {
          code: mapStatusToErrorCode(response.status),
          message: getUserFriendlyMessage(response.status, errorData),
          status: response.status
        }
      }
    }

    // Parse and return successful response
    const data = await response.json()
    return { success: true, data }

  } catch (error) {
    // Network failures or other exceptions
    return {
      success: false,
      error: {
        code: ERROR_CODES.BACKEND_UNAVAILABLE,
        message: 'Unable to connect to the server. Please try again.',
        status: 503
      }
    }
  }
}

/**
 * Create a new task
 * POST /api/{user_id}/tasks
 */
export async function createTask(taskData: TaskCreate): Promise<ApiResponse<TaskRead>> {
  return makeAuthenticatedRequest<TaskRead>('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  })
}

/**
 * List all tasks for the authenticated user
 * GET /api/{user_id}/tasks
 */
export async function listTasks(): Promise<ApiResponse<TaskList>> {
  return makeAuthenticatedRequest<TaskList>('/tasks', {
    method: 'GET',
  })
}

/**
 * Get a single task by ID
 * GET /api/{user_id}/tasks/{id}
 */
export async function getTask(taskId: string): Promise<ApiResponse<TaskRead>> {
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
): Promise<ApiResponse<TaskRead>> {
  return makeAuthenticatedRequest<TaskRead>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

/**
 * Toggle task completion status
 * PATCH /api/{user_id}/tasks/{id}/complete
 */
export async function toggleTaskComplete(taskId: string): Promise<ApiResponse<TaskRead>> {
  return makeAuthenticatedRequest<TaskRead>(`/tasks/${taskId}/complete`, {
    method: 'PATCH',
  })
}

/**
 * Delete a task
 * DELETE /api/{user_id}/tasks/{id}
 */
export async function deleteTask(taskId: string): Promise<ApiResponse<void>> {
  return makeAuthenticatedRequest<void>(`/tasks/${taskId}`, {
    method: 'DELETE',
  })
}

/**
 * Get aggregated task metrics
 * GET /api/{user_id}/tasks/metrics
 */
export async function getTaskMetrics(): Promise<ApiResponse<TaskMetrics>> {
  return makeAuthenticatedRequest<TaskMetrics>('/tasks/metrics', {
    method: 'GET',
  })
}
