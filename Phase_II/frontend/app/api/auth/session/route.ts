/**
 * Better Auth Session Endpoint
 *
 * Custom endpoint to handle session requests at /api/auth/session
 * This endpoint is called by Better Auth React client's getSession() method.
 *
 * Proxies to Better Auth's get-session endpoint internally.
 */

import { getAuth } from "@/lib/auth/better-auth"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

export const runtime = "nodejs"

/**
 * GET /api/auth/session
 *
 * Returns the current user's session if authenticated, null otherwise.
 * Includes JWT access token when available.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = getAuth()

    if (!auth) {
      console.error('[Session Route] Auth not initialized!')
      return NextResponse.json(null, { status: 200 })
    }

    // Get session using Better Auth's server API
    const session = await auth.api.getSession({
      headers: await headers()
    })

    // Return session data (null if not authenticated)
    return NextResponse.json(session, { status: 200 })

  } catch (error) {
    console.error('[Session Route] Error fetching session:', error)
    return NextResponse.json(null, { status: 200 })
  }
}
