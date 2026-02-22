/**
 * TypeScript Type Definitions for Modern UI/UX Dashboard
 *
 * These types match the backend Pydantic schemas exactly to ensure type-safe
 * frontend-backend communication. DO NOT modify these types without updating
 * the corresponding backend schemas.
 *
 * Source: backend/src/schemas/task.py
 * OpenAPI Spec: specs/004-modern-ui-ux-dashboard/contracts/task-api.yaml
 */

import type { ErrorCode } from './errors'

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Task priority levels
 * Must match backend validation (High, Medium, Low only)
 */
export type TaskPriority = "High" | "Medium" | "Low"

// ============================================================================
// REQUEST SCHEMAS (Client → Backend)
// ============================================================================

/**
 * Schema for creating a new task
 * POST /api/{user_id}/tasks
 *
 * @example
 * ```typescript
 * const taskData: TaskCreate = {
 *   title: "Complete project documentation",
 *   description: "Write comprehensive docs for API endpoints",
 *   priority: "High"
 * }
 * ```
 */
export interface TaskCreate {
  /** Task title (required, 1-255 characters) */
  title: string

  /** Optional task description (max 2000 characters) */
  description: string | null

  /** Task priority level (defaults to "Medium" if not provided) */
  priority?: TaskPriority
}

/**
 * Schema for updating a task (PUT semantics - full replacement)
 * PUT /api/{user_id}/tasks/{id}
 *
 * All fields are required for PUT operations. Use PATCH endpoints for partial updates.
 *
 * @example
 * ```typescript
 * const updateData: TaskUpdate = {
 *   title: "Updated task title",
 *   description: "Updated description",
 *   is_completed: true,
 *   priority: "Low"
 * }
 * ```
 */
export interface TaskUpdate {
  /** Task title (required, 1-255 characters) */
  title: string

  /** Optional task description (max 2000 characters) */
  description: string | null

  /** Task completion status (required for PUT) */
  is_completed: boolean

  /** Task priority level (required for PUT) */
  priority: TaskPriority
}

// ============================================================================
// RESPONSE SCHEMAS (Backend → Client)
// ============================================================================

/**
 * Schema for reading a single task
 * Response from GET /api/{user_id}/tasks/{id}, POST, PUT, PATCH
 *
 * @example
 * ```typescript
 * const task: TaskRead = {
 *   id: "987fcdeb-51a2-43d1-b789-0123456789ab",
 *   title: "Complete project documentation",
 *   description: "Write comprehensive docs",
 *   is_completed: false,
 *   priority: "High",
 *   created_at: "2026-01-25T14:30:00Z",
 *   user_id: "123e4567-e89b-12d3-a456-426614174000"
 * }
 * ```
 */
export interface TaskRead {
  /** Unique task identifier (UUID) */
  id: string

  /** Task title */
  title: string

  /** Task description (null if not provided) */
  description: string | null

  /** Task completion status */
  is_completed: boolean

  /** Task priority level */
  priority: TaskPriority

  /** ISO 8601 timestamp of task creation (UTC) */
  created_at: string

  /** UUID of the user who owns this task */
  user_id: string
}

/**
 * Schema for listing multiple tasks
 * Response from GET /api/{user_id}/tasks
 *
 * @example
 * ```typescript
 * const taskList: TaskList = {
 *   items: [
 *     { id: "...", title: "Task 1", ... },
 *     { id: "...", title: "Task 2", ... }
 *   ],
 *   count: 2
 * }
 * ```
 */
export interface TaskList {
  /** Array of task objects */
  items: TaskRead[]

  /** Total number of tasks returned */
  count: number
}

/**
 * Schema for aggregated task statistics
 * Response from GET /api/{user_id}/tasks/metrics
 *
 * All counts are computed server-side from the tasks table.
 *
 * @example
 * ```typescript
 * const metrics: TaskMetrics = {
 *   total: 50,
 *   completed: 30,
 *   pending: 20,
 *   overdue: 5,
 *   high_priority: 12,
 *   medium_priority: 28,
 *   low_priority: 10
 * }
 * ```
 */
export interface TaskMetrics {
  /** Total number of tasks for the user */
  total: number

  /** Number of completed tasks (is_completed = true) */
  completed: number

  /** Number of pending tasks (is_completed = false) */
  pending: number

  /** Number of overdue tasks (due_date < now AND is_completed = false) */
  overdue: number

  /** Number of high-priority tasks */
  high_priority: number

  /** Number of medium-priority tasks */
  medium_priority: number

  /** Number of low-priority tasks */
  low_priority: number
}

// ============================================================================
// FRONTEND-ONLY TYPES (Not in Backend Schema)
// ============================================================================

/**
 * Extended TaskRead with optimistic update metadata
 * Used by useOptimistic hook for instant UI feedback
 *
 * @example
 * ```typescript
 * const optimisticTask: OptimisticTask = {
 *   ...taskData,
 *   _optimistic: true,      // Task not yet confirmed by server
 *   _error: null,           // No error
 *   _retryFn: null          // No retry function
 * }
 * ```
 */
export interface OptimisticTask extends TaskRead {
  /**
   * True if this task is an optimistic update not yet confirmed by the server
   * False or undefined if the task exists in the database
   */
  _optimistic?: boolean

  /**
   * Error message if the optimistic mutation failed
   * Displayed inline below the affected task with a retry button
   */
  _error?: string | null

  /**
   * Function to retry the failed mutation
   * Called when user clicks the inline "Retry" button
   */
  _retryFn?: (() => Promise<void>) | null
}

/**
 * Draft task state saved to localStorage during session expiry
 * Restored after user re-authenticates
 *
 * @example
 * ```typescript
 * const draft: DraftTask = {
 *   title: "Incomplete task title",
 *   description: "Partial description",
 *   priority: "Medium",
 *   timestamp: 1738164000000  // Date.now()
 * }
 * // Saved to: localStorage.setItem(`draft-task-${userId}`, JSON.stringify(draft))
 * ```
 */
export interface DraftTask {
  /** Draft task title */
  title: string

  /** Draft task description */
  description: string | null

  /** Draft task priority */
  priority: TaskPriority

  /** Unix timestamp (milliseconds) when draft was saved */
  timestamp: number
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

/**
 * Standard error response from backend
 * Used for 400, 401, 403, 404 responses
 *
 * @example
 * ```typescript
 * const error: ErrorResponse = {
 *   detail: "Task not found"
 * }
 * ```
 */
export interface ErrorResponse {
  /** Human-readable error message */
  detail: string
}

/**
 * Validation error response from backend (422 Unprocessable Entity)
 * Contains field-level validation errors
 *
 * @example
 * ```typescript
 * const validationError: ValidationErrorResponse = {
 *   detail: [
 *     {
 *       loc: ["body", "title"],
 *       msg: "Field required",
 *       type: "value_error.missing"
 *     },
 *     {
 *       loc: ["body", "priority"],
 *       msg: "value is not a valid enumeration member",
 *       type: "type_error.enum"
 *     }
 *   ]
 * }
 * ```
 */
export interface ValidationErrorResponse {
  detail: Array<{
    /** Location of the validation error (field path) */
    loc: string[]

    /** Validation error message */
    msg: string

    /** Error type identifier */
    type: string
  }>
}

// ============================================================================
// AUTH TYPES (Better Auth JWT)
// ============================================================================

/**
 * JWT payload structure from Better Auth
 * Extracted from Better Auth session data
 *
 * @example
 * ```typescript
 * const payload: JWTPayload = {
 *   user_id: "123e4567-e89b-12d3-a456-426614174000",
 *   email: "user@example.com",
 *   exp: 1738164000,
 *   iat: 1738077600
 * }
 * ```
 */
export interface JWTPayload {
  /** User ID (UUID) - used for API path construction */
  user_id: string

  /** User email address */
  email: string

  /** Token expiration timestamp (Unix seconds) */
  exp: number

  /** Token issued at timestamp (Unix seconds) */
  iat?: number

  /** Optional: User display name */
  name?: string

  /** Optional: User roles for RBAC */
  roles?: string[]
}

/**
 * User session data from Better Auth
 * Response from GET /api/auth/session
 *
 * @example
 * ```typescript
 * const session: SessionData = {
 *   user: {
 *     id: "123e4567-e89b-12d3-a456-426614174000",
 *     email: "user@example.com",
 *     name: "John Doe"
 *   },
 *   session: {
 *     expires_at: "2026-01-25T15:45:00Z"
 *   }
 * }
 * ```
 */
export interface SessionData {
  user: {
    id: string
    email: string
    name?: string
  }
  session: {
    expires_at: string  // ISO 8601 timestamp
  }
}

// ============================================================================
// TYPE GUARDS (Runtime Type Checking)
// ============================================================================

/**
 * Type guard to check if a response is an error
 *
 * @example
 * ```typescript
 * const response = await fetch(...)
 * const data = await response.json()
 * if (isErrorResponse(data)) {
 *   console.error(data.detail)
 * }
 * ```
 */
export function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof (data as ErrorResponse).detail === "string"
  )
}

/**
 * Type guard to check if a response is a validation error
 *
 * @example
 * ```typescript
 * if (isValidationErrorResponse(data)) {
 *   data.detail.forEach(err => {
 *     console.error(`${err.loc.join(".")}: ${err.msg}`)
 *   })
 * }
 * ```
 */
export function isValidationErrorResponse(
  data: unknown
): data is ValidationErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    Array.isArray((data as ValidationErrorResponse).detail)
  )
}

/**
 * Type guard to check if a task is optimistic (not yet saved)
 *
 * @example
 * ```typescript
 * if (isOptimisticTask(task)) {
 *   // Show pending indicator
 * }
 * ```
 */
export function isOptimisticTask(task: TaskRead): task is OptimisticTask {
  return "_optimistic" in task && task._optimistic === true
}

// ============================================================================
// PHASE V: TASK FILTERS (T062)
// ============================================================================

/**
 * Filter parameters for GET /api/{user_id}/tasks (T062)
 * All fields are optional — omitted fields return all results.
 */
export interface TaskFilters {
  /** "pending" | "completed" | undefined (all) */
  status?: TaskStatus

  /** "High" | "Medium" | "Low" | undefined */
  priority?: TaskPriority

  /** Filter by one or more tag names (AND semantics) */
  tags?: string[]

  /** Full-text search in title + description */
  search?: string

  /** Sort column: "created_at" | "priority" | "title" */
  sort_by?: "created_at" | "priority" | "title"

  /** Sort direction: "asc" | "desc" */
  sort_order?: "asc" | "desc"

  /** 1-based page number */
  page?: number

  /** Results per page (1–200) */
  page_size?: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract all task statuses as a union type
 */
export type TaskStatus = "pending" | "completed"

/**
 * Partial update for task (PATCH semantics - not currently used by backend)
 * Useful for future partial update endpoints
 */
export type TaskPartialUpdate = Partial<Omit<TaskUpdate, "user_id" | "id">>

/**
 * Task with all computed fields (for display purposes)
 */
export interface TaskWithMetadata extends TaskRead {
  /** Days until due date (negative if overdue, null if no due date) */
  daysUntilDue?: number | null

  /** Human-readable relative time ("2 days ago", "in 5 hours") */
  relativeTime?: string

  /** Priority badge color (for UI rendering) */
  priorityColor?: "red" | "yellow" | "blue"
}

// ============================================================================
// API CLIENT TYPES
// ============================================================================

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  /** Base URL for the API (e.g., http://localhost:8000) */
  baseUrl: string

  /** Function to get the current user ID (from JWT) */
  getUserId: () => Promise<string | null>

  /** Optional: Custom error handler */
  onError?: (error: Error) => void

  /** Optional: Custom unauthorized handler (401 response) */
  onUnauthorized?: () => void
}

/**
 * Structured error response for type-safe error handling
 * Per FR-026 and FR-027 from spec clarifications
 *
 * @example
 * ```typescript
 * const error: ApiError = {
 *   success: false,
 *   error: {
 *     code: "AUTH_FAILED",
 *     message: "Your session has expired. Please sign in again.",
 *     status: 401
 *   }
 * }
 * ```
 */
export interface ApiError {
  success: false
  error: {
    /** Error code for programmatic handling (e.g., "BACKEND_UNAVAILABLE", "AUTH_FAILED") */
    code: ErrorCode

    /** User-friendly error message for display */
    message: string

    /** HTTP status code (optional) */
    status?: number
  }
}

/**
 * Successful API response wrapper
 *
 * @example
 * ```typescript
 * const success: ApiSuccess<TaskRead> = {
 *   success: true,
 *   data: { id: "...", title: "...", ... }
 * }
 * ```
 */
export interface ApiSuccess<T> {
  success: true
  data: T
}

/**
 * API response wrapper for consistent error handling
 * All server actions return this type for type-safe error handling
 *
 * @example
 * ```typescript
 * const result = await createTask(taskData)
 * if (!result.success) {
 *   // Handle error
 *   console.error(result.error.message)
 *   if (result.error.code === 'BACKEND_UNAVAILABLE') {
 *     showRetryButton()
 *   }
 *   return
 * }
 * // Use data
 * const task = result.data
 * ```
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiError
