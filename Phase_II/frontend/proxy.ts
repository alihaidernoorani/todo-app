/**
 * Next.js Middleware for Route Protection
 *
 * This middleware runs on the Edge runtime and protects authenticated routes.
 * It intercepts all requests and:
 * 1. Checks for valid Better Auth session cookie
 * 2. Redirects unauthenticated users to /login
 * 3. Allows authenticated users to proceed
 *
 * Protected routes:
 * - /dashboard/* - Main application routes
 * - /api/* (except /api/auth/*) - API endpoints
 *
 * Public routes:
 * - / - Landing page
 * - /login - Authentication page
 * - /signup - Registration page
 * - /api/auth/* - Better Auth endpoints
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Better Auth session cookie name
 * This is the cookie Better Auth uses to store session tokens
 */
const SESSION_COOKIE_NAME = "better-auth.session_token"

/**
 * Middleware function
 *
 * Runs on every request to check authentication status.
 * Uses Edge runtime for fast response times.
 *
 * Note: This middleware only checks if a session cookie exists.
 * Actual session validation happens at the page level via Better Auth's session API.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get Better Auth session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/api/auth", // Better Auth endpoints
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if user has a session cookie
  // Note: We don't validate the session here - that happens at the page level
  // This middleware just checks for cookie existence to quickly redirect unauthenticated users
  if (!sessionCookie || !sessionCookie.value) {
    // No session cookie - redirect to login page with return URL
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname) // Remember where user was trying to go
    return NextResponse.redirect(loginUrl)
  }

  // Session cookie exists - allow request to proceed
  // Actual session validation will happen at the page level
  return NextResponse.next()
}

/**
 * Middleware configuration
 *
 * Specify which routes this middleware should run on.
 * We want to protect all routes except static assets.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
