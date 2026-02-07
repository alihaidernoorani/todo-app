# Authentication & Authorization

Backend authentication using Better Auth session-based validation.

## Overview

All authentication is delegated to Better Auth. The backend forwards session cookies to Better Auth's `/api/auth/session` endpoint and uses the response to validate user identity.

**No custom JWT parsing or verification is performed.**

## Usage

### Basic Authentication

Use `get_current_user` dependency for routes that require authentication:

```python
from fastapi import APIRouter, Depends
from typing import Annotated
from src.auth.dependencies import get_current_user
from src.auth.models import AuthenticatedUser

router = APIRouter()

@router.get("/protected")
async def protected_route(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name
    }
```

**Behavior**:
- ✅ Valid session → Returns `AuthenticatedUser` object
- ❌ Missing cookies → 401 "Missing authentication credentials"
- ❌ Invalid/expired session → 401 "Invalid or expired session"
- ❌ Better Auth unreachable → 503 "Authentication service unavailable"

### User ID Scoping (Authorization)

Use `require_user_id_match` for user-scoped endpoints:

```python
from fastapi import APIRouter, Depends
from typing import Annotated
from src.auth.dependencies import require_user_id_match
from src.auth.models import AuthenticatedUser

router = APIRouter()

@router.get("/users/{user_id}/tasks")
async def get_user_tasks(
    user_id: str,
    user: Annotated[AuthenticatedUser, Depends(require_user_id_match(user_id))]
):
    # user.user_id is guaranteed to match path user_id
    return {"tasks": [...]}
```

**Behavior**:
- ✅ Session user_id matches path user_id → Returns `AuthenticatedUser` object
- ❌ Session user_id ≠ path user_id → 403 "Access denied: cannot access another user's resources"
- ❌ Authentication errors → 401 or 503 (from `get_current_user`)

### URL-Encoded User IDs

The `require_user_id_match` dependency automatically URL-decodes path parameters before comparison.

```python
# Works correctly with URL-encoded user IDs
# /users/user%40example.com/tasks → decoded to user@example.com
```

## Error Responses

All authentication errors return standardized JSON:

```json
{
  "detail": "Error message here"
}
```

**Status Codes**:
- `401 Unauthorized`: Authentication failed (invalid/missing session)
- `403 Forbidden`: Authorization failed (cross-user access attempt)
- `503 Service Unavailable`: Better Auth is unreachable

## Architecture

```
Client Request (with cookies)
    ↓
FastAPI Endpoint
    ↓
get_current_user() dependency
    ↓
Extract cookies from request
    ↓
Call Better Auth /api/auth/session
    ↓
Validate response
    ↓
Return AuthenticatedUser
    ↓
(Optional) require_user_id_match()
    ↓
Compare session user_id with path user_id
    ↓
Route Handler
```

## Configuration

Environment variables (in `.env`):

```bash
# Better Auth base URL
BETTER_AUTH_URL=http://localhost:3000

# Better Auth session endpoint (optional, defaults to ${BETTER_AUTH_URL}/api/auth/session)
BETTER_AUTH_SESSION_URL=http://localhost:3000/api/auth/session
```

## Testing

### Manual Testing with curl

1. Obtain session cookie from Better Auth (sign in via frontend)
2. Extract cookie value (typically `better-auth.session_token`)
3. Test protected endpoint:

```bash
curl http://localhost:8000/protected \
  -H "Cookie: better-auth.session_token=<your-token-here>"
```

### Unit Testing

Mock the `validate_session` function in tests:

```python
from unittest.mock import AsyncMock, patch
from src.auth.models import AuthenticatedUser

@patch('src.auth.dependencies.validate_session')
async def test_protected_endpoint(mock_validate):
    mock_validate.return_value = AuthenticatedUser(
        user_id="user123",
        email="user@example.com",
        name="Test User"
    )

    # Test your endpoint
    response = client.get("/protected", cookies={"session": "test"})
    assert response.status_code == 200
```

## Security Notes

- ✅ All session validation delegated to Better Auth
- ✅ No custom cryptographic operations
- ✅ Session cookies are HTTP-only (set by Better Auth)
- ✅ HTTPS required in production
- ✅ No session data cached locally
- ❌ Do NOT log session cookies in production
- ❌ Do NOT parse or validate JWTs manually
