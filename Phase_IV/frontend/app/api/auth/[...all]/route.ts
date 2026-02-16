/**
 * Better Auth API Route Handler
 *
 * This catch-all route handles all Better Auth endpoints:
 * - POST /api/auth/sign-in - Email/password sign-in
 * - POST /api/auth/sign-up - User registration
 * - POST /api/auth/sign-out - Sign out and clear session
 * - GET /api/auth/session - Get current user session
 * - POST /api/auth/refresh - Refresh JWT token
 * - POST /api/auth/verify-email - Email verification (if enabled)
 *
 * The route automatically:
 * - Sets HttpOnly cookies with session tokens
 * - Handles CSRF protection
 * - Validates request signatures
 * - Manages session lifecycle
 */

import { getAuth } from "@/lib/auth/better-auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"

/**
 * Route Configuration
 *
 * This route is dynamic and matches all paths under /api/auth/*
 * Examples:
 * - /api/auth/sign-in → POST handler
 * - /api/auth/session → GET handler
 * - /api/auth/sign-out → POST handler
 */
export const runtime = "nodejs" // Use Node.js runtime (not Edge) for database access

/**
 * Create handlers with lazy auth initialization
 */
function createHandler(method: 'GET' | 'POST') {
  return async (request: NextRequest) => {
    console.log(`[API Route] ${method} ${request.nextUrl.pathname}`)

    const auth = getAuth()
    console.log('[API Route] Auth instance:', !!auth)

    if (!auth) {
      console.error('[API Route] Auth not initialized!')
      return NextResponse.json(
        { error: "Auth not configured. Check database connection." },
        { status: 503 }
      )
    }

    // Check if auth has the api object and JWT endpoints
    console.log('[API Route] Auth has api:', !!auth.api)
    const allEndpoints = Object.keys(auth.api || {})
    console.log('[API Route] Total endpoints:', allEndpoints.length)
    console.log('[API Route] JWT plugin check:')
    console.log('[API Route]   - getToken:', allEndpoints.includes('getToken'))
    console.log('[API Route]   - getJwks:', allEndpoints.includes('getJwks'))

    const handler = toNextJsHandler(auth)

    if (method === 'GET') {
      return handler.GET(request)
    } else {
      return handler.POST(request)
    }
  }
}

export const GET = createHandler('GET')
export const POST = createHandler('POST')
