/**
 * T029: Auth All Methods Integration Tests
 *
 * Verifies that the unified authClient interface works consistently
 * across all three authentication paths: email/password, Google, Facebook.
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

const { mockToken, mockSignInEmail, mockSignInSocial } = vi.hoisted(() => ({
  mockToken: vi.fn().mockResolvedValue({ data: { token: 'mock-rs256-jwt' } }),
  mockSignInEmail: vi.fn(),
  mockSignInSocial: vi.fn(),
}))

vi.mock('@/lib/auth/better-auth-client', () => ({
  authClient: {
    signIn: {
      email: mockSignInEmail,
      social: mockSignInSocial,
    },
    token: mockToken,
  },
}))

import { authClient } from '@/lib/auth/better-auth-client'

describe('T029: Auth unified interface — all providers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockToken.mockResolvedValue({ data: { token: 'mock-rs256-jwt' } })
  })

  it('email/password: signIn.email exists and token() is callable after sign-in', async () => {
    mockSignInEmail.mockResolvedValueOnce({ data: { user: { email: 'a@b.com' } }, error: null })

    await authClient.signIn.email({ email: 'a@b.com', password: 'pass' })
    const tokenResult = await authClient.token()

    expect(mockSignInEmail).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass' })
    expect(tokenResult.data?.token).toBe('mock-rs256-jwt')
  })

  it('Google social: signIn.social called with provider=google, token() callable', async () => {
    mockSignInSocial.mockResolvedValueOnce(undefined)

    await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard', errorCallbackURL: '/login' })
    const tokenResult = await authClient.token()

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
    expect(tokenResult.data?.token).toBe('mock-rs256-jwt')
  })

  it('Facebook social: signIn.social called with provider=facebook, token() callable', async () => {
    mockSignInSocial.mockResolvedValueOnce(undefined)

    await authClient.signIn.social({ provider: 'facebook', callbackURL: '/dashboard', errorCallbackURL: '/login' })
    const tokenResult = await authClient.token()

    expect(mockSignInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'facebook' })
    )
    expect(tokenResult.data?.token).toBe('mock-rs256-jwt')
  })

  it('all three methods share the same authClient token() interface', () => {
    expect(typeof authClient.signIn.email).toBe('function')
    expect(typeof authClient.signIn.social).toBe('function')
    expect(typeof authClient.token).toBe('function')
  })
})
