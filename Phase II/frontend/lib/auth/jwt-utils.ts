/**
 * Auth Utility Functions
 *
 * Handles session token extraction and user_id retrieval from HttpOnly cookies.
 * Since HttpOnly cookies cannot be accessed directly from client-side JavaScript,
 * this module uses Next.js Server Actions to read cookies server-side.
 *
 * Better Auth stores sessions in the database - the session_token cookie
 * is a reference to the session, not a JWT.
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
 * Get the raw session token from HttpOnly cookie
 *
 * Used by ApiClient to inject Authorization Bearer header for backend API requests.
 * This is a Server Action that can only be called from server-side code.
 *
 * Note: For Better Auth, this returns the session token which the backend
 * can verify using the shared BETTER_AUTH_SECRET.
 *
 * @returns Session token string or null if not authenticated
 */
export async function getJWTToken(): Promise<string | null> {
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

    // Verify the session is still valid before returning the token
    const session = await auth.api.getSession({
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken.value}`,
      },
    })

    if (!session || !session.user) {
      return null
    }

    return sessionToken.value
  } catch (error) {
    console.error('[jwt-utils] Failed to get session token:', error)
    return null
  }
}
