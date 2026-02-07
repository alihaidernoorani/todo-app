/**
 * API Client for Todo Application
 *
 * Centralized HTTP client with:
 * - Base URL configuration from environment
 * - Session cookie forwarding (credentials: 'include')
 * - User ID path interpolation
 * - 401 error interceptor for session expiry
 */

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
  if (error.status === 401 || error.message?.includes('401') || error.message?.includes('Session expired')) {
    return "Your session has expired. Please sign in again."
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
    // Read base URL from environment variable
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    // Remove trailing slash if present
    if (this.baseURL.endsWith('/')) {
      this.baseURL = this.baseURL.slice(0, -1)
    }
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
   * @returns Response object with data and ETag header
   */
  async request<T>(
    userId: string,
    path: string,
    options: RequestInit = {}
  ): Promise<{ data: T; etag?: string }> {
    const url = this.buildURL(userId, path)

    // Merge default headers with provided headers
    const headers = new Headers(options.headers || {})

    // Add Content-Type for JSON requests
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    // Session authentication is handled via cookies (credentials: 'include')
    // Backend validates session by calling Better Auth's /api/auth/session endpoint

    try {
      // Make request with credentials to include HttpOnly cookies
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies in cross-origin requests
      })

      // Handle 401 Unauthorized (session expired)
      if (response.status === 401) {
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
      // Re-throw with user-friendly message if not already mapped
      if (error instanceof Error) {
        // If error already has a friendly message (from status code handling), use it
        if (error.message.includes("Something went wrong") ||
            error.message.includes("Service temporarily") ||
            error.message.includes("session has expired") ||
            error.message.includes("don't have permission") ||
            error.message.includes("Unable to connect")) {
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
      const response = await fetch(url, {
        method: 'HEAD',
        credentials: 'include',
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
   */
  async get<T>(userId: string, path: string, includeEtag?: boolean): Promise<T | { data: T; etag?: string }> {
    const response = await this.request<T>(userId, path, { method: 'GET' })
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
   */
  async post<T>(userId: string, path: string, body?: unknown, includeEtag?: boolean): Promise<T | { data: T; etag?: string }> {
    const response = await this.request<T>(userId, path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
    return includeEtag ? response : response.data
  }

  /**
   * PUT request helper with optional If-Match header for conditional updates
   */
  async put<T>(userId: string, path: string, body?: unknown, ifMatch?: string, includeEtag?: boolean): Promise<T | { data: T; etag?: string }> {
    const headers: HeadersInit = {}
    if (ifMatch) {
      headers['If-Match'] = ifMatch
    }

    const response = await this.request<T>(userId, path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    })
    return includeEtag ? response : response.data
  }

  /**
   * PATCH request helper with optional If-Match header for conditional updates
   */
  async patch<T>(userId: string, path: string, body?: unknown, ifMatch?: string, includeEtag?: boolean): Promise<T | { data: T; etag?: string }> {
    const headers: HeadersInit = {}
    if (ifMatch) {
      headers['If-Match'] = ifMatch
    }

    const response = await this.request<T>(userId, path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    })
    return includeEtag ? response : response.data
  }

  /**
   * DELETE request helper with optional If-Match header for conditional deletes
   */
  async delete<T>(userId: string, path: string, ifMatch?: string, includeEtag?: boolean): Promise<T | { data: T; etag?: string }> {
    const headers: HeadersInit = {}
    if (ifMatch) {
      headers['If-Match'] = ifMatch
    }

    const response = await this.request<T>(userId, path, {
      method: 'DELETE',
      headers,
    })
    return includeEtag ? response : response.data
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
