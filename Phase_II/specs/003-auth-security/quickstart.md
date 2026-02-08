# Quickstart: Stateless JWT Authentication

**Feature**: 003-auth-security
**Date**: 2026-02-07
**Status**: Complete

## Overview

This guide provides step-by-step instructions for setting up stateless JWT authentication using RS256 signature verification with JWKS public keys.

**Architecture**:
- **Frontend**: Next.js on Vercel
- **Backend**: FastAPI on HuggingFace
- **Auth**: Better Auth with JWT plugin (RS256)
- **Transport**: Authorization: Bearer <token> header
- **Verification**: JWKS public keys (stateless)

---

## Prerequisites

### Backend Requirements
- Python 3.13+
- FastAPI
- PostgreSQL database (Neon)
- Environment variable management

### Frontend Requirements
- Node.js 18+
- Next.js 16+ (App Router)
- TypeScript
- Better Auth

---

## Step 1: Environment Setup

### Backend Configuration

Create `.env` file in `backend/` directory:

```bash
# Database
NEON_DATABASE_URL=postgresql://user:password@host/database

# Better Auth Configuration
BETTER_AUTH_URL=https://app.example.com
BETTER_AUTH_JWKS_URL=https://app.example.com/.well-known/jwks.json

# Optional: JWKS Cache Configuration
JWKS_CACHE_TTL=3600  # 1 hour in seconds

# CORS Configuration
ALLOWED_ORIGINS=https://app.example.com,http://localhost:3000

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

### Frontend Configuration

Create `.env.local` file in `frontend/` directory:

```bash
# Better Auth Configuration
BETTER_AUTH_URL=https://app.example.com
BETTER_AUTH_SECRET=your-cryptographically-secure-secret-min-32-chars

# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://app.example.com

# Database
NEON_DATABASE_URL=postgresql://user:password@host/database
```

**Security Notes**:
- `BETTER_AUTH_SECRET` must be at least 32 characters
- Use `openssl rand -base64 32` to generate secure secrets
- Never commit `.env` or `.env.local` to version control

---

## Step 2: Backend Setup

### Install Dependencies

```bash
cd backend
pip install \
  "PyJWT[crypto]>=2.8.0" \
  "cryptography>=41.0.0" \
  "httpx>=0.24.0" \
  "fastapi>=0.109.0" \
  "pydantic>=2.0.0" \
  "pydantic-settings>=2.0.0"
```

### Create JWT Verifier Module

File: `backend/src/auth/jwt_verifier.py`

```python
import jwt
from jwt import PyJWKClient
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    exp: datetime
    iss: str

class JWTVerifier:
    def __init__(self, jwks_url: str, expected_issuer: str):
        self.jwks_client = PyJWKClient(
            jwks_url,
            cache_keys=True,
            max_cached_keys=16,
            cache_jwk_set_ttl=3600,  # 1 hour
            lifespan=3600,
        )
        self.expected_issuer = expected_issuer

    def verify_token(self, token: str) -> AuthenticatedUser:
        """Verify JWT token and extract user information."""
        # Get signing key from JWKS
        signing_key = self.jwks_client.get_signing_key_from_jwt(token)

        # Verify token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=self.expected_issuer,
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
            exp=datetime.fromtimestamp(payload["exp"]),
            iss=payload["iss"]
        )
```

### Create FastAPI Dependency

File: `backend/src/auth/dependencies.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    verifier: JWTVerifier = Depends(get_jwt_verifier),
) -> AuthenticatedUser:
    """FastAPI dependency that extracts and verifies JWT token."""
    token = credentials.credentials

    try:
        return verifier.verify_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

### Add Startup Validation

File: `backend/src/main.py`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Validate JWKS endpoint
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                settings.better_auth_jwks_url,
                timeout=10.0
            )
            response.raise_for_status()

            jwks_data = response.json()
            if not jwks_data.get("keys"):
                raise RuntimeError("JWKS endpoint returned no keys")

            logger.info(f"✅ JWKS validated: {len(jwks_data['keys'])} keys loaded")

    except Exception as e:
        logger.error(f"❌ JWKS validation failed: {e}")
        raise RuntimeError(f"JWKS endpoint unavailable: {e}")

    yield

app = FastAPI(lifespan=lifespan)
```

---

## Step 3: Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install better-auth
```

### Enable Better Auth JWT Plugin

File: `frontend/lib/auth/better-auth.ts`

```typescript
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins/jwt";
import { pool } from "@/lib/db/pool";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 15, // 15 minutes
    updateAge: 60 * 5,  // Refresh every 5 minutes
  },
  plugins: [
    jwt({
      issuer: process.env.BETTER_AUTH_URL,
      audience: process.env.NEXT_PUBLIC_API_URL,
      expiresIn: 60 * 15, // 15 minutes
      algorithm: "RS256",
    })
  ],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
```

### Create Token Storage Module

File: `frontend/lib/auth/token-storage.ts`

```typescript
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
}

const ACCESS_TOKEN_KEY = "better_auth_jwt_token";
const REFRESH_TOKEN_KEY = "better_auth_refresh_token";

export const tokenStorage = {
  set(tokenData: TokenData) {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.accessToken);
      if (tokenData.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refreshToken);
      }
    }
  },

  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  },

  clear() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },
};
```

### Update Sign-In Flow

File: `frontend/app/(auth)/signin/page.tsx`

```typescript
import { authClient } from "@/lib/auth/better-auth-client";
import { tokenStorage } from "@/lib/auth/token-storage";

async function handleSignIn(email: string, password: string) {
  const { data, error } = await authClient.signIn.email({
    email,
    password,
  });

  if (error) {
    console.error("Sign-in failed:", error);
    return;
  }

  if (data) {
    // Store JWT token in localStorage
    tokenStorage.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    // Redirect to dashboard
    router.push("/dashboard");
  }
}
```

### Update API Client

File: `frontend/lib/api/client.ts`

```typescript
import { tokenStorage } from "@/lib/auth/token-storage";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${path}`,
    { ...options, headers }
  );

  // Handle 401: Try token refresh
  if (response.status === 401) {
    const refreshed = await authClient.refresh({
      refreshToken: tokenStorage.getRefreshToken(),
    });

    if (refreshed.data) {
      tokenStorage.set({
        accessToken: refreshed.data.accessToken,
        refreshToken: refreshed.data.refreshToken,
      });

      // Retry with new token
      headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
      return apiRequest(path, { ...options, headers });
    } else {
      // Refresh failed, redirect to login
      tokenStorage.clear();
      window.location.href = "/signin";
      throw new Error("Session expired");
    }
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

---

## Step 4: Testing the Flow

### Test 1: Verify JWKS Endpoint

```bash
# Check Better Auth JWKS endpoint
curl https://app.example.com/.well-known/jwks.json

# Expected response:
# {
#   "keys": [
#     {
#       "kty": "RSA",
#       "kid": "key-id-abc123",
#       "use": "sig",
#       "alg": "RS256",
#       "n": "...",
#       "e": "AQAB"
#     }
#   ]
# }
```

### Test 2: Sign In and Obtain Token

```bash
# Sign in via frontend or API
curl -X POST https://app.example.com/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Expected response includes accessToken and refreshToken
```

### Test 3: Make Authenticated Request

```bash
# Use token in Authorization header
curl https://api.example.com/api/v1/me \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: 200 OK with user data
```

### Test 4: Test Invalid Token

```bash
# Expired or invalid token
curl https://api.example.com/api/v1/me \
  -H "Authorization: Bearer invalid-token"

# Expected: 401 Unauthorized
# {
#   "error": "Unauthorized",
#   "error_code": "invalid_token",
#   "message": "Invalid token: signature verification failed"
# }
```

### Test 5: Test User ID Scoping

```bash
# Try accessing another user's resources
curl https://api.example.com/api/v1/user-456/tasks \
  -H "Authorization: Bearer <user-123-token>"

# Expected: 403 Forbidden
# {
#   "error": "Forbidden",
#   "error_code": "forbidden",
#   "message": "Access denied: cannot access another user's resources"
# }
```

## Step 5: Testing JWT Authentication (Additional)

### Test JWT Configuration

Run the JWT configuration validation script to verify your setup:

```bash
cd backend
./scripts/validate-jwt-config.sh
```

This will check:
- BETTER_AUTH_SECRET length (minimum 32 characters)
- JWKS endpoint reachability
- JSON response validity
- Supported algorithms

### Test JWT Authentication with cURL

```bash
# 1. Obtain a JWT token from Better Auth (via sign-in)
#    Save the token to a variable
TOKEN="your-jwt-token-from-better-auth"

# 2. Make an authenticated request to the backend
curl -X GET http://localhost:8000/api/user-id/me \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with user information

# 3. Test with an expired token
curl -X GET http://localhost:8000/api/user-id/me \
  -H "Authorization: Bearer expired-token"

# Expected: 401 Unauthorized

# 4. Test cross-user access protection
curl -X GET http://localhost:8000/api/other-user-id/tasks \
  -H "Authorization: Bearer user-own-token"

# Expected: 403 Forbidden
```

### Automated Testing

Run the JWT-specific tests:

```bash
# Backend JWT tests
cd backend
pytest tests/test_jwt_authentication.py
pytest tests/test_jwt_authorization.py
pytest tests/test_jwks_startup.py
pytest tests/test_e2e_jwt_flow.py

# Frontend JWT tests
cd frontend
npm run test:unit tests/token-storage.test.ts
npm run test:unit tests/api-client-jwt.test.ts
```

### JWT Security Validation

Verify the security headers are in place:

```bash
# Check security headers on frontend
curl -I https://your-frontend-domain.com

# Look for these headers:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

---

## Step 5: Deployment Checklist

### Backend Deployment (HuggingFace)

- [ ] Environment variables configured
- [ ] JWKS endpoint URL validated
- [ ] HTTPS enabled in production
- [ ] CORS configured for frontend origin
- [ ] Startup validation passes (JWKS fetch successful)
- [ ] Health check endpoint responds

### Frontend Deployment (Vercel)

- [ ] Environment variables configured
- [ ] Better Auth JWT plugin enabled
- [ ] localStorage token storage implemented
- [ ] Authorization header sent in all API requests
- [ ] Token refresh flow implemented
- [ ] CSP headers configured (XSS protection)

### Security Checklist

- [ ] Tokens short-lived (15-60 minutes)
- [ ] Refresh tokens properly managed
- [ ] HTTPS enforced in production
- [ ] JWKS endpoint accessible from backend
- [ ] No secrets in client-side code
- [ ] CSP headers prevent XSS
- [ ] Token cleared on logout

---

## Troubleshooting

### Issue: "JWKS endpoint unavailable"

**Symptoms**: Backend fails to start

**Solution**:
1. Verify `BETTER_AUTH_JWKS_URL` is correct
2. Check Better Auth is running and JWT plugin enabled
3. Test JWKS endpoint manually: `curl $BETTER_AUTH_JWKS_URL`

### Issue: "Invalid token: signature verification failed"

**Symptoms**: 401 errors on authenticated requests

**Solution**:
1. Verify token is not expired
2. Check Better Auth is using RS256 algorithm
3. Verify JWKS endpoint returns valid RS256 keys
4. Clear JWKS cache and restart backend

### Issue: "Token has expired"

**Symptoms**: 401 errors after 15 minutes

**Solution**:
1. Implement token refresh flow
2. Check token expiration on frontend before making requests
3. Automatically refresh tokens before expiration

### Issue: "Access denied: cannot access another user's resources"

**Symptoms**: 403 errors when accessing resources

**Solution**:
1. Verify user ID in path matches JWT `sub` claim
2. Check URL encoding/decoding
3. Ensure frontend sends correct user ID in URLs

---

## Performance Metrics

**Target Metrics**:
- JWT verification: <10ms (with cached JWKS)
- JWKS cache hit rate: >99%
- Token refresh latency: <200ms
- Zero session endpoint calls

**Monitoring**:
- Log JWKS cache hit/miss rates
- Monitor JWT verification latency
- Track token expiration and refresh rates
- Alert on JWKS endpoint failures

---

## Next Steps

1. ✅ Environment setup complete
2. ✅ Backend JWT verification implemented
3. ✅ Frontend token storage implemented
4. ✅ Testing complete
5. ⏳ Deploy to production
6. ⏳ Monitor performance metrics
7. ⏳ Implement advanced features (MFA, SSO)

---

## Additional Resources

- [Better Auth Documentation](https://better-auth.com/docs)
- [PyJWT Documentation](https://pyjwt.readthedocs.io/)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [RFC 7517 - JSON Web Key](https://tools.ietf.org/html/rfc7517)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
