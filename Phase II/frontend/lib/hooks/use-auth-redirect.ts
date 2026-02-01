/**
 * Authentication Redirect Hook
 *
 * Client-side hook that checks authentication status and automatically
 * redirects to /sign-in when not authenticated.
 *
 * Features:
 * - Checks authentication on component mount
 * - Redirects to sign-in page when not authenticated
 * - Returns authentication status for conditional rendering
 * - Preserves current URL for redirect after login
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, isChecking } = useAuthRedirect()
 *
 *   if (isChecking) {
 *     return <LoadingSkeleton />
 *   }
 *
 *   if (!isAuthenticated) {
 *     return null // Will redirect automatically
 *   }
 *
 *   return <div>Protected content</div>
 * }
 * ```
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth/jwt-utils'

interface UseAuthRedirectReturn {
  isAuthenticated: boolean
  isChecking: boolean
}

export function useAuthRedirect(): UseAuthRedirectReturn {
  const [authStatus, setAuthStatus] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true)

      try {
        const authenticated = await isAuthenticated()
        setAuthStatus(authenticated)

        // Redirect to sign-in if not authenticated
        if (!authenticated) {
          const signInUrl = `/sign-in?from=${encodeURIComponent(pathname)}`
          router.push(signInUrl)
        }
      } catch (error) {
        console.error('Authentication check failed:', error)
        setAuthStatus(false)
        // Redirect on error to be safe
        const signInUrl = `/sign-in?from=${encodeURIComponent(pathname)}`
        router.push(signInUrl)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  return {
    isAuthenticated: authStatus,
    isChecking,
  }
}
