'use client'

import { useState, useEffect } from 'react'

export interface Session {
  user: {
    id: string
    email: string
    name?: string
  } | null
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * Client-side session hook
 *
 * Fetches the current user session from Better Auth's session endpoint.
 * Uses SWR-like pattern with automatic revalidation.
 *
 * @returns {object} - Session state with user info and loading status
 */
export function useSession() {
  const [session, setSession] = useState<Session>({ user: null })
  const [status, setStatus] = useState<SessionStatus>('loading')

  useEffect(() => {
    let mounted = true

    async function fetchSession() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include', // Include cookies
        })

        if (!mounted) return

        if (response.ok) {
          const data = await response.json()

          if (data.user) {
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
        console.error('[useSession] Failed to fetch session:', error)
        if (mounted) {
          setSession({ user: null })
          setStatus('unauthenticated')
        }
      }
    }

    fetchSession()

    // Cleanup function
    return () => {
      mounted = false
    }
  }, [])

  return { session, status }
}
