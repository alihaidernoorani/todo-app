# Authentication Module

This module provides JWT-based authentication and authorization for the FastAPI backend.

## Overview

The authentication system is **100% stateless** - no database lookups or session storage. All authentication decisions are made by validating JWT signatures and claims.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Request                           │
│          Authorization: Bearer <jwt_token>                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Dependency Injection                    │
│                                                              │
│  ┌─────────────────────┐    ┌──────────────────────┐       │
│  │  get_current_user() │    │ verify_user_access() │       │
│  │  • Validates JWT    │    │ • Calls get_current_ │       │
│  │  • Returns uid      │    │   user()             │       │
│  └──────────┬──────────┘    │ • Compares uid vs    │       │
│             │                │   {user_id}          │       │
│             └────────────────┤ • Returns uid        │       │
│                              └──────────┬───────────┘       │
└──────────────────────────────────────────┼──────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │   Endpoint Handler      │
                              │   (user_id guaranteed   │
                              │    to match JWT uid)    │
                              └─────────────────────────┘
```

## Components

### 1. JWT Handler (`jwt_handler.py`)

Core JWT validation logic:

- **`extract_bearer_token(authorization: str) -> str`**
  - Extracts JWT from "Authorization: Bearer <token>" header
  - Raises `ValueError` if header is missing or malformed

- **`decode_jwt(token: str) -> Dict[str, Any]`**
  - Validates JWT signature using `BETTER_AUTH_SECRET`
  - Verifies expiration (exp claim)
  - Validates issued-at time (iat claim)
  - Extracts uid claim
  - Raises `ExpiredSignatureError`, `JWTError`, or `ValueError`

### 2. FastAPI Dependencies (`dependencies.py`)

Authentication and authorization hooks for endpoints:

- **`get_current_user(authorization: Optional[str] = Header(None)) -> str`**
  - Use for endpoints requiring authentication only
  - Returns user ID from JWT uid claim
  - Raises HTTPException(401) for auth failures

- **`verify_user_access(user_id: str, current_user_id: str = Header(None, alias="Authorization")) -> str`**
  - Use for user-scoped endpoints (e.g., `/api/{user_id}/tasks`)
  - Validates JWT AND checks uid matches {user_id} path parameter
  - Raises HTTPException(401) for auth failures, HTTPException(403) for authorization failures

### 3. Pydantic Models (`../models/auth.py`)

Type-safe models for JWT payloads and error responses:

- `JWTPayload`: JWT token structure
- `AuthErrorCode`: Error code enumeration
- `AuthErrorResponse`: Standardized error response format

### 4. Custom Exceptions (`exceptions.py`)

Internal exception types (converted to HTTPException by dependencies):

- `AuthenticationError`: JWT validation failures
- `AuthorizationError`: User access violations

## Usage

### Protecting Endpoints with Authentication Only

For endpoints that need to know **who** the user is but don't have user-scoped resources:

```python
from fastapi import APIRouter, Depends
from src.auth import get_current_user

router = APIRouter()

@router.get("/api/me")
async def get_my_profile(current_user_id: str = Depends(get_current_user)):
    """Returns authenticated user's profile."""
    return {"user_id": current_user_id}
```

### Protecting User-Scoped Endpoints

For endpoints with `{user_id}` in the path that access user-specific resources:

```python
from fastapi import APIRouter, Depends
from src.auth import verify_user_access

router = APIRouter()

@router.get("/api/{user_id}/tasks")
async def get_user_tasks(
    user_id: str,
    authenticated_user: str = Depends(verify_user_access)
):
    """Returns tasks for the authenticated user.

    authenticated_user is guaranteed to equal user_id.
    Cross-user access is blocked with 403.
    """
    # authenticated_user == user_id guaranteed
    return await fetch_tasks(authenticated_user)
```

### Integrating into Existing Dependencies

You can compose authentication with other dependencies:

```python
from fastapi import Depends
from src.auth import verify_user_access
from src.api.deps import SessionDep

@router.post("/api/{user_id}/tasks")
async def create_task(
    user_id: str,
    session: SessionDep,
    authenticated_user: str = Depends(verify_user_access)
):
    """Creates a task for the authenticated user."""
    # Both session and authenticated_user are available
    return await task_service.create(session, authenticated_user, task_data)
```

## Error Handling

All authentication and authorization errors return consistent JSON responses:

### 401 Unauthorized (Authentication Failures)

```json
{
  "detail": "Missing authentication token"
}
```

```json
{
  "detail": "Invalid authorization header format"
}
```

```json
{
  "detail": "Token expired"
}
```

```json
{
  "detail": "Invalid token signature"
}
```

```json
{
  "detail": "Malformed token"
}
```

All 401 responses include the `WWW-Authenticate: Bearer` header.

### 403 Forbidden (Authorization Failures)

```json
{
  "detail": "Access denied: cannot access another user's resources"
}
```

Returned when a valid JWT tries to access a different user's resources (uid != user_id).

## Configuration

### Environment Variables

**Required**:
- `BETTER_AUTH_SECRET`: Shared secret for HS256 JWT signing (minimum 32 characters)

The secret MUST match the frontend Better Auth configuration.

### Startup Validation

The application will fail to start if:
- `BETTER_AUTH_SECRET` is missing
- `BETTER_AUTH_SECRET` is less than 32 characters

This is a **security feature** to prevent weak secrets in production.

## Security Considerations

### 1. Stateless Design

**No database lookups** during authentication:
- Fast: ~5-10ms per request
- Scalable: No session storage bottlenecks
- Resilient: No session state to lose

**Trade-off**: Deleted/deactivated users can still authenticate until their JWT expires.

**Mitigation**: Use short JWT expiration times (15-30 minutes) in Better Auth frontend configuration.

### 2. Horizontal Privilege Escalation Prevention

The `verify_user_access` dependency prevents users from accessing each other's resources:

```
User A (uid: aaaa) → GET /api/bbbb/tasks → 403 FORBIDDEN
User B (uid: bbbb) → GET /api/bbbb/tasks → 200 OK
```

### 3. Error Message Security

All error messages are generic to prevent information disclosure:
- "Missing authentication token" (not "User not found")
- "Invalid token signature" (not "Secret key mismatch")
- "Access denied" (not "User A cannot access User B")

### 4. Token Validation

Every token is validated for:
- Signature (prevents tampering)
- Expiration (prevents replay attacks)
- Issued-at time (prevents backdated tokens)
- Required claims (uid, exp, iat)

### 5. Logging

Authentication failures are logged for security monitoring:
- Expired tokens
- Invalid signatures
- Cross-user access attempts

**No sensitive data** (tokens, user IDs) is logged.

## Testing

### Contract Tests

Test authentication logic in isolation:

```bash
pytest tests/contract/test_auth_contract.py -v
```

### Integration Tests

Test authentication with full HTTP requests:

```bash
pytest tests/integration/test_auth_integration.py -v
```

### Unit Tests

Test individual functions:

```bash
pytest tests/unit/test_jwt_handler.py tests/unit/test_auth_dependencies.py -v
```

## Performance

Target: **< 50ms per authenticated request**

Typical breakdown:
- JWT signature verification: ~5-10ms
- Claim extraction: ~1ms
- Authorization check: ~1ms

**Total overhead**: ~7-12ms per request

## Troubleshooting

### "Missing authentication token"

**Cause**: No Authorization header sent

**Fix**: Include `Authorization: Bearer <token>` header in request

### "Invalid authorization header format"

**Cause**: Header doesn't start with "Bearer "

**Fix**: Ensure header format is exactly `Authorization: Bearer <token>` (case-sensitive, space after Bearer)

### "Token expired"

**Cause**: JWT exp claim is in the past

**Fix**: Get a new token from Better Auth frontend

### "Invalid token signature"

**Causes**:
1. Token signed with wrong secret
2. Token was tampered with
3. BETTER_AUTH_SECRET mismatch between frontend and backend

**Fix**: Verify `BETTER_AUTH_SECRET` matches in both frontend and backend .env files

### "Access denied: cannot access another user's resources"

**Cause**: JWT uid doesn't match {user_id} path parameter

**Example**: User A (uid: aaaa) trying to access `/api/bbbb/tasks`

**Fix**: Ensure frontend sends requests to the authenticated user's own resources only

## Development

### Adding New Protected Endpoints

1. Import the appropriate dependency:
   ```python
   from src.auth import get_current_user  # For auth only
   from src.auth import verify_user_access  # For user-scoped resources
   ```

2. Add dependency to endpoint:
   ```python
   @router.get("/endpoint")
   async def handler(user_id: str = Depends(get_current_user)):
       ...
   ```

3. Use the returned user_id for database queries

### Testing Authentication Locally

Generate a test JWT:

```python
import time
from jose import jwt

secret = "your-BETTER_AUTH_SECRET-here"
payload = {
    "uid": "test-user-123",
    "exp": int(time.time()) + 3600,
    "iat": int(time.time())
}
token = jwt.encode(payload, secret, algorithm="HS256")
print(f"Bearer {token}")
```

Use with curl:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/me
```

## References

- [Better Auth Documentation](https://www.better-auth.com/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Specification (RFC 7519)](https://tools.ietf.org/html/rfc7519)
- [python-jose Documentation](https://python-jose.readthedocs.io/)
