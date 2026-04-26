/**
 * SocialLoginButtons + SignInForm Social Error Tests
 *
 * TDD test suite covering:
 * - Google button renders and triggers social login (T007–T011)
 * - Facebook button renders and handles loading/error states (T017–T021)
 * - SignInForm error query param rendering (T025–T027)
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// vi.hoisted ensures these are available inside the vi.mock factory (which is hoisted above imports)
const { mockSignInSocial, mockSearchParamsGet } = vi.hoisted(() => ({
  mockSignInSocial: vi.fn(),
  mockSearchParamsGet: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/auth/better-auth-client', () => ({
  authClient: {
    signIn: {
      social: mockSignInSocial,
      email: vi.fn(),
    },
    token: vi.fn().mockResolvedValue({ data: { token: 'mock-token' } }),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
  usePathname: () => '/',
}))

import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { SignInForm } from '@/components/auth/SignInForm'

// ─── Phase 3: User Story 4 — Google Button (T007–T011) ────────────────────────

describe('SocialLoginButtons — Google (T008–T011)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
  })

  it('T008: renders Continue with Google button', () => {
    render(<SocialLoginButtons mode="login" />)
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
  })

  it('T009: renders divider with "or" text', () => {
    render(<SocialLoginButtons mode="login" />)
    expect(screen.getByText('or')).toBeInTheDocument()
  })

  it('T010: Google button shows spinner and is disabled when loading', async () => {
    // Never-resolving promise keeps loadingProvider set to 'google'
    mockSignInSocial.mockReturnValue(new Promise(() => {}))

    render(<SocialLoginButtons mode="login" />)
    const googleBtn = screen.getByRole('button', { name: /Continue with Google/i })

    await act(async () => {
      fireEvent.click(googleBtn)
    })

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
    // After click the button must be disabled (loadingProvider set)
    expect(googleBtn).toBeDisabled()
  })

  it('T011: Google button displays error when signIn.social throws', async () => {
    mockSignInSocial.mockRejectedValueOnce(new Error('network error'))

    render(<SocialLoginButtons mode="login" />)
    const googleBtn = screen.getByRole('button', { name: /Continue with Google/i })

    await act(async () => {
      fireEvent.click(googleBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/Google sign-in is currently unavailable/i)).toBeInTheDocument()
    })
  })
})

// ─── Phase 4: User Story 5 — Facebook Button (T017–T021) ──────────────────────

describe('SocialLoginButtons — Facebook (T017–T021)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParamsGet.mockReturnValue(null)
  })

  it('T017: renders Continue with Facebook button', () => {
    render(<SocialLoginButtons mode="login" />)
    expect(screen.getByRole('button', { name: /Continue with Facebook/i })).toBeInTheDocument()
  })

  it('T018: Facebook button shows spinner and authClient called with facebook', async () => {
    mockSignInSocial.mockReturnValue(new Promise(() => {}))

    render(<SocialLoginButtons mode="login" />)
    const fbBtn = screen.getByRole('button', { name: /Continue with Facebook/i })

    await act(async () => {
      fireEvent.click(fbBtn)
    })

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'facebook' })
    )
    expect(fbBtn).toBeDisabled()
  })

  it('T019: Facebook button displays error when signIn.social throws', async () => {
    mockSignInSocial.mockRejectedValueOnce(new Error('network error'))

    render(<SocialLoginButtons mode="login" />)
    const fbBtn = screen.getByRole('button', { name: /Continue with Facebook/i })

    await act(async () => {
      fireEvent.click(fbBtn)
    })

    await waitFor(() => {
      expect(screen.getByText(/Facebook sign-in is currently unavailable/i)).toBeInTheDocument()
    })
  })

  it('T020: only one provider loads at a time — other button is disabled', async () => {
    mockSignInSocial.mockReturnValue(new Promise(() => {}))

    render(<SocialLoginButtons mode="login" />)
    const googleBtn = screen.getByRole('button', { name: /Continue with Google/i })
    const fbBtn = screen.getByRole('button', { name: /Continue with Facebook/i })

    await act(async () => {
      fireEvent.click(googleBtn)
    })

    // Facebook button should also be disabled while Google is loading
    expect(fbBtn).toBeDisabled()
  })

  it('T021: signup mode renders "Sign up with" labels', () => {
    render(<SocialLoginButtons mode="signup" />)
    expect(screen.getByRole('button', { name: /Sign up with Google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign up with Facebook/i })).toBeInTheDocument()
  })
})

// ─── Phase 5: SignInForm error query param rendering (T025–T027) ──────────────

describe('SignInForm — social error query params (T025–T027)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('T025: ?error=google_failed renders Google-specific failure message', () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'error' ? 'google_failed' : null
    )
    render(<SignInForm />)
    expect(
      screen.getByText('Google sign-in failed. Please try again or use email/password.')
    ).toBeInTheDocument()
  })

  it('T026: ?error=access_denied renders cancellation message', () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'error' ? 'access_denied' : null
    )
    render(<SignInForm />)
    expect(screen.getByText('Sign-in was cancelled.')).toBeInTheDocument()
  })

  it('T027: ?error=state_mismatch renders security check message', () => {
    mockSearchParamsGet.mockImplementation((key: string) =>
      key === 'error' ? 'state_mismatch' : null
    )
    render(<SignInForm />)
    expect(
      screen.getByText('Sign-in failed: security check failed. Please try again.')
    ).toBeInTheDocument()
  })
})
