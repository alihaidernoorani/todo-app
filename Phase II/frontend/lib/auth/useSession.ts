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
 * Client-side session hook that wraps Better Auth session management
 *
 * This hook provides the current authentication status by checking for
 * the presence of an HttpOnly cookie. It does NOT decode the JWT on the
 * client side - user data should be fetched via Server Actions.
 *
 * @returns {object} - Session state with user data and status
 */
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [session, setSession] = useState<Session>({ user: null })

  useEffect(() => {
    // Check if auth cookie exists (without reading its value directly)
    // We'll use the dedicated API route that can access server-side cookies
    const checkSession = async () => {
      try {
        // This fetch includes credentials (cookies) to check the session
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        })

        if (response.status === 200) {
          const data = await response.json()
          setSession({ user: data.user })
          setStatus('authenticated')
        } else {
          setSession({ user: null })
          setStatus('unauthenticated')
        }
      } catch (error) {
        console.error('Session check failed:', error)
        setSession({ user: null })
        setStatus('unauthenticated')
      } finally {
        // Ensure we update the status if it's still loading
        setStatus(prev => prev === 'loading' ? 'unauthenticated' : prev)
      }
    }

    checkSession()
  }, [])

  return { session, status }
}
