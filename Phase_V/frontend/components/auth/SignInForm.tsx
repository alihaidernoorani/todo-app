/**
 * Sign-In Form Component
 *
 * Extracted from SignInPage to allow Suspense wrapping of useSearchParams.
 * Handles all form state and submission logic.
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/better-auth-client'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'

// Maps Better Auth OAuth error codes (from ?error= query param) to user-facing strings.
// Better Auth appends ?error=<code> to errorCallbackURL after a failed OAuth callback.
const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
  google_failed:            'Google sign-in failed. Please try again or use email/password.',
  facebook_failed:          'Facebook sign-in failed. Please try again or use email/password.',
  access_denied:            'Sign-in was cancelled.',
  state_not_found:          'Sign-in session expired. Please try again.',
  state_mismatch:           'Sign-in failed: security check failed. Please try again.',
  account_not_linked:       'This account is not linked. Please sign in with email/password first.',
  unable_to_link_account:   'Could not link social account. Please try again.',
  oauth_provider_not_found: 'Social login is not configured. Please use email/password.',
  email_required:           'Facebook sign-in requires an email address. Please ensure your Facebook account has an email and try again.',
}

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if redirected due to session expiry
  const sessionExpired = searchParams.get('expired') === 'true'
  const returnUrl = searchParams.get('from') || '/dashboard'

  // Resolve social OAuth error from query param (set by Better Auth on errorCallbackURL)
  const errorCode = searchParams.get('error')
  const socialError = errorCode
    ? (SOCIAL_ERROR_MESSAGES[errorCode] ?? 'Sign-in failed. Please try again.')
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        setError('Please enter both email and password')
        setIsLoading(false)
        return
      }

      // Sign in with Better Auth
      console.log('[SignIn] Attempting sign-in for:', email)
      const result = await authClient.signIn.email({
        email,
        password,
      })
      console.log('[SignIn] Result:', JSON.stringify(result, null, 2))

      if (result.error) {
        console.log('[SignIn] Error:', result.error)
        setError(result.error.message || 'Invalid credentials')
        setIsLoading(false)
      } else {
        console.log('[SignIn] Sign-in successful!')
        console.log('[SignIn] User:', result.data.user.email)

        // Get JWT token using Better Auth client
        console.log('[SignIn] Requesting JWT token...')
        const tokenResult = await authClient.token()

        if (tokenResult.data?.token) {
          console.log('[SignIn] JWT token received!')
          // Token will be used by useSession hook
          console.log('[SignIn] Redirecting to:', returnUrl)
          router.push(returnUrl)
          router.refresh()
        } else {
          console.error('[SignIn] Failed to get JWT token:', tokenResult.error)
          setError('Failed to get authentication token. Please try again.')
          setIsLoading(false)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-heading">
          Sign In to TaskFlow
        </h1>
        <p className="text-slate-600 text-sm">
          {sessionExpired
            ? 'Your session expired. Please sign in again.'
            : 'Authenticate to continue'}
        </p>
      </div>

      {/* Session Expiry Warning */}
      {sessionExpired && (
        <div className="mb-6 p-4 rounded-lg auth-session-warning">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Your session has expired. Any unsaved work has been preserved.
          </p>
        </div>
      )}

      {/* Error Display — shows social OAuth error from query param or form submission error */}
      {(error || socialError) && (
        <div className="mb-6 p-4 rounded-lg auth-error">
          <p className="text-sm text-red-700">{error || socialError}</p>
        </div>
      )}

      {/* Sign-In Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="auth-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="auth-input w-full"
            placeholder="user@example.com"
            autoComplete="email"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="auth-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="auth-input w-full"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="auth-button w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Authenticating...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Social Login Buttons */}
      <SocialLoginButtons mode="login" />

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-slate-500">
        Secured with Better Auth • JWT Authentication
      </p>
    </div>
  )
}
