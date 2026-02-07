/**
 * Session Endpoint
 *
 * GET /api/auth/session - Returns current user session data.
 * Uses direct database query to avoid auth.api ETIMEDOUT issues.
 */

import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPool } from "@/lib/db/pool"

export const runtime = "nodejs"

export async function GET() {
  try {
    const cookieStore = await cookies()

    // Debug: log all cookie names
    const allCookies = cookieStore.getAll()
    console.log('[Session API] All cookies:', allCookies.map(c => ({ name: c.name, valueLength: c.value.length })))

    // Try multiple possible cookie names
    const possibleCookieNames = [
      'better-auth.session_token',
      'better_auth.session_token',
      'session_token',
      'auth_session',
      'better-auth.session',
    ]

    let sessionCookie = null
    let cookieName = null

    for (const name of possibleCookieNames) {
      const cookie = cookieStore.get(name)
      if (cookie?.value) {
        sessionCookie = cookie
        cookieName = name
        break
      }
    }

    console.log('[Session API] Found session cookie:', cookieName)
    console.log('[Session API] Session cookie exists:', !!sessionCookie?.value)

    if (!sessionCookie?.value) {
      console.log('[Session API] No session cookie found - returning null')
      return NextResponse.json({ user: null, session: null })
    }

    const pool = getPool()
    if (!pool) {
      console.error('[Session API] No database pool available')
      return NextResponse.json({ user: null, session: null })
    }

    // The cookie value might be:
    // 1. Just the token: "abc123..."
    // 2. Signed format: "token.signature"
    // 3. Base64 encoded

    const cookieValue = sessionCookie.value
    console.log('[Session API] Cookie value length:', cookieValue.length)
    console.log('[Session API] Cookie value preview:', cookieValue.substring(0, 20) + '...')

    // Try to extract token - handle different formats
    let plainToken = cookieValue

    // If it has a dot and second part looks like signature, split it
    if (cookieValue.includes('.')) {
      const parts = cookieValue.split('.')
      // If there are exactly 2 parts and the second is long (signature), use first part
      if (parts.length === 2 && parts[1].length > 20) {
        plainToken = parts[0]
        console.log('[Session API] Extracted token from signed cookie')
      }
    }

    console.log('[Session API] Plain token length:', plainToken.length)

    // Try query with the plain token
    let result = await pool.query(
      `SELECT u.id, u.email, u.name, u."emailVerified", u.image, u."createdAt",
              s.id as "sessionId", s."expiresAt", s.token as "sessionToken"
       FROM "session" s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1
       AND s."expiresAt" > NOW()
       LIMIT 1`,
      [plainToken]
    )

    console.log('[Session API] DB query with plain token returned rows:', result.rows.length)

    // If no results, try with the full cookie value
    if (result.rows.length === 0 && plainToken !== cookieValue) {
      console.log('[Session API] Trying query with full cookie value')
      result = await pool.query(
        `SELECT u.id, u.email, u.name, u."emailVerified", u.image, u."createdAt",
                s.id as "sessionId", s."expiresAt", s.token as "sessionToken"
         FROM "session" s
         JOIN "user" u ON s."userId" = u.id
         WHERE s.token = $1
         AND s."expiresAt" > NOW()
         LIMIT 1`,
        [cookieValue]
      )
      console.log('[Session API] DB query with full value returned rows:', result.rows.length)
    }

    // If still no results, log what tokens exist in the database
    if (result.rows.length === 0) {
      const allSessions = await pool.query(
        `SELECT s.token, s."expiresAt", s."userId"
         FROM "session" s
         WHERE s."expiresAt" > NOW()
         LIMIT 5`
      )
      console.log('[Session API] Active sessions in DB:', allSessions.rows.map(r => ({
        tokenPreview: r.token.substring(0, 20) + '...',
        tokenLength: r.token.length,
        expiresAt: r.expiresAt,
        userId: r.userId
      })))
      console.log('[Session API] No matching session found in DB')
      return NextResponse.json({ user: null, session: null })
    }

    const row = result.rows[0]
    console.log('[Session API] Found user:', row.email)
    console.log('[Session API] Session token from DB preview:', row.sessionToken.substring(0, 20) + '...')

    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        emailVerified: row.emailVerified,
        image: row.image,
        createdAt: row.createdAt,
      },
      session: {
        id: row.sessionId,
        expiresAt: row.expiresAt,
      }
    })
  } catch (error) {
    console.error('[Session API] Failed to get session:', error)
    return NextResponse.json({ user: null, session: null })
  }
}
