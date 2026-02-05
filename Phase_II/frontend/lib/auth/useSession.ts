'use client'

import { useEffect, useState } from 'react'

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
 * Calls /api/auth/session endpoint to check authentication status.
 * Better Auth's catch-all handler automatically validates the session cookie
 * and returns user data if authenticated.
 *
 * Note: This endpoint is handled by /api/auth/[...all]/route.ts catch-all.
 *
 * @returns {object} - Session state with user data and status
 */
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [session, setSession] = useState<Session>({ user: null })

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Call Better Auth's session endpoint
        const response = await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include', // Include cookies
        })

        if (response.ok) {
          const data = await response.json()

          if (data && data.user) {
            setSession({ user: data.user })
            setStatus('authenticated')
          } else {
            setSession({ user: null })
            setStatus('unauthenticated')
          }
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
