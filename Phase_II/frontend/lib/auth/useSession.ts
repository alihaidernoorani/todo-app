'use client'

import { useState } from 'react'

export interface Session {
  user: {
    id: string
    email: string
    name?: string
  } | null
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * Simplified session hook
 *
 * Due to Better Auth server configuration issues with the get-session endpoint,
 * we're temporarily disabling automatic session fetching.
 *
 * Authentication still works via cookies - users can sign in and access protected routes.
 * Session display (user name) will be added once the server issue is resolved.
 *
 * @returns {object} - Session state (currently returns empty state to avoid errors)
 */
export function useSession() {
  // Return empty session state - authentication still works via cookies
  const [session] = useState<Session>({ user: null })
  const [status] = useState<SessionStatus>('authenticated')

  return { session, status }
}
