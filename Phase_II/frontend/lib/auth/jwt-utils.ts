/**
 * Auth Utility Functions
 *
 * Handles JWT token generation and user_id retrieval for API authentication.
 *
 * Two types of tokens:
 * 1. Session tokens (HttpOnly cookies) - for web session management
 * 2. JWT tokens - for backend API authentication with Bearer headers
 *
 * This module provides Server Actions to:
 * - Extract user_id from session cookies
 * - Generate JWT tokens for API calls
 * - Validate authentication state
 */

'use server'

import { cookies } from 'next/headers'
import { getAuth } from './better-auth'

/**
 * Cookie name used by Better Auth
 * Format: ${prefix}.session_token where prefix defaults to "better-auth"
 */
const SESSION_COOKIE_NAME = 'better-auth.session_token'

/**
 * Extract user_id from Better Auth session
 *
 * This is a Server Action that runs on the server to access HttpOnly cookies
 * and validate the session against the database.
 * Client components can call this function to get the authenticated user's ID.
 *
 * @returns User ID string or null if not authenticated
 */
export async function getUserIdFromJWT(): Promise<string | null> {
  try {
    const auth = getAuth()
    if (!auth) {
      console.warn('[jwt-utils] Auth not initialized')
      return null
    }

    // Read cookies from the request (server-side only)
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionToken || !sessionToken.value) {
      return null
    }

    // Use Better Auth to validate the session and get user info
    const session = await auth.api.getSession({
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken.value}`,
      },
    })

    if (!session || !session.user) {
      return null
    }

    // Return user id from the session
    return session.user.id || null
  } catch (error) {
    // Invalid or expired session
    console.error('[jwt-utils] Failed to get user from session:', error)
    return null
  }
}

/**
 * Get full session payload from Better Auth
 *
 * Useful for debugging or extracting additional user claims
 *
 * @returns Session with user info or null if not authenticated
 */
export async function getJWTPayload(): Promise<{ user_id: string; email?: string; name?: string } | null> {
  try {
    const auth = getAuth()
    if (!auth) {
      return null
    }

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionToken || !sessionToken.value) {
      return null
    }

    const session = await auth.api.getSession({
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken.value}`,
      },
    })

    if (!session || !session.user) {
      return null
    }

    return {
      user_id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    }
  } catch (error) {
    console.error('[jwt-utils] Failed to get session payload:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 *
 * @returns True if valid session exists, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getUserIdFromJWT()
  return userId !== null
}

/**
 * Generate a JWT token for API authentication
 *
 * This is a Server Action that:
 * 1. Validates the user's session from HttpOnly cookie
 * 2. Calls Better Auth's /api/auth/token endpoint to generate a JWT
 * 3. Returns the JWT token for use in Authorization Bearer headers
 *
 * The JWT contains user_id, email, and name claims and is signed with RS256.
 * Backend APIs can verify it using the JWKS endpoint at /api/auth/jwks
 *
 * @returns JWT token string or null if not authenticated
 */
export async function getJWTToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionToken || !sessionToken.value) {
      return null
    }

    // Call our custom JWT generation endpoint
    // Using custom endpoint since Better Auth's /token endpoint is not available in this version
    const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseURL}/api/generate-jwt`, {
      method: 'POST',
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken.value}`,
      },
    })

    if (!response.ok) {
      console.error('[jwt-utils] Token endpoint returned error:', response.status)
      return null
    }

    const result = await response.json()

    if (!result || !result.token) {
      return null
    }

    return result.token
  } catch (error) {
    console.error('[jwt-utils] Failed to generate JWT token:', error)
    return null
  }
}
