/**
 * Error Handling Utilities for API Responses
 *
 * Provides helper functions for mapping HTTP status codes to error codes
 * and user-friendly messages per FR-026 and FR-027 from spec clarifications.
 *
 * Also includes legacy AuthenticationError class for backwards compatibility.
 */

// ============================================================================
// ERROR CODE CONSTANTS
// ============================================================================

export const ERROR_CODES = {
  AUTH_FAILED: 'AUTH_FAILED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BACKEND_UNAVAILABLE: 'BACKEND_UNAVAILABLE',
  CONFIG_ERROR: 'CONFIG_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// ============================================================================
// ERROR MAPPING FUNCTIONS
// ============================================================================

/**
 * Map HTTP status code to programmatic error code
 *
 * Used for conditional error handling in components:
 * - AUTH_FAILED → Redirect to login
 * - BACKEND_UNAVAILABLE → Show retry button
 * - VALIDATION_ERROR → Show form validation errors
 *
 * @param status - HTTP status code from backend response
 * @returns Error code string for programmatic handling
 *
 * @example
 * ```typescript
 * const code = mapStatusToErrorCode(401) // Returns "AUTH_FAILED"
 * if (code === ERROR_CODES.AUTH_FAILED) {
 *   redirect('/login')
 * }
 * ```
 */
export function mapStatusToErrorCode(status: number): ErrorCode {
  const codeMap: Record<number, ErrorCode> = {
    401: ERROR_CODES.AUTH_FAILED,
    403: ERROR_CODES.ACCESS_DENIED,
    404: ERROR_CODES.NOT_FOUND,
    422: ERROR_CODES.VALIDATION_ERROR,
    503: ERROR_CODES.BACKEND_UNAVAILABLE,
  }

  return codeMap[status] || ERROR_CODES.UNKNOWN_ERROR
}

/**
 * Get user-friendly error message for display in UI
 *
 * Transforms backend errors and HTTP status codes into
 * actionable messages that help users understand what went wrong.
 *
 * @param status - HTTP status code from backend response
 * @param errorData - Optional error data from backend (may contain 'detail' field)
 * @returns User-friendly error message for display
 *
 * @example
 * ```typescript
 * const message = getUserFriendlyMessage(401, { detail: "Invalid token" })
 * // Returns: "Your session has expired. Please sign in again."
 * setErrorMessage(message)
 * ```
 */
export function getUserFriendlyMessage(status: number, errorData: any = {}): string {
  const messages: Record<number, string> = {
    401: 'Your session has expired. Please sign in again.',
    403: 'Access denied. You can only access your own tasks.',
    404: "Task not found or you don't have permission to access it.",
    422: 'Invalid task data. Please check your input.',
    503: 'Service temporarily unavailable. Please try again later.',
  }

  // Use backend error detail if available, otherwise use status-based message
  return errorData.detail || messages[status] || `Error: HTTP ${status}`
}

/**
 * Check if an error should trigger a retry button
 *
 * Transient errors (network failures, service unavailable) should
 * show a retry button, while permanent errors (not found, validation)
 * should not.
 *
 * @param errorCode - Error code from ApiError
 * @returns True if a retry button should be shown
 *
 * @example
 * ```typescript
 * if (shouldShowRetry(result.error.code)) {
 *   <Button onClick={retry}>Retry</Button>
 * }
 * ```
 */
export function shouldShowRetry(errorCode: ErrorCode): boolean {
  const retriableErrors: ErrorCode[] = [
    ERROR_CODES.BACKEND_UNAVAILABLE,
    ERROR_CODES.UNKNOWN_ERROR,
  ]

  return retriableErrors.includes(errorCode)
}

/**
 * Check if an error should redirect to login
 *
 * Authentication failures require user re-authentication.
 *
 * @param errorCode - Error code from ApiError
 * @returns True if should redirect to login
 *
 * @example
 * ```typescript
 * if (shouldRedirectToLogin(result.error.code)) {
 *   router.push('/login')
 * }
 * ```
 */
export function shouldRedirectToLogin(errorCode: ErrorCode): boolean {
  return errorCode === ERROR_CODES.AUTH_FAILED
}

// ============================================================================
// LEGACY ERROR CLASSES (Keep for backwards compatibility)
// ============================================================================

/**
 * Authentication error type
 * Used to distinguish auth errors from other API errors
 * @deprecated Use ApiError with AUTH_FAILED code instead
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Not authenticated') {
    super(message)
    this.name = 'AuthenticationError'
  }
}
