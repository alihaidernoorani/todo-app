# JWT Authentication Flow

**Date**: 2026-02-07
**Type**: Stateless JWT Authentication with RS256/JWKS
**Status**: Active

## Overview

This backend uses **stateless JWT authentication** with RS256 signature verification via JWKS (JSON Web Key Set). All authentication is performed locally without external API calls, enabling cross-domain deployment (Vercel frontend + HuggingFace backend).

## Architecture

```
┌─────────────┐      JWT Token       ┌──────────────┐
│   Frontend  │ ──────────────────► │   Backend    │
│  (Next.js)  │   Authorization:     │  (FastAPI)   │
│             │   Bearer <token>     │              │
└─────────────┘                      └──────┬───────┘
                                            │
                                            │ Verifies with
                                            ▼
                                     ┌─────────────┐
                                     │ Better Auth │
                                     │ JWKS Keys   │
                                     │ (Public)    │
                                     └─────────────┘
```

## Authentication Flow

### 1. User Signs In (Frontend)
```typescript
// User enters credentials
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123"
})

// Better Auth returns JWT token
const token = session.token // RS256 signed JWT

// Store in localStorage
TokenStorage.setAccessToken(token)
```

### 2. API Request (Frontend)
```typescript
// API client automatically injects token
const headers = {
  'Authorization': `Bearer ${TokenStorage.getAccessToken()}`,
  'Content-Type': 'application/json'
}

fetch('/api/{user_id}/tasks', { headers })
```

### 3. Token Verification (Backend)
```python
# FastAPI extracts token from Authorization header
credentials: HTTPAuthorizationCredentials = Depends(security)
token = credentials.credentials

# Verify signature using JWKS public keys
jwks_client = PyJWKClient(settings.better_auth_jwks_url)
signing_key = jwks_client.get_signing_key_from_jwt(token)

payload = jwt.decode(
    token,
    signing_key.key,
    algorithms=["RS256"],
    issuer=settings.better_auth_url,
    options={"require": ["sub", "exp", "iat", "iss"]}
)

# Extract user identity
user = AuthenticatedUser(
    user_id=payload["sub"],
    email=payload.get("email", ""),
    name=payload.get("name")
)
```

## FastAPI Dependencies

### `get_current_user()` - Authentication Only

**Use Case**: Endpoints that need authentication but no user-specific path validation.

**Example**: `/auth/me` endpoint

```python
from typing import Annotated
from fastapi import Depends
from src.auth import get_current_user
from src.auth.models import AuthenticatedUser

@router.get("/me")
async def get_current_user_info(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    return {"user_id": user.user_id, "email": user.email}
```

**What it does**:
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Verifies signature using JWKS
3. Validates expiration and required claims
4. Returns `AuthenticatedUser` object

**Errors**:
- `401 Unauthorized`: Token missing, expired, or invalid
- `503 Service Unavailable`: JWKS endpoint unreachable

---

### `get_current_user_with_path_validation()` - Authorization + User Scoping

**Use Case**: Endpoints with `{user_id}` in path that require user identity matching.

**Example**: `/api/{user_id}/tasks` endpoints

```python
from typing import Annotated
from fastapi import Depends
from src.auth import get_current_user_with_path_validation
from src.auth.models import AuthenticatedUser

@router.get("/{user_id}/tasks")
async def list_tasks(
    user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)]
):
    # user.user_id is GUARANTEED to match path {user_id}
    return {"tasks": [...]}
```

**What it does**:
1. All steps from `get_current_user()` (JWT verification)
2. Extracts `{user_id}` from path parameters
3. Compares JWT `sub` claim with path `user_id`
4. Blocks request if mismatch detected

**Errors**:
- `401 Unauthorized`: Token missing, expired, or invalid
- `403 Forbidden`: JWT user_id doesn't match path user_id
- `503 Service Unavailable`: JWKS endpoint unreachable

---

## Adding Authentication to New Endpoints

### Step 1: Choose the Right Dependency

| Endpoint Pattern | Dependency | Reason |
|-----------------|------------|--------|
| `/auth/me` | `get_current_user` | No path user_id |
| `/api/{user_id}/tasks` | `get_current_user_with_path_validation` | User-scoped resource |
| `/api/{user_id}/tasks/{task_id}` | `get_current_user_with_path_validation` | User-scoped resource |
| `/health` | None | Public endpoint |

### Step 2: Add Dependency to Endpoint

**Authentication Only**:
```python
from typing import Annotated
from fastapi import Depends
from src.auth import get_current_user
from src.auth.models import AuthenticatedUser

@router.get("/profile")
async def get_profile(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    return {"user_id": user.user_id}
```

**Authentication + User Scoping**:
```python
from typing import Annotated
from fastapi import Depends
from src.auth import get_current_user_with_path_validation
from src.auth.models import AuthenticatedUser

@router.get("/{user_id}/settings")
async def get_settings(
    user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)]
):
    # user.user_id matches path {user_id}
    return {"settings": {...}}
```

### Step 3: Handle Errors in Frontend

```typescript
try {
  const response = await apiClient.get(userId, '/tasks')
} catch (error) {
  if (error.status === 401) {
    // Token expired - redirect to login
    TokenStorage.clearAccessToken()
    router.push('/login')
  } else if (error.status === 403) {
    // User tried to access another user's resources
    showError('Access denied')
  }
}
```

## Token Structure

### JWT Header
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id-12345"
}
```

### JWT Payload (Claims)
```json
{
  "sub": "user-uuid-1234",          // User ID (REQUIRED)
  "email": "user@example.com",      // User email (optional)
  "name": "John Doe",               // User name (optional)
  "iss": "https://app.vercel.app",  // Issuer (REQUIRED)
  "aud": "https://api.hf.space",    // Audience (optional)
  "exp": 1234567890,                // Expiration (REQUIRED)
  "iat": 1234567000                 // Issued at (REQUIRED)
}
```

### JWT Signature
```
RS256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  better_auth_private_key
)
```

## Security Considerations

### ✅ Secure Practices
- RS256 public/private key cryptography (more secure than HS256 symmetric keys)
- Short-lived tokens (15 minutes) limit exposure window
- JWKS keys cached locally (1 hour TTL) for performance
- Token stored in localStorage (requires CSP headers for XSS protection)
- Backend verifies signature locally (no external API calls)
- Issuer validation prevents token substitution attacks

### ⚠️ Security Requirements
1. **HTTPS Required**: Always use HTTPS in production to prevent token interception
2. **CSP Headers**: Implement Content Security Policy to mitigate XSS attacks
3. **JWKS Endpoint**: Must be publicly accessible from backend
4. **Token Rotation**: Users must re-authenticate every 15 minutes (short expiry)
5. **Environment Variables**: Never hardcode secrets in source code

## Troubleshooting

### 401 Unauthorized - "Token expired"
**Cause**: JWT `exp` claim is in the past
**Solution**: User must sign in again to get a fresh token

### 401 Unauthorized - "Invalid token: signature verification failed"
**Cause**: Token was tampered with or signed with wrong key
**Solution**: Clear localStorage and sign in again

### 403 Forbidden - "JWT user_id does not match path parameter"
**Cause**: User tried to access another user's resources
**Solution**: Verify frontend sends correct user_id in path

### 503 Service Unavailable - "Authentication service unavailable"
**Cause**: JWKS endpoint unreachable or Better Auth down
**Solution**: Check Better Auth deployment, verify JWKS URL in environment variables

### Application Won't Start - "JWKS endpoint returned no keys"
**Cause**: Better Auth JWT plugin not enabled or JWKS URL incorrect
**Solution**:
1. Enable JWT plugin in Better Auth configuration
2. Verify `BETTER_AUTH_URL` environment variable
3. Test JWKS endpoint: `curl https://your-auth-url/.well-known/jwks.json`

## Environment Variables

### Backend (FastAPI)

```bash
# Required
BETTER_AUTH_URL=https://your-app.vercel.app  # Base URL of Better Auth instance

# Optional (for HS256 fallback in development)
BETTER_AUTH_SECRET=your-32-char-secret-key   # Shared secret for HS256
```

### Frontend (Next.js)

```bash
# Required
BETTER_AUTH_URL=https://your-app.vercel.app  # Same as backend
BETTER_AUTH_SECRET=your-32-char-secret-key   # For JWT signing

# Optional
NEXT_PUBLIC_API_URL=https://api.hf.space     # Backend API URL
```

## Testing Authentication

### Test Valid Token
```bash
# Get token from frontend localStorage
TOKEN="eyJhbGc..."

# Make authenticated request
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with user info
```

### Test Expired Token
```bash
# Use old/expired token
TOKEN="expired-token"

curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 401 Unauthorized
```

### Test Cross-User Access
```bash
# User A's token, User B's path
TOKEN="user-a-token"

curl -X GET "http://localhost:8000/api/user-b-id/tasks" \
  -H "Authorization: Bearer $TOKEN"

# Expected: 403 Forbidden
```

## Migration Notes

This authentication system replaced the previous session-cookie based approach. Key changes:

| Aspect | Before (Session) | After (JWT) |
|--------|------------------|-------------|
| Auth Method | Session cookies | JWT tokens |
| State | Stateful (server) | Stateless (cryptographic) |
| Verification | `/api/auth/session` call | Local JWKS signature check |
| Storage | HttpOnly cookies | localStorage |
| Cross-Domain | ❌ Requires same domain | ✅ Works cross-domain |
| Performance | ~50ms (API call) | <10ms (local verify) |

**Backwards Compatibility**: None. All clients must migrate to JWT-based authentication.

## References

- [Better Auth JWT Plugin](https://better-auth.com/docs/plugins/jwt)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [JWKS Specification](https://datatracker.ietf.org/doc/html/rfc7517)
- [OAuth 2.0 JWT Profile](https://datatracker.ietf.org/doc/html/rfc7523)
