/**
 * Authentication Redirect Hook
 *
 * Client-side hook that checks authentication status and automatically
 * redirects to /sign-in when not authenticated.
 *
 * Features:
 * - Checks authentication on component mount using Better Auth session
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

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth/better-auth-client'

interface UseAuthRedirectReturn {
  isAuthenticated: boolean
  isChecking: boolean
}

export function useAuthRedirect(): UseAuthRedirectReturn {
  const router = useRouter()
  const pathname = usePathname()

  // Use Better Auth's built-in session hook
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    // Only check once loading is complete
    if (!isPending) {
      // Redirect to sign-in if not authenticated
      if (!session) {
        const signInUrl = `/signin?from=${encodeURIComponent(pathname)}`
        router.push(signInUrl)
      }
    }
  }, [session, isPending, router, pathname])

  return {
    isAuthenticated: !!session,
    isChecking: isPending,
  }
}
