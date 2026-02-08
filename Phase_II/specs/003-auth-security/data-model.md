# Data Model: Stateless JWT Authentication

**Feature**: 003-auth-security
**Date**: 2026-02-07
**Status**: Complete

## Overview

This document defines the data structures for stateless JWT authentication using RS256 signature verification with JWKS public keys. All models are defined using Pydantic (backend) and TypeScript interfaces (frontend).

---

## 1. JWT Token Structure

### Token Format

JWT tokens follow the standard three-part structure:
```
<header>.<payload>.<signature>
```

Each part is Base64url-encoded.

### Header

```json
{
  "alg": "RS256",
  "kid": "key-id-abc123",
  "typ": "JWT"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `alg` | string | Signature algorithm (RS256) |
| `kid` | string | Key ID for JWKS lookup |
| `typ` | string | Token type (always "JWT") |

### Payload (Claims)

```json
{
  "sub": "user-uuid-abc123",
  "iss": "https://app.example.com",
  "aud": "https://api.example.com",
  "exp": 1706274900,
  "iat": 1706274000,
  "email": "user@example.com",
  "name": "John Doe"
}
```

#### Standard Claims

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | string | ✅ | Subject - User ID (primary key) |
| `iss` | string | ✅ | Issuer - Better Auth URL |
| `aud` | string | ⚠️ | Audience - API URL (optional) |
| `exp` | number | ✅ | Expiration - Unix timestamp (seconds) |
| `iat` | number | ✅ | Issued At - Unix timestamp (seconds) |

#### Custom Claims

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ⚠️ | User email address |
| `name` | string | ⚠️ | User display name |
| `email_verified` | boolean | ⚠️ | Email verification status |
| `image` | string | ⚠️ | User avatar URL |

### Signature

RS256 signature created using Better Auth's private key. Backend verifies using public key from JWKS endpoint.

---

## 2. JWKS (JSON Web Key Set) Format

### JWKS Response

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id-abc123",
      "use": "sig",
      "alg": "RS256",
      "n": "modulus-base64url-encoded-very-long-string...",
      "e": "AQAB"
    }
  ]
}
```

### JWKS Key Fields

| Field | Type | Description |
|-------|------|-------------|
| `kty` | string | Key type (always "RSA") |
| `kid` | string | Key identifier (matches JWT header) |
| `use` | string | Key usage ("sig" for signature) |
| `alg` | string | Algorithm (RS256) |
| `n` | string | RSA modulus (Base64url encoded) |
| `e` | string | RSA public exponent (Base64url) |

### Pydantic Model (Backend)

```python
from pydantic import BaseModel, Field

class JWKKey(BaseModel):
    """JSON Web Key from JWKS endpoint."""
    
    kty: str = Field(..., description="Key type (RSA)")
    kid: str = Field(..., description="Key identifier")
    use: str = Field(..., description="Key usage (sig)")
    alg: str = Field(..., description="Algorithm (RS256)")
    n: str = Field(..., description="RSA modulus (Base64url)")
    e: str = Field(..., description="RSA exponent (Base64url)")

class JWKSResponse(BaseModel):
    """JWKS endpoint response."""
    
    keys: list[JWKKey] = Field(..., description="Array of public keys")
```

---

## 3. Authenticated User Model (Backend)

### Pydantic Model

```python
from pydantic import BaseModel, Field
from datetime import datetime

class AuthenticatedUser(BaseModel):
    """Represents an authenticated user extracted from JWT token.
    
    This model is returned by authentication dependencies and used
    throughout the application to represent the current user.
    """
    
    user_id: str = Field(..., description="User ID from JWT sub claim")
    email: str = Field(..., description="User email from JWT claim")
    name: str | None = Field(None, description="User display name")
    exp: datetime = Field(..., description="Token expiration timestamp")
    iss: str = Field(..., description="Token issuer (Better Auth URL)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user-uuid-abc123",
                "email": "user@example.com",
                "name": "John Doe",
                "exp": "2026-01-26T15:15:00Z",
                "iss": "https://app.example.com"
            }
        }
```

### Field Mapping

| Model Field | JWT Claim | Source |
|-------------|-----------|--------|
| `user_id` | `sub` | JWT payload |
| `email` | `email` | JWT payload |
| `name` | `name` | JWT payload (optional) |
| `exp` | `exp` | JWT payload (converted to datetime) |
| `iss` | `iss` | JWT payload |

---

## 4. JWKS Cache Entry Model (Backend)

### Cache Entry Structure

```python
from pydantic import BaseModel, Field
from datetime import datetime
from cryptography.hazmat.primitives.asymmetric import rsa

class JWKSCacheEntry(BaseModel):
    """Cached JWKS key with TTL metadata.
    
    Used by PyJWKClient for internal caching. This is primarily
    for documentation - PyJWKClient handles caching internally.
    """
    
    kid: str = Field(..., description="Key identifier")
    public_key: str = Field(..., description="PEM-encoded RSA public key")
    cached_at: datetime = Field(..., description="Cache timestamp")
    ttl_seconds: int = Field(default=3600, description="Time to live (1 hour)")
    
    def is_expired(self) -> bool:
        """Check if cache entry has expired."""
        age_seconds = (datetime.utcnow() - self.cached_at).total_seconds()
        return age_seconds > self.ttl_seconds
    
    class Config:
        arbitrary_types_allowed = True
```

### Cache Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `cache_keys` | `True` | Enable caching |
| `max_cached_keys` | `16` | Maximum keys to cache |
| `cache_jwk_set_ttl` | `3600` | Cache TTL (1 hour in seconds) |
| `lifespan` | `3600` | Refresh interval (1 hour) |

---

## 5. JWT Verification Result Model (Backend)

### Result Model

```python
from pydantic import BaseModel, Field
from enum import Enum

class JWTErrorCode(str, Enum):
    """Error codes for JWT verification failures."""
    
    EXPIRED = "expired"
    INVALID_SIGNATURE = "invalid_signature"
    INVALID_ISSUER = "invalid_issuer"
    MISSING_CLAIM = "missing_claim"
    MALFORMED = "malformed"
    JWKS_UNAVAILABLE = "jwks_unavailable"

class JWTVerificationResult(BaseModel):
    """Result of JWT token verification.
    
    Contains either successful user data or error information.
    """
    
    valid: bool = Field(..., description="Whether token is valid")
    user: AuthenticatedUser | None = Field(None, description="Authenticated user if valid")
    error: str | None = Field(None, description="Error message if invalid")
    error_code: JWTErrorCode | None = Field(None, description="Error code if invalid")
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "valid": True,
                    "user": {
                        "user_id": "user-uuid-abc123",
                        "email": "user@example.com",
                        "name": "John Doe",
                        "exp": "2026-01-26T15:15:00Z",
                        "iss": "https://app.example.com"
                    },
                    "error": None,
                    "error_code": None
                },
                {
                    "valid": False,
                    "user": None,
                    "error": "Token has expired",
                    "error_code": "expired"
                }
            ]
        }
```

---

## 6. Authentication Error Response Model (Backend)

### Error Response

```python
from pydantic import BaseModel, Field
from enum import Enum

class AuthErrorCode(str, Enum):
    """Standardized error codes for authentication failures."""
    
    MISSING_TOKEN = "missing_token"
    INVALID_TOKEN = "invalid_token"
    EXPIRED_TOKEN = "expired_token"
    UNTRUSTED_ISSUER = "untrusted_issuer"
    MISSING_CLAIM = "missing_claim"
    SERVICE_UNAVAILABLE = "service_unavailable"
    FORBIDDEN = "forbidden"

class AuthErrorResponse(BaseModel):
    """Standardized authentication error response.
    
    Returned by FastAPI endpoints when authentication fails.
    """
    
    error: str = Field(..., description="Short error identifier")
    error_code: AuthErrorCode = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "error": "Unauthorized",
                    "error_code": "expired_token",
                    "message": "Token has expired"
                },
                {
                    "error": "Unauthorized",
                    "error_code": "invalid_token",
                    "message": "Invalid token: signature verification failed"
                }
            ]
        }
```

### HTTP Status Code Mapping

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `missing_token` | 401 | No Authorization header provided |
| `invalid_token` | 401 | Signature verification failed |
| `expired_token` | 401 | Token exp claim in the past |
| `untrusted_issuer` | 401 | Token iss doesn't match expected value |
| `missing_claim` | 401 | Required claim (sub/exp/iss) missing |
| `service_unavailable` | 503 | JWKS endpoint unreachable |
| `forbidden` | 403 | User ID mismatch (cross-user access) |

---

## 7. Authorization Error Response Model (Backend)

### Forbidden Access Response

```python
from pydantic import BaseModel, Field

class AuthorizationErrorResponse(BaseModel):
    """Response for authorization failures (403 Forbidden).
    
    Used when authenticated user attempts to access another user's resources.
    """
    
    error: str = Field(default="Forbidden", description="Error type")
    error_code: str = Field(default="forbidden", description="Error code")
    message: str = Field(..., description="Error message")
    details: dict | None = Field(None, description="Additional error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Forbidden",
                "error_code": "forbidden",
                "message": "Access denied: cannot access another user's resources",
                "details": {
                    "token_user_id": "user-123",
                    "requested_user_id": "user-456"
                }
            }
        }
```

---

## 8. Frontend Token Storage Model

### TypeScript Interface

```typescript
// frontend/lib/auth/token-storage.ts

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp (seconds)
}

export interface DecodedToken {
  sub: string; // user_id
  email: string;
  name?: string;
  exp: number;
  iat: number;
  iss: string;
}

export class TokenStorage {
  private static readonly ACCESS_TOKEN_KEY = "better_auth_jwt_token";
  private static readonly REFRESH_TOKEN_KEY = "better_auth_refresh_token";

  static set(tokenData: TokenData): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokenData.accessToken);
      if (tokenData.refreshToken) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenData.refreshToken);
      }
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  static getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  static clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  static isExpired(token: string): boolean {
    try {
      const decoded = this.decode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  private static decode(token: string): DecodedToken {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }
}
```

---

## 9. Validation Rules Summary

### Token Validation (Backend)

| Rule | Enforcement | Error Code |
|------|-------------|------------|
| Signature verification | PyJWT + JWKS public key | `invalid_token` |
| Token expiration (`exp`) | `exp > current_time` | `expired_token` |
| Token issuer (`iss`) | `iss == BETTER_AUTH_URL` | `untrusted_issuer` |
| Required claims | `sub`, `exp`, `iss` must exist | `missing_claim` |
| Algorithm | `alg == "RS256"` | `invalid_token` |
| Key ID (`kid`) | Must match JWKS key | `invalid_token` |

### User ID Scoping (Backend)

| Rule | Enforcement | Error Code |
|------|-------------|------------|
| Path parameter match | `token.sub == path.user_id` | `forbidden` |
| URL decoding | URL-decode `{user_id}` before comparison | `forbidden` |
| Case sensitivity | Exact string match (case-sensitive) | `forbidden` |

---

## 10. State Transitions

### Token Lifecycle States

```
┌─────────────┐
│   ISSUED    │ ← Better Auth creates token with RS256 signature
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ ← Token is valid, not expired
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   EXPIRED   │    │  REFRESHED  │ ← New token issued via refresh
└─────────────┘    └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   ACTIVE    │
                   └─────────────┘
```

### JWKS Cache States

```
┌─────────────┐
│   EMPTY     │ ← Application startup
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FETCHING   │ ← HTTP GET to JWKS endpoint
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   CACHED    │ ← Keys cached with 1-hour TTL
└──────┬──────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   STALE     │    │  REFRESHING │ ← On-demand refresh
└─────────────┘    └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   CACHED    │
                   └─────────────┘
```

---

## Summary

**Data Models Defined**: 10
**Backend Models**: 8 (Pydantic)
**Frontend Models**: 2 (TypeScript)
**Validation Rules**: 11
**State Machines**: 2

**Key Design Principles**:
- Type-safe models with Pydantic (backend) and TypeScript (frontend)
- Clear validation rules with specific error codes
- Stateless design (no session storage)
- RS256 asymmetric cryptography
- JWKS-based public key distribution
- 1-hour JWKS cache TTL for performance

**Next Steps**: 
1. ✅ Data models complete
2. ⏳ Create API contracts (OpenAPI specs)
3. ⏳ Create quickstart guide
