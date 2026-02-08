/**
 * Task API Methods (Server Actions)
 *
 * Type-safe API client methods for task CRUD operations and metrics.
 * All methods are Server Actions that automatically:
 * - Get user_id from Better Auth session
 * - Obtain JWT token via /api/auth/token endpoint
 * - Make authenticated requests to backend API with Authorization header
 *
 * Authentication flow:
 * 1. Session validated via Better Auth cookies (getSession)
 * 2. JWT obtained via /api/auth/token HTTP endpoint
 * 3. Backend validates JWT signature (HS256/RS256)
 */

'use server'

import { headers } from 'next/headers'
import { auth } from '../auth/better-auth'
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
    const reqHeaders = await headers();

    // 1. Get Session for the User ID
    const session = await auth.api.getSession({
      headers: reqHeaders
    });

    const userId = session?.user?.id;

    if (!userId) {
      console.error("[API] No user ID in session");
      return {
        success: false,
        error: { code: ERROR_CODES.AUTH_FAILED, message: 'Not authenticated', status: 401 }
      };
    }

    // 2. Get JWT token via Better Auth /api/auth/token endpoint
    //    auth.api.getToken() is undocumented and unreliable server-side.
    //    The documented approach is to call the HTTP endpoint directly.
    let jwt: string | undefined;

    try {
      const authUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
      const cookie = reqHeaders.get('cookie') || '';

      const tokenRes = await fetch(`${authUrl}/api/auth/token`, {
        headers: { cookie },
        cache: 'no-store',
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        jwt = tokenData?.token;
      } else {
        console.error('[API] Token endpoint returned:', tokenRes.status);
      }
    } catch (tokenError) {
      console.error("[API] Failed to fetch JWT:", tokenError);
    }

    if (!jwt || !jwt.includes('.')) {
      console.error("[API] No valid JWT token received");
      return {
        success: false,
        error: { code: ERROR_CODES.AUTH_FAILED, message: 'Failed to get JWT token', status: 401 }
      };
    }

    // 3. Construct URL
    const baseURL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const url = `${baseURL}/api/${userId}${path}`;

    // 4. Set Headers
    const requestHeaders = new Headers(options.headers || {});
    requestHeaders.set('Content-Type', 'application/json');
    requestHeaders.set('Authorization', `Bearer ${jwt}`);

    const response = await fetch(url, {
      ...options,
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[API] Backend responded: ${response.status}`);
      return {
        success: false,
        error: {
          code: mapStatusToErrorCode(response.status),
          message: getUserFriendlyMessage(response.status, errorData),
          status: response.status
        }
      };
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    console.error(`[API] Connection Error:`, error);
    return {
      success: false,
      error: { code: ERROR_CODES.BACKEND_UNAVAILABLE, message: 'Server unreachable', status: 503 }
    };
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
