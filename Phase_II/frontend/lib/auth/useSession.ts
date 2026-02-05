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
 * Client-side session hook using Better Auth client library
 *
 * Uses Better Auth's client methods to retrieve session data.
 * The client library handles all the internal API calls and cookie management.
 *
 * @returns {object} - Session state with user data and status
 */
export function useSession() {
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [session, setSession] = useState<Session>({ user: null })

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Use Better Auth client's getSession method
        const { data, error } = await authClient.getSession()

        if (error || !data) {
          setSession({ user: null })
          setStatus('unauthenticated')
        } else if (data.user) {
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
      }
    }

    checkSession()
  }, [])

  return { session, status }
}
