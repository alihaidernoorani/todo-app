'use client'

import { useState, useEffect } from 'react'
import { TokenStorage } from './token-storage'
import { authClient } from './better-auth-client'

export interface Session {
  user: {
    id: string
    email: string
    name?: string
  } | null
  token?: string // JWT access token
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * Client-side session hook with JWT support
 *
 * Uses Better Auth client to fetch session and JWT token.
 * Stores token in localStorage for use in API requests.
 * Uses SWR-like pattern with automatic revalidation.
 *
 * @returns {object} - Session state with user info, token, and loading status
 */
export function useSession() {
  const [session, setSession] = useState<Session>({ user: null })
  const [status, setStatus] = useState<SessionStatus>('loading')

  useEffect(() => {
    let mounted = true

    async function fetchSession() {
      try {
        // Check if we have a valid token in localStorage
        const existingToken = TokenStorage.getAccessToken()

        if (existingToken && !TokenStorage.isExpired()) {
          // Decode token to get user info (no verification needed client-side)
          const decoded = TokenStorage.decode(existingToken)
          if (decoded && mounted) {
            setSession({
              user: {
                id: decoded.sub,
                email: decoded.email || '',
                name: decoded.name,
              },
              token: existingToken,
            })
            setStatus('authenticated')
            return
          }
        }

        // Fetch session from server
        const { data: authSession, error: sessionError } = await authClient.getSession()

        if (!mounted) return

        if (authSession && authSession.user) {
          // User is authenticated - get JWT token via documented client API
          try {
            const tokenResult = await authClient.token()
            const jwtToken = tokenResult.data?.token

            if (jwtToken && jwtToken.includes('.')) {
              TokenStorage.setAccessToken(jwtToken)

              setSession({
                user: {
                  id: authSession.user.id,
                  email: authSession.user.email,
                  name: authSession.user.name,
                },
                token: jwtToken,
              })
              setStatus('authenticated')
            } else {
              console.error('[useSession] No valid JWT token received')
              TokenStorage.clearAccessToken()
              setSession({ user: null })
              setStatus('unauthenticated')
            }
          } catch (tokenError) {
            console.error('[useSession] Error getting JWT token:', tokenError)
            TokenStorage.clearAccessToken()
            setSession({ user: null })
            setStatus('unauthenticated')
          }
        } else {
          // No session - clear storage
          TokenStorage.clearAccessToken()
          setSession({ user: null })
          setStatus('unauthenticated')
        }
      } catch (error) {
        console.error('[useSession] ❌ Failed to fetch session:', error)
        if (mounted) {
          TokenStorage.clearAccessToken()
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
