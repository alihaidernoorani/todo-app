# Quickstart: Authentication and Security

**Feature**: 003-auth-security
**Date**: 2026-01-25
**Audience**: Backend developers implementing protected API endpoints

## Overview

This guide shows you how to protect FastAPI endpoints using JWT authentication and authorization with Better Auth. You'll learn how to:

1. Configure authentication in your FastAPI application
2. Protect endpoints with authentication (valid token required)
3. Protect endpoints with user-scoped authorization (user can only access their own resources)
4. Handle authentication errors consistently

---

## Prerequisites

### Environment Setup

1. **Install dependencies**:
```bash
pip install fastapi python-jose[cryptography] pydantic-settings uvicorn
```

2. **Create `.env` file**:
```bash
# .env (DO NOT commit to version control)
BETTER_AUTH_SECRET=your-production-secret-minimum-32-characters-required-here
```

3. **Add to `.gitignore`**:
```bash
echo ".env" >> .gitignore
```

### Configuration Validation

Create `backend/src/config.py`:

```python
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Application configuration from environment variables."""

    BETTER_AUTH_SECRET: str = Field(
        ...,
        description="Shared secret for HS256 JWT verification",
        min_length=32
    )

    @field_validator('BETTER_AUTH_SECRET')
    @classmethod
    def validate_secret_strength(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError(
                "BETTER_AUTH_SECRET must be at least 32 characters"
            )
        return v

    class Config:
        env_file = ".env"


# Singleton instance - fails on startup if invalid
settings = Settings()
```

**What happens**: Application will fail to start with clear error if `BETTER_AUTH_SECRET` is missing or too short.

---

## Usage Patterns

### Pattern 1: Authentication Only (Valid Token Required)

**Use Case**: Endpoint that any authenticated user can access (no user ID scoping).

**Example**: Get current user profile

```python
from fastapi import APIRouter, Depends, HTTPException, Header, status
from jose import jwt, JWTError
from backend.src.config import settings

router = APIRouter(prefix="/api", tags=["Users"])


def get_current_user(authorization: str = Header(None)) -> str:
    """Extract and validate authenticated user from JWT token.

    Returns:
        str: User ID extracted from JWT uid claim

    Raises:
        HTTPException (401): Authentication failed
    """
    # 1. Check Authorization header exists
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 2. Validate "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # 3. Extract token
    token = authorization.split(" ")[1]

    # 4. Validate and decode JWT
    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "require_exp": True
            }
        )

        # 5. Extract user ID from uid claim
        user_id = payload.get("uid")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing or malformed user ID claim"
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature",
            headers={"WWW-Authenticate": "Bearer"}
        )


@router.get("/me")
async def get_my_profile(current_user_id: str = Depends(get_current_user)):
    """Get current user profile.

    Any authenticated user can access this endpoint.
    """
    return {
        "user_id": current_user_id,
        "message": f"Authenticated as user {current_user_id}"
    }
```

**Test**:
```bash
# Valid token
curl -H "Authorization: Bearer <valid_jwt>" http://localhost:8000/api/me
# Response: {"user_id": "user123", "message": "Authenticated as user user123"}

# Missing token
curl http://localhost:8000/api/me
# Response: 401 {"detail": "Missing authentication token"}

# Invalid token
curl -H "Authorization: Bearer invalid.token.here" http://localhost:8000/api/me
# Response: 401 {"detail": "Invalid token signature"}
```

---

### Pattern 2: User-Scoped Authorization (User Can Only Access Own Resources)

**Use Case**: Endpoint where users can only access/modify their own data.

**Example**: Get user's tasks

```python
def verify_user_access(
    user_id: str,  # Injected from path parameter {user_id}
    current_user_id: str = Depends(get_current_user)
) -> str:
    """Verify authenticated user can access the requested user's resources.

    Args:
        user_id: User ID from path parameter {user_id}
        current_user_id: Authenticated user ID from JWT token

    Returns:
        str: Authenticated user ID (guaranteed to match user_id)

    Raises:
        HTTPException (401): Authentication failed
        HTTPException (403): User attempting to access another user's resources
    """
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: cannot access another user's resources"
        )

    return current_user_id


@router.get("/users/{user_id}/tasks")
async def get_user_tasks(
    user_id: str,
    authenticated_user: str = Depends(verify_user_access)
):
    """Get tasks for a specific user.

    User can only access their own tasks (uid from JWT must match user_id in path).
    """
    # authenticated_user is guaranteed to equal user_id at this point
    return {
        "user_id": authenticated_user,
        "tasks": [
            {"id": 1, "title": "Task 1"},
            {"id": 2, "title": "Task 2"}
        ]
    }


@router.post("/users/{user_id}/tasks")
async def create_user_task(
    user_id: str,
    task_title: str,
    authenticated_user: str = Depends(verify_user_access)
):
    """Create a task for a specific user.

    User can only create tasks for themselves.
    """
    return {
        "user_id": authenticated_user,
        "task": {"id": 3, "title": task_title}
    }
```

**Test**:
```bash
# User accessing their own tasks (user_id matches JWT uid)
curl -H "Authorization: Bearer <jwt_with_uid=user123>" \
     http://localhost:8000/api/users/user123/tasks
# Response: 200 {"user_id": "user123", "tasks": [...]}

# User attempting to access another user's tasks (user_id ≠ JWT uid)
curl -H "Authorization: Bearer <jwt_with_uid=user123>" \
     http://localhost:8000/api/users/user456/tasks
# Response: 403 {"detail": "Access denied: cannot access another user's resources"}
```

---

### Pattern 3: Modular Dependency (Recommended for Production)

**Use Case**: Reusable authentication module shared across all routers.

**File**: `backend/src/auth/dependencies.py`

```python
"""Authentication and authorization dependencies for FastAPI endpoints."""

from fastapi import Depends, HTTPException, Header, status
from jose import jwt, JWTError
from backend.src.config import settings


async def get_current_user(authorization: str = Header(None)) -> str:
    """Extract and validate JWT token from Authorization header.

    This is the base authentication dependency. Use this for endpoints
    that require authentication but not user-scoped authorization.

    Returns:
        str: User ID extracted from JWT uid claim

    Raises:
        HTTPException (401): Authentication failed
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=["HS256"],
            options={"verify_signature": True, "verify_exp": True, "require_exp": True}
        )

        user_id = payload.get("uid")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing or malformed user ID claim"
            )

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def verify_user_access(
    user_id: str,
    current_user_id: str = Depends(get_current_user)
) -> str:
    """Verify authenticated user can access requested user's resources.

    This dependency combines authentication + authorization. Use this for
    user-scoped endpoints (e.g., /users/{user_id}/tasks).

    Args:
        user_id: User ID from path parameter {user_id}
        current_user_id: Authenticated user ID from get_current_user dependency

    Returns:
        str: Authenticated user ID (guaranteed to match user_id)

    Raises:
        HTTPException (401): Authentication failed (from get_current_user)
        HTTPException (403): User attempting to access another user's resources
    """
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: cannot access another user's resources"
        )

    return current_user_id
```

**Usage in Router**:

```python
from fastapi import APIRouter, Depends
from backend.src.auth.dependencies import get_current_user, verify_user_access

router = APIRouter(prefix="/api", tags=["Tasks"])


@router.get("/users/{user_id}/tasks")
async def get_user_tasks(
    user_id: str,
    current_user: str = Depends(verify_user_access)
):
    """User-scoped endpoint: User can only access their own tasks."""
    return {"user_id": current_user, "tasks": []}


@router.get("/health")
async def health_check(current_user: str = Depends(get_current_user)):
    """Authentication-only endpoint: Any authenticated user can access."""
    return {"status": "healthy", "authenticated_user": current_user}
```

---

## Error Handling

### Consistent Error Response Format

All authentication and authorization errors return this JSON structure:

```json
{
  "detail": "Human-readable error message",
  "status_code": 401
}
```

### Error Scenarios Reference

| Scenario | Status Code | Detail Message |
|----------|-------------|----------------|
| Missing `Authorization` header | 401 | "Missing authentication token" |
| Invalid header format (not "Bearer <token>") | 401 | "Invalid authorization header format" |
| Invalid JWT signature | 401 | "Invalid token signature" |
| Expired token (`exp` < now) | 401 | "Token expired" |
| Malformed token (invalid JSON) | 401 | "Malformed token" |
| Missing `uid` claim | 401 | "Invalid token: missing or malformed user ID claim" |
| User ID mismatch (uid ≠ {user_id}) | 403 | "Access denied: cannot access another user's resources" |

---

## Testing

### Manual Testing with curl

```bash
# 1. Get a valid JWT from Better Auth (frontend)
# (Example token structure shown below)

# 2. Test authentication-only endpoint
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:8000/api/me

# 3. Test user-scoped endpoint (matching user ID)
curl -H "Authorization: Bearer <jwt_with_uid=user123>" \
     http://localhost:8000/api/users/user123/tasks

# 4. Test user-scoped endpoint (mismatched user ID - should fail)
curl -H "Authorization: Bearer <jwt_with_uid=user123>" \
     http://localhost:8000/api/users/user456/tasks
```

### Automated Testing with pytest

**File**: `backend/tests/integration/test_auth_integration.py`

```python
from fastapi.testclient import TestClient
from jose import jwt
from datetime import datetime, timedelta
from backend.src.main import app
from backend.src.config import settings

client = TestClient(app)


def create_test_token(user_id: str, expired: bool = False) -> str:
    """Helper: Create test JWT token."""
    exp = datetime.utcnow() + timedelta(minutes=-1 if expired else 15)
    payload = {
        "uid": user_id,
        "exp": exp.timestamp(),
        "iat": datetime.utcnow().timestamp()
    }
    return jwt.encode(payload, settings.BETTER_AUTH_SECRET, algorithm="HS256")


def test_authentication_success():
    """Valid token grants access."""
    token = create_test_token("user123")
    response = client.get(
        "/api/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["user_id"] == "user123"


def test_authentication_missing_token():
    """Missing Authorization header returns 401."""
    response = client.get("/api/me")
    assert response.status_code == 401
    assert "Missing authentication token" in response.json()["detail"]


def test_authentication_expired_token():
    """Expired token returns 401."""
    token = create_test_token("user123", expired=True)
    response = client.get(
        "/api/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
    assert "Token expired" in response.json()["detail"]


def test_authorization_user_access_allowed():
    """User can access their own resources."""
    token = create_test_token("user123")
    response = client.get(
        "/api/users/user123/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200


def test_authorization_user_access_denied():
    """User cannot access another user's resources."""
    token = create_test_token("user123")
    response = client.get(
        "/api/users/user456/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403
    assert "cannot access another user's resources" in response.json()["detail"]
```

---

## Common Pitfalls

### ❌ Pitfall 1: Hardcoding Secrets

**Wrong**:
```python
SECRET_KEY = "my-secret-key"  # NEVER do this!
```

**Correct**:
```python
from backend.src.config import settings
secret = settings.BETTER_AUTH_SECRET  # From environment variable
```

### ❌ Pitfall 2: Not Validating Header Format

**Wrong**:
```python
token = authorization.split(" ")[1]  # Crashes if format is wrong
```

**Correct**:
```python
if not authorization.startswith("Bearer "):
    raise HTTPException(status_code=401, detail="Invalid authorization header format")
token = authorization.split(" ")[1]
```

### ❌ Pitfall 3: Forgetting WWW-Authenticate Header

**Wrong**:
```python
raise HTTPException(status_code=401, detail="Token expired")
```

**Correct**:
```python
raise HTTPException(
    status_code=401,
    detail="Token expired",
    headers={"WWW-Authenticate": "Bearer"}  # Required by HTTP spec
)
```

### ❌ Pitfall 4: Not Checking User ID Claim

**Wrong**:
```python
user_id = payload["uid"]  # Crashes if uid missing
```

**Correct**:
```python
user_id = payload.get("uid")
if not user_id:
    raise HTTPException(status_code=401, detail="Invalid token: missing or malformed user ID claim")
```

---

## Next Steps

1. ✅ Set up environment variables (`BETTER_AUTH_SECRET`)
2. ✅ Create authentication dependencies (`backend/src/auth/dependencies.py`)
3. ✅ Protect endpoints with `Depends(get_current_user)` or `Depends(verify_user_access)`
4. ✅ Write integration tests for protected endpoints
5. 🔄 Coordinate with frontend team on Better Auth HS256 configuration
6. 🔄 Deploy to production with environment variable injection

---

## Reference

- **Spec**: [spec.md](./spec.md)
- **Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **Error Contracts**: [contracts/auth-errors.json](./contracts/auth-errors.json)
- **FastAPI Security Docs**: https://fastapi.tiangolo.com/tutorial/security/
- **python-jose Docs**: https://python-jose.readthedocs.io/
