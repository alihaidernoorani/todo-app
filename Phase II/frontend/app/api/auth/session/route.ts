/**
 * Session API Route for Client-Side Session Access
 *
 * Provides a secure way for client-side code to access session data
 * through server actions, since HttpOnly cookies cannot be accessed directly.
 */

import { NextRequest } from 'next/server'
import { getJWTPayload } from '@/lib/auth/jwt-utils'

export async function GET() {
  try {
    const session = await getJWTPayload()

    if (session) {
      return Response.json({
        user: {
          id: session.user_id,
          email: session.email,
          name: session.name,
        }
      })
    } else {
      return new Response(JSON.stringify({ user: null }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  } catch (error) {
    console.error('Session API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to get session' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}