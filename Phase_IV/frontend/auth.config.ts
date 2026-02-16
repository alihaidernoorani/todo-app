/**
 * Better Auth Configuration for CLI Migrations
 *
 * This is a simplified config without build-phase guards,
 * used specifically for running `npx @better-auth/cli migrate`
 */

import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { Pool } from "pg"

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL must be set for migrations")
}

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000"
const issuer = process.env.BETTER_AUTH_ISSUER || baseURL
const audience = process.env.BETTER_AUTH_AUDIENCE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 15,
    updateAge: 60 * 5,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookieSameSite: "strict",
    generateId: () => crypto.randomUUID(),
  },

  baseURL,
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-change-in-production",

  plugins: [
    jwt({
      jwt: {
        expirationTime: "1h",
        issuer,
        audience,
      },
      jwks: {
        keyPairConfig: {
          alg: "RS256",
          modulusLength: 2048
        }
      }
    }),
  ],
})
