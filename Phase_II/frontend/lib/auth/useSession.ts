'use client'

import { useEffect, useState } from 'react'
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
 * Client-side session hook using Better Auth's session API
 *
 * Uses Better Auth client's session method to check authentication status.
 * This approach avoids the /api/auth/get-session endpoint issue and directly
 * uses Better Auth's built-in session checking mechanism.
 *
 * @returns {object} - Session state with user data and status
 */
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [session, setSession] = useState<Session>({ user: null })

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Use Better Auth client's session method
        const sessionData = await authClient.$fetch('/session', {
          method: 'GET',
        })

        if (sessionData && sessionData.user) {
          setSession({ user: sessionData.user })
          setStatus('authenticated')
        } else {
          setSession({ user: null })
          setStatus('unauthenticated')
        }
      } catch (error) {
        console.error('Session check failed:', error)
        setSession({ user: null })
        setStatus('unauthenticated')
      }
    }

    checkSession()
  }, [])

  return { session, status }
}
