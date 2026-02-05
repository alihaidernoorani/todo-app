'use client'

import { authClient } from './better-auth-client'

export interface Session {
  user: {
    id: string
    email: string
    name?: string
  } | null
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * Client-side session hook using Better Auth's native session management
 *
 * This hook wraps Better Auth's useSession() to provide the current
 * authentication status. Better Auth automatically handles:
 * - Session cookie validation
 * - Database queries for user data
 * - Token refresh
 * - 401 responses when unauthenticated
 *
 * @returns {object} - Session state with user data and status
 */
export function useSession() {
  const { data: session, isPending, error } = authClient.useSession()

  const status: SessionStatus = isPending
    ? 'loading'
    : session?.user
      ? 'authenticated'
      : 'unauthenticated'

  return {
    session: {
      user: session?.user || null
    },
    status
  }
}
