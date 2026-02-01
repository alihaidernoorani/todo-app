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
    const auth = getAuth()

    if (!auth) {
      return NextResponse.json(
        { error: "Auth not configured. Check database connection." },
        { status: 503 }
      )
    }

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
