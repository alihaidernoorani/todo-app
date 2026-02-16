/**
 * Token Storage Manager for JWT Authentication
 *
 * Provides secure localStorage-based JWT token management with:
 * - Token storage and retrieval
 * - Expiration checks
 * - Token decoding for debugging
 * - Automatic cleanup on expiry
 *
 * Security Notes:
 * - Uses localStorage (XSS risk mitigation via CSP headers required)
 * - Tokens are short-lived (15 minutes) to limit exposure
 * - No sensitive data stored (tokens contain only user ID and metadata)
 */

const ACCESS_TOKEN_KEY = 'better_auth_access_token'

export interface DecodedToken {
  sub: string // User ID
  email?: string
  name?: string
  iss: string // Issuer
  aud?: string // Audience
  exp: number // Expiration timestamp (seconds)
  iat: number // Issued at timestamp (seconds)
}

/**
 * Token Storage class for managing JWT tokens in localStorage
 */
export class TokenStorage {
  /**
   * Store access token in localStorage
   */
  static setAccessToken(token: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }

  /**
   * Get access token from localStorage
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Clear access token from localStorage
   */
  static clearAccessToken(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }

  /**
   * Check if the stored token is expired
   * @returns true if token is expired or missing, false otherwise
   */
  static isExpired(): boolean {
    const token = this.getAccessToken()
    if (!token) return true

    try {
      const decoded = this.decode(token)
      if (!decoded || !decoded.exp) return true

      // exp is in seconds, Date.now() is in milliseconds
      const now = Math.floor(Date.now() / 1000)
      return decoded.exp < now
    } catch {
      // If decoding fails, consider token expired
      return true
    }
  }

  /**
   * Decode JWT token (without verification - for client-side inspection only)
   * Backend must verify signature using JWKS
   *
   * @param token - JWT token string
   * @returns Decoded token payload or null if invalid
   */
  static decode(token: string): DecodedToken | null {
    try {
      // JWT format: header.payload.signature (Base64url encoded)
      const parts = token.split('.')
      if (parts.length !== 3) return null

      // Decode the payload (second part)
      const payload = parts[1]
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      return JSON.parse(decoded) as DecodedToken
    } catch (error) {
      console.error('[TokenStorage] Failed to decode token:', error)
      return null
    }
  }

  /**
   * Clear token if expired
   * @returns true if token was cleared, false otherwise
   */
  static clearIfExpired(): boolean {
    if (this.isExpired()) {
      this.clearAccessToken()
      return true
    }
    return false
  }
}
