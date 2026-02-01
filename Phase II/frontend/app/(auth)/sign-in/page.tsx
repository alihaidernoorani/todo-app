/**
 * Sign-In Page
 *
 * Authenticated access to the Command Center dashboard.
 * Uses Suspense boundary for useSearchParams to enable static rendering.
 */

import { Suspense } from 'react'
import { PageTransition } from '@/components/layout/PageTransition'
import { SignInForm } from '@/components/auth/SignInForm'

export default function SignInPage() {
  return (
    <PageTransition>
      <Suspense
        fallback={
          <div className="glass-card border-ghost-amber animate-pulse">
            <div className="h-96 flex items-center justify-center">
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </PageTransition>
  )
}
