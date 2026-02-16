# Architecture: Stateless JWT Authentication

## Overview

This document describes the complete migration from session-based authentication to stateless JWT (JSON Web Token) authentication in the Todo application. The migration enhances scalability, reduces server overhead, and improves security posture.

## Before: Session-Based Authentication

### Architecture Flow
```
Frontend → Session Cookie → Backend → /api/auth/session → Better Auth
                                        ↓
                                 Validate Session
```

### Components
- **Frontend**: Stores authentication state in browser cookies
- **Better Auth**: Issues session cookies with server-side storage
- **Custom Session Endpoint**: `/api/auth/session` for session validation
- **Backend**: Validates sessions via HTTP calls to Better Auth
- **State Management**: Session state stored server-side

### Limitations
- Server-side session storage creates scaling challenges
- Additional network calls for session validation
- Session endpoint dependency
- Cookie-based authentication has cross-domain limitations
- Stateful architecture increases server overhead

## After: Stateless JWT Authentication

### Architecture Flow
```
Frontend → JWT Token (Authorization Header) → Backend → JWKS Verification
                                                  ↓
                                         Local Signature Check
```

### Components
- **Frontend**: Stores JWT in localStorage (encrypted in production)
- **Better Auth**: Issues JWT tokens via RS256 public/private key cryptography
- **JWKS Endpoint**: `/.well-known/jwks.json` provides public keys
- **Backend**: Verifies JWT signatures locally using cached JWKS
- **State Management**: Stateless - no server-side session storage

### Benefits
- Stateless architecture scales horizontally
- No additional network calls for validation
- Reduced server overhead
- Standardized authentication protocol
- Improved security with RS256 cryptography
- Better performance with local signature verification

## Technical Implementation Details

### JWT Structure
```json
{
  "sub": "user-unique-identifier",
  "email": "user@example.com",
  "name": "User Name",
  "exp": 1640995200,
  "iat": 1640991600,
  "iss": "https://your-better-auth-domain.com"
}
```

### Security Measures
- **Algorithm**: RS256 (RSA Signature with SHA-256)
- **Token Expiry**: 15 minutes (short-lived for security)
- **Issuer Validation**: Ensures tokens come from trusted Better Auth instance
- **Required Claims**: `sub`, `exp`, `iat`, `iss`
- **JWKS Caching**: Public keys cached for performance (1-hour TTL)

### Error Handling
- **Expired Token (401)**: Frontend clears token and redirects to login
- **Invalid Signature (401)**: Request rejected immediately
- **Missing Claims (401)**: JWT validation fails
- **Unreachable JWKS (500)**: Startup validation prevents server start

## Migration Impact

### Breaking Changes
- Session cookies no longer supported
- Custom session endpoint (`/api/auth/session`) removed
- `credentials: 'include'` removed from API calls
- Session validator dependency eliminated

### Performance Improvements
- **Latency**: Reduced by eliminating session validation calls
- **Throughput**: Increased by removing server-side session storage
- **Scalability**: Horizontal scaling without session affinity

### Development Experience
- Simpler authentication flow
- Standardized JWT handling
- Improved error messages
- Centralized authentication documentation

## Code Changes Summary

### Backend Changes
- `backend/src/config.py`: Added JWT configuration fields
- `backend/src/main.py`: Added JWKS validation in startup
- `backend/src/auth/dependencies.py`: Replaced session validation with JWT
- `backend/src/auth/jwt_handler.py`: Enhanced JWT verification
- `backend/src/auth/exceptions.py`: Added JWT-specific exceptions

### Frontend Changes
- `frontend/lib/auth/better-auth.ts`: Enabled JWT plugin
- `frontend/lib/auth/token-storage.ts`: New JWT management class
- `frontend/lib/auth/useSession.ts`: JWT token extraction
- `frontend/lib/api/client.ts`: Authorization header injection
- `frontend/lib/hooks/use-auth-redirect.ts`: Token-based redirect logic

### Files Removed
- `backend/src/auth/session_validator.py`
- `frontend/app/api/auth/session/route.ts`

## Production Considerations

### Security Requirements
- HTTPS required in production
- Content Security Policy (CSP) headers to prevent XSS
- Secure storage of JWT in production (encrypted localStorage)

### Monitoring
- Token validation success/failure rates
- JWKS endpoint availability
- Expired token frequency
- Cross-user access attempts

### Rollback Strategy
If JWT migration causes issues:
1. Restore session_validator.py
2. Revert backend dependencies.py to use session validation
3. Restore frontend session endpoint integration
4. Re-enable Better Auth session features

## Conclusion

The migration to stateless JWT authentication successfully addresses scalability concerns while improving performance and security. The implementation maintains full compatibility with Better Auth while eliminating session state dependencies, resulting in a more robust and scalable authentication system.