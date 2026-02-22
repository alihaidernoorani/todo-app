/**
 * Better Auth Client Configuration
 *
 * Client-side authentication utilities for React components.
 * Provides hooks and methods for:
 * - Sign-in/sign-out
 * - Session management
 * - User state tracking
 *
 * Usage in React components:
 * ```tsx
 * import { authClient } from '@/lib/auth/better-auth-client'
 *
 * function SignInForm() {
 *   const signIn = authClient.signIn.email
 *
 *   const handleSubmit = async (email: string, password: string) => {
 *     const { data, error } = await signIn({ email, password })
 *     if (error) {
 *       console.error('Sign-in failed:', error)
 *     } else {
 *       console.log('Signed in as:', data.user)
 *       router.push('/dashboard')
 *     }
 *   }
 * }
 * ```
 */

"use client"

import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

/**
 * Better Auth client instance
 *
 * Automatically configured to:
 * - Use the same base URL as the server
 * - Store session tokens in HttpOnly cookies
 * - Handle CSRF tokens
 * - Manage session state
 * - JWT token support for API authentication
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    (typeof window !== "undefined" ? window.location.origin : undefined),
  plugins: [
    jwtClient(), // Enable JWT token retrieval
  ],
})

/**
 * Type-safe auth client
 * Provides TypeScript autocomplete for all auth methods
 */
export type AuthClient = typeof authClient
