/**
 * Better Auth Server Configuration
 *
 * This file configures Better Auth for JWT-based authentication with:
 * - PostgreSQL database integration
 * - Email/password authentication
 * - JWT tokens with RS256 signing for stateless authentication
 * - 15-minute JWT expiry for security
 *
 * Environment Variables Required:
 * - BETTER_AUTH_SECRET: 32-character random string (used for JWT signing)
 * - BETTER_AUTH_URL: Base URL for auth endpoints and issuer claim
 * - NEON_DATABASE_URL or DATABASE_URL: PostgreSQL connection string for auth tables
 */

import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { jwt } from "better-auth/plugins"
import { getPool } from "@/lib/db/pool"

/**
 * Check if we're in a build/static generation phase
 * Next.js sets NEXT_PHASE during build
 */
function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    typeof window === 'undefined' && !process.env.NEON_DATABASE_URL && !process.env.DATABASE_URL
  )
}

/**
 * Get the database URL from environment variables
 * Supports both NEON_DATABASE_URL and DATABASE_URL
 */
function getDatabaseUrl(): string {
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!url) {
    return ""
  }
  return url
}

/**
 * Lazy initialization of Better Auth
 * This prevents database connection attempts during build time
 */
let _auth: ReturnType<typeof betterAuth> | null = null

function createAuth(): ReturnType<typeof betterAuth> | null {
  // Return cached auth instance if it exists
  if (_auth) {
    console.log("[Better Auth] Returning cached auth instance")
    return _auth
  }

  const databaseUrl = getDatabaseUrl()
  console.log("[Better Auth] Starting initialization...")
  console.log("[Better Auth] Database URL exists:", !!databaseUrl)
  console.log("[Better Auth] Is build phase:", isBuildPhase())
  console.log("[Better Auth] NODE_ENV:", process.env.NODE_ENV)

  // Skip initialization during build or if no database URL
  if (isBuildPhase() || !databaseUrl) {
    console.log("[Better Auth] Skipping initialization (build phase or no DB URL)")
    return null
  }

  try {
    console.log("[Better Auth] Creating betterAuth instance...")
    const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000"

    // Use shared database pool
    const pool = getPool()
    if (!pool) {
      console.error("[Better Auth] Failed to get database pool")
      return null
    }
    console.log("[Better Auth] Using shared database pool")

    const authInstance = betterAuth({
      // Database configuration for storing users and sessions
      // Better Auth requires a Pool instance, not a config object
      database: pool,

      // Email and password authentication
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true for email verification flow
      },

      // Session configuration (for cookie-based web auth)
      session: {
        expiresIn: 60 * 15, // 15 minutes (900 seconds)
        updateAge: 60 * 5, // Update session every 5 minutes
        cookieCache: {
          enabled: true,
          maxAge: 60 * 5, // Cache for 5 minutes
        },
      },

      // Advanced security options
      advanced: {
        useSecureCookies: process.env.NODE_ENV === "production", // HTTPS-only in production
        cookieSameSite: "strict", // CSRF protection
        generateId: () => crypto.randomUUID(), // UUID generation for user IDs
      },

      // Base URL for auth endpoints
      baseURL,

      // Secret for signing sessions
      secret: process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production",

      // Plugins for Next.js integration and JWT support
      plugins: [
        // CRITICAL: nextCookies() enables Better Auth to work with Next.js cookies() API
        // Without this, Server Components and Server Actions cannot read auth cookies
        nextCookies(),

        // JWT plugin for stateless authentication across different domains
        jwt({
          // JWKS configuration for key pair generation and storage
          jwks: {
            // Key pair algorithm configuration
            keyPairConfig: {
              alg: "RS256", // RS256: RSA-SHA256 asymmetric key algorithm for JWT signing
            },
            // Disable private key encryption to avoid key decryption issues
            // This is fine for development; keys are still stored securely in database
            disablePrivateKeyEncryption: true,
          },

          // JWT token configuration
          jwt: {
            // Issuer claim: identifies the Better Auth instance that issued the token
            issuer: baseURL,

            // Audience claim: identifies the intended recipient (backend API)
            // Optional - can be used for additional validation
            audience: process.env.NEXT_PUBLIC_API_URL || undefined,

            // Token expiration: 15 minutes for security (matches session expiry)
            expirationTime: "15m",
          },
        }),
      ],
    })

    _auth = authInstance
    console.log("[Better Auth] Initialized successfully")
    return _auth
  } catch (error) {
    console.error("[Better Auth] Failed to initialize:", error)
    return null
  }
}

/**
 * Get the auth instance (lazy initialization)
 * Creates the Better Auth instance on first access at runtime
 */
export function getAuth(): ReturnType<typeof betterAuth> | null {
  if (!_auth) {
    return createAuth()
  }
  return _auth
}

/**
 * Type inference for Better Auth
 * Allows TypeScript to understand the auth object shape
 */
export type Auth = ReturnType<typeof betterAuth>

/**
 * Auth singleton instance for use in Server Components and Server Actions
 * Lazily initialized on first use
 *
 * Note: JWT tokens should be obtained via the /api/auth/token HTTP endpoint,
 * not via auth.api. The server-side getToken API is undocumented and unreliable.
 */
export const auth = {
  api: {
    getSession: async (options: { headers: any }) => {
      const authInstance = getAuth()
      if (!authInstance) {
        return null
      }
      return authInstance.api.getSession(options)
    },
  }
}
