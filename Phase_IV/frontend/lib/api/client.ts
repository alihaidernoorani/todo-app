/**
 * API Client for Todo Application
 *
 * Centralized HTTP client with:
 * - Base URL configuration from environment
 * - JWT token injection via Authorization header
 * - User ID path interpolation
 * - 401 error interceptor for token expiry
 * - Automatic token cleanup on authentication failures
 * - 3-second timeout for performance requirements
 */

import { TokenStorage } from '../auth/token-storage'

/**
 * Default timeout for API requests (2 seconds)
 * Optimistic updates make UI feel instant, but we keep timeout
 * reasonable to fail fast on slow networks
 */
export const DEFAULT_TIMEOUT = 2000

/**
 * Creates an AbortSignal that times out after specified duration
 *
 * @param timeoutMs - Timeout duration in milliseconds (default: 3000ms)
 * @returns AbortSignal that aborts after timeout
 *
 * @example
 * ```ts
 * const signal = createTimeoutSignal(3000)
 * await fetch(url, { signal })
 * ```
 */
export function createTimeoutSignal(timeoutMs: number = DEFAULT_TIMEOUT): AbortSignal {
  const controller = new AbortController()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  // Clean up timeout if request completes successfully
  controller.signal.addEventListener('abort', () => {
    clearTimeout(timeoutId)
  })

  return controller.signal
}

/**
 * Map HTTP error responses to user-friendly messages
 * @param error - Error object or status code
 * @returns User-friendly error message
 */
function mapErrorToFriendlyMessage(error: any): string {
  // Check for specific status codes
  if (error.status === 500 || error.message?.includes('500')) {
    return "Something went wrong on our end. Please try again."
  }
  if (error.status === 503 || error.message?.includes('503')) {
    return "Service temporarily unavailable. Please try again in a moment."
  }
  if (error.status === 401 || error.message?.includes('401') || error.message?.includes('expired') || error.message?.includes('Invalid token')) {
    return "Your authentication token has expired. Please sign in again."
  }
  if (error.status === 403 || error.message?.includes('403') || error.message?.includes('Access denied')) {
    return "You don't have permission to perform this action."
  }

  // Check for network errors
  if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('fetch')) {
    return "Unable to connect. Check your internet connection and try again."
  }

  // Check for timeout errors
  if (error.message?.includes('timeout')) {
    return "Request timed out. Please try again."
  }

  // Default fallback
  return error.message || "An unexpected error occurred. Please try again."
}

export class ApiClient {
  private baseURL: string

  constructor() {
    // Use the Next.js rewrite proxy so the browser never calls localhost:8000 directly.
    // /backend-proxy/* is rewritten server-side to http://backend:8000/* (internal k8s DNS).
    // The request() method builds: ${baseURL}/api/${userId}${path}
    this.baseURL = '/backend-proxy'
  }

  /**
   * Build full URL with user_id path interpolation
   * @param userId - Authenticated user's ID (from Better Auth session)
   * @param path - API endpoint path (e.g., '/tasks', '/tasks/123')
   * @returns Full URL string
   */
  private buildURL(userId: string, path: string): string {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    // Construct: baseURL/api/{user_id}{path}
    return `${this.baseURL}/api/${userId}${cleanPath}`
  }

  /**
   * Generic fetch wrapper with JWT injection and error handling
   * @param userId - Authenticated user's ID
   * @param path - API endpoint path
   * @param options - Fetch options (method, body, headers, etc.)
   * @param timeout - Timeout in milliseconds (default: 3000ms, pass 0 to disable)
   * @returns Response object with data and ETag header
   */
  async request<T>(
    userId: string,
    path: string,
    options: RequestInit = {},
    timeout: number = DEFAULT_TIMEOUT
  ): Promise<{ data: T; etag?: string }> {
    const url = this.buildURL(userId, path)

    // Merge default headers with provided headers
    const headers = new Headers(options.headers || {})

    // Add Content-Type for JSON requests
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    // Inject JWT token from localStorage into Authorization header
    const token = TokenStorage.getAccessToken()
    if (token && !TokenStorage.isExpired()) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    // Create timeout signal if timeout is enabled (timeout > 0)
    const timeoutSignal = timeout > 0 ? createTimeoutSignal(timeout) : undefined

    // Merge timeout signal with any existing signal
    const combinedSignal = options.signal || timeoutSignal

    try {
      // Make request with Authorization header and timeout (JWT-based authentication)
      const response = await fetch(url, {
        ...options,
        headers,
        signal: combinedSignal,
        // Note: credentials no longer needed for JWT-only authentication
        // Removed to comply with stateless architecture requirement
      })

      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        // Clear expired token from localStorage
        TokenStorage.clearAccessToken()

        // Trigger draft save and redirect to sign-in
        // This will be handled by the useDraftRecovery hook
        const event = new CustomEvent('session-expired')
        window.dispatchEvent(event)

        const error = new Error(mapErrorToFriendlyMessage({ status: 401 }))
        ;(error as any).status = 401
        throw error
      }

      // Handle 403 Forbidden (user_id mismatch)
      if (response.status === 403) {
        const error = new Error(mapErrorToFriendlyMessage({ status: 403 }))
        ;(error as any).status = 403
        throw error
      }

      // Handle 412 Precondition Failed (ETag mismatch for conditional requests)
      if (response.status === 412) {
        throw new Error('The resource has been modified by another user. Please refresh and try again.')
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const technicalMessage = errorData.detail || errorData.message || `HTTP ${response.status}`
        const friendlyMessage = mapErrorToFriendlyMessage({ status: response.status, message: technicalMessage })
        const error = new Error(friendlyMessage)
        ;(error as any).status = response.status
        ;(error as any).technicalMessage = technicalMessage
        throw error
      }

      // Parse JSON response
      const data = await response.json()

      // Extract ETag header for concurrent update detection
      const etag = response.headers.get('ETag') || undefined

      return { data: data as T, etag }
    } catch (error) {
      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error(`Request timed out after ${timeout}ms. Please try again.`)
        ;(timeoutError as any).isTimeout = true
        ;(timeoutError as any).timeout = timeout
        throw timeoutError
      }

      // Re-throw with user-friendly message if not already mapped
      if (error instanceof Error) {
        // If error already has a friendly message (from status code handling), use it
        if (error.message.includes("Something went wrong") ||
            error.message.includes("Service temporarily") ||
            error.message.includes("session has expired") ||
            error.message.includes("don't have permission") ||
            error.message.includes("Unable to connect") ||
            error.message.includes("timed out")) {
          throw error
        }
        // Otherwise, map it to a friendly message
        const friendlyError = new Error(mapErrorToFriendlyMessage(error))
        ;(friendlyError as any).originalError = error
        throw friendlyError
      }
      throw new Error(mapErrorToFriendlyMessage({}))
    }
  }

  /**
   * HEAD request helper for checking resource state without downloading body
   * Useful for concurrent update detection via ETag
   */
  async head(userId: string, path: string): Promise<{ etag?: string; lastModified?: string }> {
    const url = this.buildURL(userId, path)

    try {
      // Add JWT token to HEAD requests as well
      const token = TokenStorage.getAccessToken()
      const headers: HeadersInit = {}
      if (token && !TokenStorage.isExpired()) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        method: 'HEAD',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return {
        etag: response.headers.get('ETag') || undefined,
        lastModified: response.headers.get('Last-Modified') || undefined,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  /**
   * GET request helper
   * @param includeEtag - If true, return full response with ETag; if false, return data only (default: false for backward compatibility)
   * @param timeout - Timeout in milliseconds (default: 3000ms)
   */
  async get<T>(userId: string, path: string, includeEtag?: boolean, timeout?: number): Promise<T | { data: T; etag?: string }> {
    const response = await this.request<T>(userId, path, { method: 'GET' }, timeout)
    return includeEtag ? response : response.data
  }

  /**
   * GET request with conditional request support (If-None-Match header)
   * Returns 304 Not Modified if ETag matches, otherwise returns updated data with new ETag
   */
  async getWithEtag<T>(userId: string, path: string, ifNoneMatch?: string): Promise<{ data: T; etag?: string; notModified?: boolean }> {
    const headers: HeadersInit = {}
    if (ifNoneMatch) {
      headers['If-None-Match'] = ifNoneMatch
    }

    try {
      const response = await this.request<T>(userId, path, {
        method: 'GET',
        headers,
      })
      return { ...response, notModified: false }
    } catch (error) {
      // 304 Not Modified is not an error for conditional requests
      if (error instanceof Error && error.message.includes('304')) {
        return { data: null as T, notModified: true }
      }
      throw error
    }
  }

  /**
   * POST request helper
   * @param timeout - Timeout in milliseconds (default: 3000ms)
   */
  async post<T>(userId: string, path: string, body?: unknown, includeEtag?: boolean, timeout?: number): Promise<T | { data: T; etag?: string }> {
    const response = await this.request<T>(userId, path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }, timeout)
    return includeEtag ? response : response.data
  }

  /**
   * PUT request helper with optional If-Match header for conditional updates
   * @param timeout - Timeout in milliseconds (default: 3000ms)
   */
  async put<T>(userId: string, path: string, body?: unknown, ifMatch?: string, includeEtag?: boolean, timeout?: number): Promise<T | { data: T; etag?: string }> {
    const headers: HeadersInit = {}
    if (ifMatch) {
      headers['If-Match'] = ifMatch
    }

    const response = await this.request<T>(userId, path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }, timeout)
    return includeEtag ? response : response.data
  }

  /**
   * PATCH request helper with optional If-Match header for conditional updates
   * @param timeout - Timeout in milliseconds (default: 3000ms)
   */
  async patch<T>(userId: string, path: string, body?: unknown, ifMatch?: string, includeEtag?: boolean, timeout?: number): Promise<T | { data: T; etag?: string }> {
    const headers: HeadersInit = {}
    if (ifMatch) {
      headers['If-Match'] = ifMatch
    }

    const response = await this.request<T>(userId, path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    }, timeout)
    return includeEtag ? response : response.data
  }

  /**
   * DELETE request helper with optional If-Match header for conditional deletes
   * @param timeout - Timeout in milliseconds (default: 3000ms)
   */
  async delete<T>(userId: string, path: string, ifMatch?: string, includeEtag?: boolean, timeout?: number): Promise<T | { data: T; etag?: string }> {
    const headers: HeadersInit = {}
    if (ifMatch) {
      headers['If-Match'] = ifMatch
    }

    const response = await this.request<T>(userId, path, {
      method: 'DELETE',
      headers,
    }, timeout)
    return includeEtag ? response : response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
