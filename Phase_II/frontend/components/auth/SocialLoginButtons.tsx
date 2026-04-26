'use client'

// MUST be 'use client' — since Better Auth v1.3.23+, the OAuth state cookie is
// set browser-side. Calling signIn.social() from a Server Component causes
// state_not_found errors and breaks the OAuth flow entirely.

import { useState } from 'react'
import { authClient } from '@/lib/auth/better-auth-client'

type Provider = 'google' | 'facebook'

interface SocialLoginButtonsProps {
  mode?: 'login' | 'signup'
}

export function SocialLoginButtons({ mode = 'login' }: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const label = mode === 'signup' ? 'Sign up with' : 'Continue with'

  async function handleSocialLogin(provider: Provider) {
    setError(null)
    setLoadingProvider(provider)

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
        // Use bare /login so Better Auth appends ?error=<actual_error_code>
        // (e.g. access_denied for cancellation → "Sign-in was cancelled.")
        errorCallbackURL: '/login',
      })
      // Browser redirects on success — execution never reaches here
    } catch {
      setError(
        `${provider === 'google' ? 'Google' : 'Facebook'} sign-in is currently unavailable. Please try again.`
      )
      setLoadingProvider(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-slate-500">or</span>
        </div>
      </div>

      {/* Error display (for network/unexpected errors caught client-side) */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Google Button */}
      <button
        type="button"
        onClick={() => handleSocialLogin('google')}
        disabled={!!loadingProvider}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5
                   border border-slate-300 rounded-lg bg-white text-slate-700
                   font-medium text-sm hover:bg-slate-50 active:bg-slate-100
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'google' ? (
          <Spinner className="text-slate-500" />
        ) : (
          <GoogleIcon />
        )}
        {label} Google
      </button>

      {/* Facebook Button */}
      <button
        type="button"
        onClick={() => handleSocialLogin('facebook')}
        disabled={!!loadingProvider}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5
                   rounded-lg bg-[#1877F2] text-white font-medium text-sm
                   hover:bg-[#166FE5] active:bg-[#1661CF]
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingProvider === 'facebook' ? (
          <Spinner className="text-white" />
        ) : (
          <FacebookIcon />
        )}
        {label} Facebook
      </button>
    </div>
  )
}

// ─── Sub-components (inline to avoid icon library dependency) ─────────────────

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="white"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`animate-spin h-4 w-4 ${className}`}
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
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
