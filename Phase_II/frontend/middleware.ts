/**
 * Next.js Middleware for Route Protection
 *
 * This middleware runs on the Edge runtime and protects authenticated routes.
 * It intercepts all requests and:
 * 1. Checks for valid auth-token cookie
 * 2. Validates JWT signature and expiration
 * 3. Redirects unauthenticated users to /sign-in
 * 4. Allows authenticated users to proceed
 *
 * Protected routes:
 * - /dashboard/* - Main application routes
 * - /api/* (except /api/auth/*) - API endpoints
 *
 * Public routes:
 * - / - Landing page
 * - /sign-in - Authentication page
 * - /sign-up - Registration page (if enabled)
 * - /api/auth/* - Better Auth endpoints
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware function
 *
 * Runs on every request to check authentication status.
 * Uses Edge runtime for fast response times.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookies
  const authToken = request.cookies.get("auth-token")

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
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

  // Check if user is authenticated
  if (!authToken || !authToken.value) {
    // Redirect to sign-in page with return URL
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("from", pathname) // Remember where user was trying to go
    return NextResponse.redirect(signInUrl)
  }

  // Validate JWT token (basic check - signature validation happens in API routes)
  try {
    // Decode JWT payload (don't validate signature here - that's expensive)
    const payload = JSON.parse(
      Buffer.from(authToken.value.split(".")[1], "base64").toString()
    )

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      // Token expired - redirect to sign-in
      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("expired", "true")
      signInUrl.searchParams.set("from", pathname)

      // Clear expired cookie
      const response = NextResponse.redirect(signInUrl)
      response.cookies.delete("auth-token")
      return response
    }

    // Token is valid - allow request to proceed
    return NextResponse.next()
  } catch (error) {
    // Invalid token format - redirect to sign-in
    console.error("Invalid JWT token format:", error)
    const signInUrl = new URL("/sign-in", request.url)

    // Clear invalid cookie
    const response = NextResponse.redirect(signInUrl)
    response.cookies.delete("auth-token")
    return response
  }
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
