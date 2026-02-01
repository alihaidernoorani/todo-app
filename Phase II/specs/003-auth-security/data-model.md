# Data Model: Authentication and Security

**Feature**: 003-auth-security
**Date**: 2026-01-25
**Status**: Complete

## Overview

This document defines the data structures used for JWT authentication and authorization in the FastAPI backend. All models are defined using Pydantic for validation and serialization.

---

## JWT Token Payload

### Structure

```python
from pydantic import BaseModel, Field

class JWTPayload(BaseModel):
    """JWT token payload structure expected from Better Auth.

    Note: This assumes Better Auth is configured with:
    - Algorithm: HS256 (requires customSign configuration)
    - User ID claim: 'uid' (requires definePayload configuration)
    """

    uid: str = Field(..., description="User unique identifier", min_length=1)
    exp: int = Field(..., description="Expiration timestamp (Unix epoch seconds)")
    iat: int = Field(..., description="Issued at timestamp (Unix epoch seconds)")

    # Optional claims that may be present based on Better Auth configuration
    iss: str | None = Field(None, description="Token issuer (BASE_URL)")
    aud: str | None = Field(None, description="Token audience (BASE_URL)")
    email: str | None = Field(None, description="User email address")
    role: str | None = Field(None, description="User role for RBAC")

    class Config:
        json_schema_extra = {
            "example": {
                "uid": "clxyz123abc456def789",
                "exp": 1706274000,
                "iat": 1706273100,
                "iss": "https://example.com",
                "aud": "https://example.com",
                "email": "user@example.com",
                "role": "user"
            }
        }
```

### Validation Rules

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `uid` | string | ✅ Yes | Non-empty string, used for authorization |
| `exp` | integer | ✅ Yes | Unix timestamp, must be > current time |
| `iat` | integer | ✅ Yes | Unix timestamp, must be ≤ current time |
| `iss` | string | ⚠️ Optional | Token issuer (Better Auth BASE_URL) |
| `aud` | string | ⚠️ Optional | Token audience (Better Auth BASE_URL) |
| `email` | string | ⚠️ Optional | User email (if included by Better Auth) |
| `role` | string | ⚠️ Optional | User role (for future RBAC features) |

### Notes

- **Algorithm**: Must be verified as HS256 during JWT decoding
- **Signature**: Verified using `BETTER_AUTH_SECRET` environment variable
- **Expiration**: Enforced by python-jose `verify_exp=True` option
- **User ID**: Extracted from `uid` claim (not `sub` as in standard JWT)

---

## Authentication Error Response

### Structure

```python
from pydantic import BaseModel, Field
from enum import Enum

class AuthErrorCode(str, Enum):
    """Machine-readable error codes for authentication failures."""

    MISSING_TOKEN = "MISSING_TOKEN"
    INVALID_HEADER_FORMAT = "INVALID_HEADER_FORMAT"
    INVALID_TOKEN_SIGNATURE = "INVALID_TOKEN_SIGNATURE"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    MALFORMED_TOKEN = "MALFORMED_TOKEN"
    MISSING_UID_CLAIM = "MISSING_UID_CLAIM"
    FORBIDDEN_USER_ACCESS = "FORBIDDEN_USER_ACCESS"


class AuthErrorResponse(BaseModel):
    """Standardized error response for authentication and authorization failures.

    This model ensures consistent error responses across all protected endpoints.
    """

    detail: str = Field(..., description="Human-readable error message")
    error_code: AuthErrorCode = Field(..., description="Machine-readable error identifier")
    status_code: int = Field(..., description="HTTP status code (401 or 403)")

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Token expired",
                "error_code": "TOKEN_EXPIRED",
                "status_code": 401
            }
        }
```

### Error Code Mapping

| Error Code | Status Code | Detail Message | Trigger Condition |
|------------|-------------|----------------|-------------------|
| `MISSING_TOKEN` | 401 | "Missing authentication token" | Authorization header not provided |
| `INVALID_HEADER_FORMAT` | 401 | "Invalid authorization header format" | Header not in "Bearer <token>" format |
| `INVALID_TOKEN_SIGNATURE` | 401 | "Invalid token signature" | JWT signature verification failed with BETTER_AUTH_SECRET |
| `TOKEN_EXPIRED` | 401 | "Token expired" | Current timestamp > JWT `exp` claim |
| `MALFORMED_TOKEN` | 401 | "Malformed token" | JWT parsing failed (invalid JSON structure) |
| `MISSING_UID_CLAIM` | 401 | "Invalid token: missing or malformed user ID claim" | JWT payload missing `uid` claim |
| `FORBIDDEN_USER_ACCESS` | 403 | "Access denied: cannot access another user's resources" | Authenticated user's `uid` ≠ path `{user_id}` |

### FastAPI Integration

```python
from fastapi import HTTPException, status

def raise_auth_error(error_code: AuthErrorCode, detail: str, status_code: int):
    """Helper function to raise authentication errors consistently."""

    # FastAPI HTTPException for error responses
    raise HTTPException(
        status_code=status_code,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"} if status_code == 401 else None
    )

# Usage example
try:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
except jwt.ExpiredSignatureError:
    raise_auth_error(
        AuthErrorCode.TOKEN_EXPIRED,
        "Token expired",
        status.HTTP_401_UNAUTHORIZED
    )
```

---

## Application Configuration

### Structure

```python
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    """Application configuration from environment variables.

    All authentication settings are loaded from environment variables
    and validated at application startup.
    """

    BETTER_AUTH_SECRET: str = Field(
        ...,
        description="Shared secret for HS256 JWT verification (min 32 characters)",
        min_length=32
    )

    # Optional: JWT algorithm configuration
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="JWT signing algorithm (HS256 for Better Auth shared secret)"
    )

    # Optional: Token expiration leeway (in seconds)
    JWT_LEEWAY: int = Field(
        default=0,
        description="Clock skew tolerance for token expiration (0 = strict)"
    )

    @field_validator('BETTER_AUTH_SECRET')
    @classmethod
    def validate_secret_strength(cls, v: str) -> str:
        """Validate that the shared secret meets security requirements."""
        if len(v) < 32:
            raise ValueError(
                "BETTER_AUTH_SECRET must be at least 32 characters (256 bits) "
                "for secure HS256 signing"
            )
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
        json_schema_extra = {
            "example": {
                "BETTER_AUTH_SECRET": "your-secret-key-here-must-be-at-least-32-characters-long",
                "JWT_ALGORITHM": "HS256",
                "JWT_LEEWAY": 0
            }
        }


# Singleton instance - loaded once at application startup
settings = Settings()
```

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `BETTER_AUTH_SECRET` | string | ✅ Yes | N/A | Shared secret for HS256 verification (≥32 chars) |
| `JWT_ALGORITHM` | string | ❌ No | `"HS256"` | JWT signing algorithm |
| `JWT_LEEWAY` | integer | ❌ No | `0` | Clock skew tolerance in seconds |

### Example `.env` File

```bash
# .env (NEVER commit to version control)
BETTER_AUTH_SECRET=your-production-secret-minimum-32-characters-required-here
JWT_ALGORITHM=HS256
JWT_LEEWAY=0
```

### Example `.env.example` File

```bash
# .env.example (checked into version control as template)
BETTER_AUTH_SECRET=your-secret-here-min-32-chars
JWT_ALGORITHM=HS256
JWT_LEEWAY=0
```

---

## Internal Models (Not Exposed via API)

### Authenticated User Model

```python
from pydantic import BaseModel

class AuthenticatedUser(BaseModel):
    """Internal model representing an authenticated user.

    This model is returned by authentication dependencies and used
    internally by endpoint handlers. It is NOT exposed via API responses.
    """

    user_id: str = Field(..., description="User unique identifier from JWT uid claim")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "clxyz123abc456def789"
            }
        }
```

**Usage**:
```python
from fastapi import Depends

def get_current_user(token: str = Depends(extract_token)) -> AuthenticatedUser:
    """Extract and validate authenticated user from JWT token."""
    payload = decode_jwt(token)
    return AuthenticatedUser(user_id=payload["uid"])

@router.get("/protected")
async def protected_endpoint(user: AuthenticatedUser = Depends(get_current_user)):
    return {"user_id": user.user_id}
```

---

## Data Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│   Mobile)   │
└──────┬──────┘
       │
       │ 1. Request with Authorization: Bearer <JWT>
       ▼
┌─────────────────────────────────────────────────────┐
│              FastAPI Backend                        │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Auth Dependency (get_current_user)           │ │
│  │                                                │ │
│  │  1. Extract token from Authorization header   │ │
│  │  2. Validate "Bearer <token>" format          │ │
│  │  3. Decode JWT using BETTER_AUTH_SECRET       │ │
│  │  4. Verify signature (HS256)                  │ │
│  │  5. Check expiration (exp > now)              │ │
│  │  6. Extract uid claim                         │ │
│  │  7. Return AuthenticatedUser(user_id=uid)     │ │
│  │                                                │ │
│  │  On Failure: Raise HTTPException (401)        │ │
│  └───────────┬───────────────────────────────────┘ │
│              │                                      │
│              │ AuthenticatedUser                    │
│              ▼                                      │
│  ┌───────────────────────────────────────────────┐ │
│  │  Endpoint Handler                             │ │
│  │  - Business logic with user_id                │ │
│  │  - Database queries scoped to user            │ │
│  │  - Response generation                        │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
       │
       │ 2. Response (200 OK or 401/403 error)
       ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## Schema Export (OpenAPI)

FastAPI automatically generates OpenAPI schemas for these models. The authentication error response schema will be documented as:

```yaml
# OpenAPI 3.0 schema (auto-generated by FastAPI)
components:
  schemas:
    AuthErrorResponse:
      type: object
      required:
        - detail
        - error_code
        - status_code
      properties:
        detail:
          type: string
          description: Human-readable error message
        error_code:
          type: string
          enum:
            - MISSING_TOKEN
            - INVALID_HEADER_FORMAT
            - INVALID_TOKEN_SIGNATURE
            - TOKEN_EXPIRED
            - MALFORMED_TOKEN
            - MISSING_UID_CLAIM
            - FORBIDDEN_USER_ACCESS
          description: Machine-readable error identifier
        status_code:
          type: integer
          description: HTTP status code (401 or 403)

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token from Better Auth (HS256 signed)
```

---

## Summary

### Key Models

| Model | Purpose | Exposed via API |
|-------|---------|-----------------|
| `JWTPayload` | JWT token payload validation | ❌ No (internal) |
| `AuthErrorResponse` | Authentication error responses | ✅ Yes (error responses) |
| `Settings` | Environment variable configuration | ❌ No (internal) |
| `AuthenticatedUser` | Authenticated user representation | ❌ No (internal) |
| `AuthErrorCode` | Machine-readable error codes | ✅ Yes (in error responses) |

### Validation Summary

- **JWT Signature**: HS256 with BETTER_AUTH_SECRET (≥32 characters)
- **Token Expiration**: Strict validation (no leeway by default)
- **User ID Claim**: `uid` field required and non-empty
- **Error Responses**: Consistent format with error codes and status codes
- **Configuration**: Fail-fast on missing or invalid BETTER_AUTH_SECRET

### Dependencies

```python
# Required packages
pydantic>=2.0.0          # Data validation and settings management
pydantic-settings>=2.0.0  # Environment variable loading
python-jose[cryptography]>=3.3.0  # JWT validation
fastapi>=0.100.0         # Web framework (dependency injection)
```
