/**
 * API Error Classes
 *
 * Custom error types for API operations.
 * This file does NOT use 'use server' as it only exports class definitions.
 */

/**
 * Authentication error type
 * Used to distinguish auth errors from other API errors
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Not authenticated') {
    super(message)
    this.name = 'AuthenticationError'
  }
}
