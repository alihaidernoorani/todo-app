# Research Findings: Stateless JWT Authentication

**Feature**: 003-auth-security
**Date**: 2026-02-07
**Status**: Complete

## Overview

This document consolidates research findings for migrating from session-cookie based authentication to stateless JWT authentication using RS256 and JWKS. All 8 research tasks have been completed with decisions, rationale, and implementation guidance.

---

## RT-001: Better Auth JWT Plugin Configuration

### Question
How to enable Better Auth JWT plugin with RS256 signing?

### Research Findings

Better Auth provides a JWT plugin that generates JWT tokens on sign-in. Configuration requires:

1. **Import the JWT plugin**:
```typescript
import { jwt } from "better-auth/plugins/jwt"
```

2. **Enable in Better Auth configuration**:
```typescript
export const auth = betterAuth({
  // ... other config
  plugins: [
    jwt({
      // JWT configuration
      issuer: process.env.BETTER_AUTH_URL,
      audience: process.env.BETTER_AUTH_AUDIENCE || process.env.NEXT_PUBLIC_API_URL,
      expiresIn: 60 * 15, // 15 minutes in seconds
      algorithm: "RS256", // Use RS256 for JWKS compatibility
    })
  ]
})
```

3. **Key Generation**: Better Auth automatically generates RS256 key pairs when JWT plugin is enabled. Private key signs tokens, public key exposed via JWKS endpoint.

### Decision
**Enable Better Auth JWT plugin with RS256 algorithm and 15-minute expiration**

### Rationale
- RS256 enables asymmetric verification (backend can verify without shared secret)
- 15-minute expiration balances security (limits exposure) with UX (reduces refresh frequency)
- Better Auth handles key generation and rotation automatically
- JWKS endpoint automatically exposed at `/.well-known/jwks.json`

### Alternatives Considered
- **HS256 (symmetric)**: Rejected - requires shared secret between frontend and backend, violates stateless principle
- **30-minute expiration**: Rejected - longer token lifetime increases security risk if token stolen
- **5-minute expiration**: Rejected - too short, causes poor UX with frequent refresh prompts

### Implementation Snippet
```typescript
// frontend/lib/auth/better-auth.ts
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins/jwt"

export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 15, // 15 minutes
    updateAge: 60 * 5,  // Refresh every 5 minutes
  },
  plugins: [
    jwt({
      issuer: process.env.BETTER_AUTH_URL,
      audience: process.env.NEXT_PUBLIC_API_URL,
      expiresIn: 60 * 15,
      algorithm: "RS256",
    })
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  }
})
```

---

## RT-002: JWKS Endpoint Discovery

### Question
What is the JWKS endpoint URL format for Better Auth?

### Research Findings

Better Auth follows standard OAuth 2.0 / OpenID Connect conventions:

1. **JWKS Endpoint**: `{BETTER_AUTH_URL}/.well-known/jwks.json`
2. **Response Format**:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id-string",
      "use": "sig",
      "alg": "RS256",
      "n": "modulus-base64url-encoded",
      "e": "exponent-base64url-encoded"
    }
  ]
}
```

3. **Key Rotation**: Better Auth may expose multiple keys during rotation periods (old + new)

### Decision
**Use standard JWKS endpoint at `/.well-known/jwks.json`**

### Rationale
- Industry standard (RFC 7517 - JSON Web Key)
- Better Auth automatically exposes this endpoint when JWT plugin enabled
- Backend can fetch public keys without authentication
- Supports key rotation seamlessly

### Alternatives Considered
- **Custom endpoint**: Rejected - non-standard, requires additional configuration
- **Hardcoded public key**: Rejected - doesn't support key rotation, requires redeployment on key change

### Implementation Notes
```python
# Backend JWKS URL construction
JWKS_URL = f"{BETTER_AUTH_URL}/.well-known/jwks.json"

# Example fetch
async def fetch_jwks():
    async with httpx.AsyncClient() as client:
        response = await client.get(JWKS_URL)
        response.raise_for_status()
        return response.json()
```

---

## RT-003: PyJWT RS256 Verification

### Question
How to verify RS256 JWT signatures using PyJWT with JWKS public keys?

### Research Findings

PyJWT library provides robust RS256 verification:

1. **Install Dependencies**:
```bash
pip install PyJWT[crypto]>=2.8.0 cryptography>=41.0.0
```

2. **JWKS Fetching and Key Conversion**:
```python
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from jwt import PyJWKClient

# Option 1: Use PyJWKClient (recommended)
jwks_client = PyJWKClient(JWKS_URL)
signing_key = jwks_client.get_signing_key_from_jwt(token)

# Option 2: Manual fetch and convert
def jwk_to_pem(jwk: dict) -> bytes:
    # Convert JWK to PEM format for PyJWT
    from jwt.algorithms import RSAAlgorithm
    public_key = RSAAlgorithm.from_jwk(json.dumps(jwk))
    return public_key
```

3. **Token Verification**:
```python
decoded = jwt.decode(
    token,
    signing_key.key,
    algorithms=["RS256"],
    issuer=EXPECTED_ISSUER,
    options={
        "verify_signature": True,
        "verify_exp": True,
        "verify_iss": True,
        "require": ["sub", "exp", "iss"]
    }
)
```

### Decision
**Use PyJWT with PyJWKClient for automatic JWKS fetching and caching**

### Rationale
- PyJWKClient handles JWKS fetching and caching automatically
- Built-in support for key rotation (fetches multiple keys)
- Validates token signatures with proper RS256 verification
- Enforces required claims and expiration

### Alternatives Considered
- **Manual JWK conversion**: Rejected - more code, error-prone, doesn't handle caching
- **python-jose library**: Rejected - PyJWT is more widely used and better maintained
- **Custom verification**: Rejected - security-critical code should use established libraries

### Security Considerations
- Always verify `iss` claim matches expected Better Auth URL
- Always verify `exp` claim to reject expired tokens
- Require `sub` claim for user identity
- Use `algorithms=["RS256"]` explicitly (prevents algorithm confusion attacks)

---

## RT-004: JWKS Caching Strategy

### Question
What caching strategy prevents JWKS endpoint overload while ensuring key rotation?

### Research Findings

Industry best practices for JWKS caching:

1. **TTL-Based Caching**: Cache keys for 1-6 hours
2. **On-Demand Refresh**: Refresh when signature verification fails (handles rotation)
3. **Stale-While-Revalidate**: Serve cached keys while fetching new keys in background

**Recommended Strategy**:
- Cache JWKS keys for **1 hour** (3600 seconds)
- On signature verification failure, refresh cache and retry once
- Startup validation: Fetch JWKS on application start (fail if unavailable)

### Decision
**Implement 1-hour TTL cache with on-demand refresh and startup validation**

### Rationale
- 1-hour TTL balances performance (reduces JWKS requests) with freshness (handles rotation)
- On-demand refresh handles key rotation transparently
- Startup validation ensures JWKS availability before accepting traffic (fail-safe)
- PyJWKClient provides built-in caching with these strategies

### Alternatives Considered
- **No caching**: Rejected - unnecessary load on JWKS endpoint, adds latency
- **24-hour TTL**: Rejected - too long, delays key rotation propagation
- **5-minute TTL**: Rejected - too short, increases JWKS endpoint load
- **Manual cache invalidation**: Rejected - complex, error-prone

### Implementation Pattern
```python
from jwt import PyJWKClient

jwks_client = PyJWKClient(
    JWKS_URL,
    cache_keys=True,
    max_cached_keys=16,  # Cache up to 16 keys
    cache_jwk_set_ttl=3600,  # 1 hour TTL
    lifespan=3600,  # Refresh after 1 hour
)

# Startup validation
async def validate_jwks_on_startup():
    try:
        # Fetch JWKS to populate cache
        jwks = await fetch_jwks()
        if not jwks.get("keys"):
            raise RuntimeError("JWKS endpoint returned no keys")
    except Exception as e:
        raise RuntimeError(f"JWKS endpoint unavailable: {e}")
```

### Cache Performance Metrics
- **Hit rate target**: >99% (with 1-hour TTL and typical traffic patterns)
- **Miss penalty**: ~50-200ms (JWKS fetch over network)
- **Verification latency**: <1ms (cached) vs ~50-200ms (cache miss)

---

## RT-005: Frontend JWT Storage Security

### Question
Is localStorage secure for JWT tokens? What are XSS mitigation strategies?

### Research Findings

**localStorage Security Analysis**:

**Pros**:
- Simple API, no server-side session required
- Works across tabs
- Survives page refreshes

**Cons**:
- Vulnerable to XSS attacks (JavaScript can read localStorage)
- Not httpOnly (accessible to any script on the page)

**XSS Mitigation Strategies**:

1. **Content Security Policy (CSP)**:
```typescript
// next.config.js
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
  frame-ancestors 'none';
`;

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ];
  },
};
```

2. **Input Sanitization**: Sanitize all user inputs before rendering
3. **Trusted Dependencies**: Audit and minimize third-party scripts
4. **Short-Lived Tokens**: Use 15-minute expiration to limit exposure window

### Decision
**Use localStorage with CSP headers and short-lived tokens (15 minutes)**

### Rationale
- Necessary for stateless cross-domain architecture (cookies don't work across domains)
- CSP headers block inline scripts and untrusted origins (mitigates XSS)
- Short token lifetime limits damage if token stolen
- Simpler than memory-only storage (no tab sync issues)

### Alternatives Considered
- **HttpOnly cookies**: Rejected - doesn't work across different domains (Vercel + HuggingFace)
- **SessionStorage**: Rejected - doesn't persist across tabs, poor UX
- **Memory-only storage**: Rejected - lost on page refresh, complex tab synchronization
- **IndexedDB**: Rejected - overkill for single value, same XSS vulnerability as localStorage

### OWASP Recommendations
- ✅ Use CSP headers
- ✅ Use short-lived tokens (15-60 minutes)
- ✅ Implement token refresh flow
- ✅ Clear tokens on logout
- ✅ Validate token on every sensitive operation

### Implementation
```typescript
// frontend/lib/auth/token-storage.ts
const TOKEN_KEY = "better_auth_jwt_token";

export const tokenStorage = {
  set: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  get: (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  remove: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};
```

---

## RT-006: Token Lifecycle Management

### Question
How does Better Auth handle token refresh with JWT plugin?

### Research Findings

Better Auth JWT plugin provides built-in token refresh:

1. **Token Types**:
   - **Access Token**: Short-lived (15 minutes), used for API requests
   - **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

2. **Refresh Flow**:
```typescript
// Client-side refresh
const { data, error } = await authClient.refresh({
  refreshToken: storedRefreshToken
});

if (data) {
  // New access token
  tokenStorage.set(data.accessToken);
}
```

3. **Automatic Refresh**: Better Auth client can automatically refresh tokens before expiration

### Decision
**Implement automatic token refresh with Better Auth client**

### Rationale
- Better Auth handles refresh logic (reduces custom code)
- Automatic refresh improves UX (no interruption)
- Refresh tokens stored separately with longer TTL

### Implementation Pattern
```typescript
// frontend/lib/auth/auth-client.ts
import { createAuthClient } from "better-auth/client"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [
    // JWT plugin automatically handles refresh
  ],
});

// API client interceptor for automatic refresh
async function requestWithTokenRefresh(url: string, options: RequestInit) {
  const token = tokenStorage.get();

  // Add Authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  // Make request
  let response = await fetch(url, { ...options, headers });

  // If 401, try refreshing token
  if (response.status === 401) {
    const refreshed = await authClient.refresh();
    if (refreshed.data) {
      tokenStorage.set(refreshed.data.accessToken);

      // Retry with new token
      headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}
```

---

## RT-007: FastAPI Dependency Pattern for JWT

### Question
What is the idiomatic FastAPI pattern for JWT extraction and verification?

### Research Findings

FastAPI provides dependency injection for authentication:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    jwks_client: PyJWKClient = Depends(get_jwks_client),
) -> AuthenticatedUser:
    """
    FastAPI dependency that extracts and verifies JWT token.
    Returns authenticated user or raises HTTPException.
    """
    token = credentials.credentials

    try:
        # Get signing key from JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Verify token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=settings.better_auth_url,
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": True,
                "require": ["sub", "exp", "iss"]
            }
        )

        # Extract user info
        return AuthenticatedUser(
            user_id=payload["sub"],
            email=payload.get("email", ""),
            name=payload.get("name"),
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
```

### Decision
**Use FastAPI HTTPBearer security with dependency injection**

### Rationale
- FastAPI HTTPBearer automatically extracts Authorization header
- Dependency injection enables reusable, testable authentication
- Standard pattern recognized by OpenAPI/Swagger documentation
- Easy to apply to any endpoint with `Depends(get_current_user)`

### Usage in Endpoints
```python
@router.get("/me")
async def get_current_user_info(
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "name": current_user.name,
    }

# With user ID scoping
@router.get("/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
) -> list[Task]:
    # Validate user can only access their own tasks
    if current_user.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access another user's resources"
        )

    return await task_service.get_tasks(user_id)
```

---

## RT-008: JWKS Startup Validation

### Question
How to fail application startup if JWKS endpoint is unreachable?

### Research Findings

FastAPI provides lifespan events for startup validation:

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Validate JWKS endpoint
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.better_auth_url}/.well-known/jwks.json",
                timeout=10.0
            )
            response.raise_for_status()

            jwks_data = response.json()
            if not jwks_data.get("keys"):
                raise RuntimeError("JWKS endpoint returned no keys")

            app.state.jwks_client = PyJWKClient(
                f"{settings.better_auth_url}/.well-known/jwks.json",
                cache_keys=True,
                max_cached_keys=16,
                cache_jwk_set_ttl=3600,
            )

            logger.info(f"✅ JWKS endpoint validated: {len(jwks_data['keys'])} keys loaded")

    except Exception as e:
        logger.error(f"❌ JWKS endpoint validation failed: {e}")
        raise RuntimeError(
            f"Cannot start application: JWKS endpoint unavailable at "
            f"{settings.better_auth_url}/.well-known/jwks.json"
        ) from e

    yield

    # Shutdown: Cleanup if needed
    pass

app = FastAPI(lifespan=lifespan)
```

### Decision
**Implement fail-safe startup validation using FastAPI lifespan events**

### Rationale
- Prevents insecure deployment (app won't start without JWKS)
- Clear error messages aid debugging
- Pre-populates JWKS cache (first request won't have cache miss)
- Standard FastAPI pattern

### Startup Checklist
1. ✅ Fetch JWKS from Better Auth endpoint
2. ✅ Validate response contains keys array
3. ✅ Initialize PyJWKClient with fetched keys
4. ✅ Log success with key count
5. ✅ Raise RuntimeError if any step fails

---

## Summary of Decisions

| Research Task | Decision | Key Benefit |
|--------------|----------|-------------|
| RT-001 | Enable JWT plugin with RS256, 15-min expiry | Asymmetric verification, security/UX balance |
| RT-002 | Use standard `/.well-known/jwks.json` endpoint | Industry standard, supports key rotation |
| RT-003 | PyJWT with PyJWKClient for verification | Robust, handles caching, widely used |
| RT-004 | 1-hour JWKS cache TTL with on-demand refresh | Performance + freshness balance |
| RT-005 | localStorage with CSP headers, short tokens | Necessary for cross-domain, XSS mitigation |
| RT-006 | Automatic token refresh with Better Auth | Seamless UX, reduces custom code |
| RT-007 | FastAPI HTTPBearer with dependency injection | Idiomatic, reusable, testable |
| RT-008 | Fail-safe startup validation with lifespan | Prevents insecure deployment |

---

## Next Steps

1. ✅ Research complete (this document)
2. ⏳ Create data-model.md with entity definitions
3. ⏳ Create contracts/ with OpenAPI specifications
4. ⏳ Create quickstart.md with setup instructions
5. ⏳ Update agent context with new technologies

**Status**: Phase 0 complete. Ready for Phase 1 design.
