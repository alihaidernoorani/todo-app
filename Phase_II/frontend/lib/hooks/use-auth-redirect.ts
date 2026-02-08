/**
 * Authentication Redirect Hook (JWT-based)
 *
 * Client-side hook that checks authentication status using JWT tokens
 * and automatically redirects to /sign-in when not authenticated.
 *
 * Features:
 * - Checks for valid JWT token in localStorage
 * - Redirects to sign-in page when no token or token expired
 * - Returns authentication status for conditional rendering
 * - Preserves current URL for redirect after login
 * - Clears expired tokens automatically
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
import { TokenStorage } from '@/lib/auth/token-storage'

interface UseAuthRedirectReturn {
  isAuthenticated: boolean
  isChecking: boolean
}

export function useAuthRedirect(): UseAuthRedirectReturn {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check for valid token in localStorage
    const token = TokenStorage.getAccessToken()

    if (!token || TokenStorage.isExpired()) {
      // Clear expired token
      TokenStorage.clearAccessToken()

      // Redirect to sign-in with return URL
      const signInUrl = `/signin?from=${encodeURIComponent(pathname)}`
      router.push(signInUrl)

      setIsAuthenticated(false)
    } else {
      // Token exists and is valid
      setIsAuthenticated(true)
    }

    setIsChecking(false)
  }, [router, pathname])

  return {
    isAuthenticated,
    isChecking,
  }
}
