/**
 * Shared Database Connection Pool
 *
 * Single Pool instance shared across the entire application to prevent
 * connection exhaustion with Neon PostgreSQL.
 *
 * Used by:
 * - Better Auth (better-auth.ts)
 * - Session endpoint (api/auth/session/route.ts)
 */

import { Pool } from 'pg'

let _pool: Pool | null = null

/**
 * Get or create the shared database pool
 *
 * Creates a single Pool instance on first call and reuses it
 * for all subsequent calls. This prevents connection exhaustion.
 */
export function getPool(): Pool | null {
  // Return cached pool if it exists
  if (_pool) {
    return _pool
  }

  // Get database URL from environment
  const url = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
  if (!url) {
    console.error('[DB Pool] No database URL configured')
    return null
  }

  // Create new pool with optimized settings for Neon
  console.log('[DB Pool] Creating shared database pool')
  _pool = new Pool({
    connectionString: url,
    max: 5, // Maximum 5 connections (Neon free tier limit)
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    connectionTimeoutMillis: 10000, // Wait 10s for connection
    ssl: {
      rejectUnauthorized: false, // Neon requires SSL
    },
  })

  // Log pool events for debugging
  _pool.on('error', (err) => {
    console.error('[DB Pool] Unexpected error on idle client:', err)
  })

  _pool.on('connect', () => {
    console.log('[DB Pool] New client connected')
  })

  _pool.on('remove', () => {
    console.log('[DB Pool] Client removed from pool')
  })

  return _pool
}

/**
 * Close the database pool
 * Only call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    console.log('[DB Pool] Closing pool')
    await _pool.end()
    _pool = null
  }
}
