/**
 * Auth Utility Functions
 *
 * Handles JWT token generation and user_id retrieval for API authentication.
 *
 * IMPORTANT: This module bypasses Better Auth's auth.api.* calls because
 * they cause ETIMEDOUT errors in WSL2/certain environments. Instead, it:
 * - Reads session cookies directly
 * - Queries the database to validate sessions
 * - Signs JWT tokens manually with jsonwebtoken
 */

'use server'

import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

/**
 * Cookie name used by Better Auth
 */
const SESSION_COOKIE_NAME = 'better-auth.session_token'

/**
 * Shared database pool for direct session lookups
 */
let _pool: Pool | null = null

function getPool(): Pool | null {
  if (_pool) return _pool

  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!url) return null

  _pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false },
  })

  return _pool
}

/**
 * Look up user from session token by querying the database directly.
 * Bypasses auth.api.getSession() which causes ETIMEDOUT in WSL2.
 */
async function getUserFromSession(): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    // Extract plain token from signed cookie (format: token.signature)
    const plainToken = sessionCookie.value.split('.')[0]

    const pool = getPool()
    if (!pool) {
      console.error('[jwt-utils] No database connection available')
      return null
    }

    // Query session + user from database directly using plain token
    const result = await pool.query(
      `SELECT u.id, u.email, u.name
       FROM "session" s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1
       AND s."expiresAt" > NOW()
       LIMIT 1`,
      [plainToken]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('[jwt-utils] Failed to look up session:', error)
    return null
  }
}

/**
 * Extract user_id from session cookie
 *
 * Reads the session cookie and queries the database directly
 * to find the authenticated user's ID.
 *
 * @returns User ID string or null if not authenticated
 */
export async function getUserIdFromJWT(): Promise<string | null> {
  const user = await getUserFromSession()
  return user?.id || null
}

/**
 * Get user payload from session
 *
 * @returns User info or null if not authenticated
 */
export async function getJWTPayload(): Promise<{ user_id: string; email?: string; name?: string } | null> {
  const user = await getUserFromSession()
  if (!user) return null

  return {
    user_id: user.id,
    email: user.email,
    name: user.name,
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
 * Creates a signed JWT from the session cookie data.
 * Bypasses auth.api.getToken() which causes ETIMEDOUT.
 *
 * The JWT contains:
 * - sub: user_id
 * - email: user email
 * - Signed with HS256 using BETTER_AUTH_SECRET
 *
 * @returns JWT token string or null if not authenticated
 */
export async function getJWTToken(): Promise<string | null> {
  try {
    const user = await getUserFromSession()
    if (!user) {
      return null
    }

    const secret = process.env.BETTER_AUTH_SECRET
    if (!secret) {
      console.error('[jwt-utils] BETTER_AUTH_SECRET not set')
      return null
    }

    const issuer = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
    const audience = process.env.BETTER_AUTH_AUDIENCE || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    // Sign JWT manually
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret,
      {
        algorithm: 'HS256',
        expiresIn: '1h',
        issuer,
        audience,
      }
    )

    return token
  } catch (error) {
    console.error('[jwt-utils] Failed to generate JWT token:', error)
    return null
  }
}
