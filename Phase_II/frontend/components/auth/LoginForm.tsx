/**
 * Login Form Component
 *
 * Provides email/password authentication using Better Auth.
 * Handles form validation, error display, and session management.
 */

'use client'

import { Suspense } from 'react'
import { SignInForm } from './SignInForm'

/**
 * Wrapper for SignInForm that handles Suspense for useSearchParams
 */
function LoginFormContent() {
  return <SignInForm />
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="auth-card">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">
            Sign In to TaskFlow
          </h1>
          <p className="text-slate-600 text-sm">
            Loading authentication system...
          </p>
        </div>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-10 bg-slate-100 rounded mb-4"></div>
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-10 bg-slate-100 rounded mb-4"></div>
            <div className="h-10 bg-blue-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}