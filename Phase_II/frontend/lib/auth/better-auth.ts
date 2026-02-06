/**
 * Better Auth Server Configuration
 *
 * This file configures Better Auth for hybrid authentication with:
 * - PostgreSQL database integration
 * - Email/password authentication
 * - HttpOnly cookie storage for web sessions (XSS protection)
 * - JWT tokens for API authentication (stateless)
 * - 15-minute session expiry
 *
 * Environment Variables Required:
 * - BETTER_AUTH_SECRET: 32-character random string (used for session signing)
 * - BETTER_AUTH_URL: Base URL for auth endpoints (e.g., http://localhost:3000)
 * - BETTER_AUTH_ISSUER: JWT issuer URL (defaults to BETTER_AUTH_URL)
 * - BETTER_AUTH_AUDIENCE: JWT audience URL (e.g., http://localhost:8000)
 * - NEON_DATABASE_URL or DATABASE_URL: PostgreSQL connection string for auth tables
 */

import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

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
let _pool: Pool | null = null

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
    const issuer = process.env.BETTER_AUTH_ISSUER || baseURL
    const audience = process.env.BETTER_AUTH_AUDIENCE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

    console.log("[Better Auth] JWT Plugin Config:", { issuer, audience })

    // Create Pool only once and reuse it
    if (!_pool) {
      console.log("[Better Auth] Creating new database Pool")
      _pool = new Pool({
        connectionString: databaseUrl,
        max: 10, // Maximum pool size
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
        ssl: {
          rejectUnauthorized: false, // Neon requires SSL but we don't verify cert
        },
      })
    } else {
      console.log("[Better Auth] Reusing existing database Pool")
    }

    const authInstance = betterAuth({
      // Database configuration for storing users and sessions
      // Better Auth requires a Pool instance, not a config object
      database: _pool,

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

      // JWT Plugin for API authentication
      plugins: [
        jwt({
          jwt: {
            expirationTime: "1h",
            issuer,
            audience,
          },
          jwks: {
            keyPairConfig: {
              alg: "RS256",           // Use RS256 instead of default EdDSA
              modulusLength: 2048     // RSA key length
            }
          }
        }),
      ],
    })

    // Verify JWT plugin endpoints are registered
    const endpoints = Object.keys(authInstance.api || {})
    console.log("[Better Auth] Total endpoints registered:", endpoints.length)
    console.log("[Better Auth] JWT endpoints check:")
    console.log("  - getToken:", endpoints.includes('getToken'))
    console.log("  - getJwks:", endpoints.includes('getJwks'))
    console.log("  - signJWT:", endpoints.includes('signJWT'))
    console.log("  - verifyJWT:", endpoints.includes('verifyJWT'))

    if (!endpoints.includes('getToken')) {
      console.error("[Better Auth] WARNING: JWT plugin endpoints NOT found! Only base endpoints registered.")
      console.error("[Better Auth] Available endpoints:", endpoints)
    }

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
