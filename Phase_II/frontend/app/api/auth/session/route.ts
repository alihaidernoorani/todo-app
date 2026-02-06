/**
 * Session Endpoint
 *
 * GET /api/auth/session - Returns current user session data.
 * Uses direct database query to avoid auth.api ETIMEDOUT issues.
 */

import { cookies } from "next/headers"
import { Pool } from "pg"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

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

export async function GET() {
  try {
    const cookieStore = await cookies()

    // Debug: log all cookie names
    const allCookies = cookieStore.getAll()
    console.log('[Session API] All cookies:', allCookies.map(c => c.name))

    const sessionCookie = cookieStore.get('better-auth.session_token')
    console.log('[Session API] Session cookie found:', !!sessionCookie?.value)

    if (!sessionCookie?.value) {
      console.log('[Session API] No session cookie - returning null')
      return NextResponse.json({ user: null, session: null })
    }

    // Extract plain token from signed cookie (format: token.signature)
    const signedToken = sessionCookie.value
    const plainToken = signedToken.split('.')[0]

    console.log('[Session API] Signed token length:', signedToken.length)
    console.log('[Session API] Plain token:', plainToken)
    console.log('[Session API] Plain token length:', plainToken.length)

    const pool = getPool()
    if (!pool) {
      console.error('[Session API] No database pool available')
      return NextResponse.json({ user: null, session: null })
    }

    // Query session + user directly from database using plain token
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u."emailVerified", u.image, u."createdAt",
              s.id as "sessionId", s."expiresAt"
       FROM "session" s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1
       AND s."expiresAt" > NOW()
       LIMIT 1`,
      [plainToken]
    )

    console.log('[Session API] DB query returned rows:', result.rows.length)

    if (result.rows.length === 0) {
      console.log('[Session API] No matching session in DB')
      return NextResponse.json({ user: null, session: null })
    }

    const row = result.rows[0]
    console.log('[Session API] Found user:', row.email)

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
