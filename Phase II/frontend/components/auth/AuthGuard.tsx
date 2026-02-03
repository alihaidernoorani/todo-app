'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/useSession'
import { DashboardSkeleton } from '@/components/layout/DashboardSkeleton'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * Client-side route protection component
 *
 * Checks authentication status via useSession hook and redirects
 * unauthenticated users to /login. Shows loading skeleton while
 * checking session to prevent layout shift.
 *
 * SECURITY NOTE: This provides UX-level protection only. Backend
 * endpoints must still validate JWTs server-side.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.push('/login')
    }
  }, [status, router])

  // Show loading skeleton while checking authentication
  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  // Redirect in progress, show skeleton to prevent flash
  if (status === 'unauthenticated') {
    return <DashboardSkeleton />
  }

  // Authenticated - render protected content
  return <>{children}</>
}
