# Authentication Usage Guide

Quick reference for developers integrating with the authentication system.

## Table of Contents

- [Getting Started](#getting-started)
- [Making Authenticated Requests](#making-authenticated-requests)
- [Common Patterns](#common-patterns)
- [Testing with curl](#testing-with-curl)
- [Frontend Integration](#frontend-integration)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

1. **Backend**: BETTER_AUTH_SECRET configured in `.env`
2. **Frontend**: Better Auth configured with same secret and HS256 algorithm

### Configuration

In your backend `.env`:

```bash
BETTER_AUTH_SECRET=your-32-character-minimum-secret-here
```

**Important**: This secret MUST match the frontend Better Auth configuration.

## Making Authenticated Requests

### Step 1: Obtain JWT from Frontend

Your frontend application uses Better Auth to handle login and generate JWTs:

```typescript
// Frontend code (Better Auth)
const { data: session } = await signIn.email({
  email: "user@example.com",
  password: "password123"
})

const jwt = session.token  // This is the JWT to send to backend
```

### Step 2: Include JWT in Authorization Header

All authenticated requests must include the JWT in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

**Format Rules**:
- Header name: `Authorization` (case-sensitive)
- Prefix: `Bearer ` (with space after "Bearer")
- Token: Full JWT string with no modifications

### Step 3: Make Request

```bash
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:8000/api/me
```

## Common Patterns

### Pattern 1: Authentication Only (No User Scoping)

For endpoints that need to know **who** is making the request:

**Backend Endpoint**:
```python
from fastapi import Depends
from src.auth import get_current_user

@router.get("/api/me")
async def get_profile(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id}
```

**Frontend Request**:
```typescript
const response = await fetch('/api/me', {
  headers: {
    'Authorization': `Bearer ${session.token}`
  }
})
```

**curl Example**:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/me
```

### Pattern 2: User-Scoped Resources

For endpoints accessing user-specific data (e.g., `/api/{user_id}/tasks`):

**Backend Endpoint**:
```python
from fastapi import Depends
from src.auth import verify_user_access

@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    authenticated_user: str = Depends(verify_user_access)
):
    # authenticated_user is guaranteed to equal user_id
    return await fetch_tasks(authenticated_user)
```

**Frontend Request**:
```typescript
const userId = session.user.id
const response = await fetch(`/api/${userId}/tasks`, {
  headers: {
    'Authorization': `Bearer ${session.token}`
  }
})
```

**curl Example**:
```bash
USER_ID="9075f5e4-f0b6-4692-b460-9514eb1f56a3"
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/$USER_ID/tasks
```

## Testing with curl

### 1. Generate Test JWT

Create a Python script to generate test tokens:

```python
# generate_test_token.py
import time
from jose import jwt

SECRET = "dev-test-secret-key-must-be-at-least-32-characters-long"  # Match .env
USER_ID = "test-user-123"

payload = {
    "uid": USER_ID,
    "exp": int(time.time()) + 3600,  # Expires in 1 hour
    "iat": int(time.time())
}

token = jwt.encode(payload, SECRET, algorithm="HS256")
print(f"TOKEN={token}")
print(f"USER_ID={USER_ID}")
```

Run it:

```bash
cd backend
uv run python generate_test_token.py
```

### 2. Export Token as Environment Variable

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export USER_ID="test-user-123"
```

### 3. Test Authentication Endpoints

**Test /api/me** (authentication only):

```bash
# Should return user info (200)
curl -s -w "\n%{http_code}\n" \
     -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/me

# Without token - should return 401
curl -s -w "\n%{http_code}\n" \
     http://localhost:8000/api/me
```

**Test user-scoped endpoint**:

```bash
# Access own tasks - should succeed (200)
curl -s -w "\n%{http_code}\n" \
     -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/$USER_ID/tasks

# Try to access different user's tasks - should fail (403)
curl -s -w "\n%{http_code}\n" \
     -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/00000000-0000-0000-0000-000000000000/tasks
```

### 4. Test Error Scenarios

**Missing token** (401):
```bash
curl -s http://localhost:8000/api/me | jq
# Expected: {"detail": "Missing authentication token"}
```

**Invalid format** (401):
```bash
curl -s -H "Authorization: InvalidFormat $TOKEN" \
     http://localhost:8000/api/me | jq
# Expected: {"detail": "Invalid authorization header format"}
```

**Expired token** (401):
```python
# Generate expired token
payload = {
    "uid": "test-user",
    "exp": int(time.time()) - 3600,  # Expired 1 hour ago
    "iat": int(time.time()) - 7200
}
expired_token = jwt.encode(payload, SECRET, algorithm="HS256")
```

```bash
curl -s -H "Authorization: Bearer $EXPIRED_TOKEN" \
     http://localhost:8000/api/me | jq
# Expected: {"detail": "Token expired"}
```

**Cross-user access** (403):
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
     http://localhost:8000/api/different-user-id/tasks | jq
# Expected: {"detail": "Access denied: cannot access another user's resources"}
```

## Frontend Integration

### React Example

```typescript
import { useSession } from '@better-auth/react'

function TaskList() {
  const { data: session } = useSession()

  const fetchTasks = async () => {
    if (!session?.user?.id || !session?.token) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(`/api/${session.user.id}/tasks`, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login'
      return
    }

    if (response.status === 403) {
      // Authorization failed - user trying to access wrong resources
      throw new Error('Access denied')
    }

    if (!response.ok) {
      throw new Error('Failed to fetch tasks')
    }

    return response.json()
  }

  // ... rest of component
}
```

### Next.js API Route Example

```typescript
// pages/api/tasks.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = req.headers.authorization

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication' })
  }

  const userId = getUserIdFromSession(req)  // Your session logic

  const response = await fetch(`http://localhost:8000/api/${userId}/tasks`, {
    headers: {
      'Authorization': token,  // Forward the Bearer token
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()
  return res.status(response.status).json(data)
}
```

### Axios Interceptor Example

```typescript
import axios from 'axios'
import { getSession } from '@better-auth/react'

const api = axios.create({
  baseURL: 'http://localhost:8000'
})

// Add token to every request
api.interceptors.request.use(async (config) => {
  const session = await getSession()

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }

  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

## Troubleshooting

### "Missing authentication token"

**Problem**: No Authorization header in request

**Solution**:
```typescript
// ❌ Wrong
fetch('/api/me')

// ✅ Correct
fetch('/api/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### "Invalid authorization header format"

**Problem**: Header doesn't follow "Bearer <token>" format

**Common mistakes**:
```typescript
// ❌ Wrong - missing "Bearer "
headers: { 'Authorization': token }

// ❌ Wrong - lowercase "bearer"
headers: { 'Authorization': `bearer ${token}` }

// ❌ Wrong - no space after Bearer
headers: { 'Authorization': `Bearer${token}` }

// ✅ Correct
headers: { 'Authorization': `Bearer ${token}` }
```

### "Token expired"

**Problem**: JWT exp claim is in the past

**Solution**:
1. Implement token refresh in frontend
2. Redirect user to login
3. Check Better Auth token expiration settings

```typescript
if (response.status === 401 && data.detail === 'Token expired') {
  // Refresh token or redirect to login
  await refreshSession()
}
```

### "Invalid token signature"

**Problem**: BETTER_AUTH_SECRET mismatch or tampered token

**Solution**:
1. Verify `.env` files match:
   ```bash
   # Backend .env
   BETTER_AUTH_SECRET=your-secret

   # Frontend .env (Better Auth config)
   BETTER_AUTH_SECRET=your-secret  # Must match!
   ```

2. Ensure both use HS256 algorithm

3. Check token wasn't modified in transit

### "Access denied: cannot access another user's resources"

**Problem**: JWT uid doesn't match {user_id} in URL

**Example of the problem**:
```typescript
// User A's token (uid: aaaa)
const response = await fetch('/api/bbbb/tasks', {  // ❌ Trying to access User B's tasks
  headers: { 'Authorization': `Bearer ${userAToken}` }
})
// Result: 403 Forbidden
```

**Solution**:
```typescript
// ✅ Always use the authenticated user's own ID in URLs
const userId = session.user.id  // Get from session
const response = await fetch(`/api/${userId}/tasks`, {
  headers: { 'Authorization': `Bearer ${session.token}` }
})
```

### CORS Issues

If you see CORS errors with authentication headers:

**Backend** (FastAPI):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # Allows Authorization header
)
```

**Frontend**:
```typescript
fetch('/api/me', {
  credentials: 'include',  // Include cookies and auth headers
  headers: { 'Authorization': `Bearer ${token}` }
})
```

## Quick Reference

### HTTP Status Codes

| Code | Meaning | Cause |
|------|---------|-------|
| 200 | OK | Authentication and authorization successful |
| 201 | Created | Resource created successfully (authenticated) |
| 401 | Unauthorized | Missing, invalid, expired, or malformed token |
| 403 | Forbidden | Valid token but accessing wrong user's resources |
| 404 | Not Found | Resource doesn't exist (after authentication) |

### Required Headers

```
Authorization: Bearer <jwt_token>
```

### Error Response Format

```json
{
  "detail": "Human-readable error message"
}
```

401 responses also include:
```
WWW-Authenticate: Bearer
```

### Environment Variables

```bash
# Backend .env
BETTER_AUTH_SECRET=your-32-character-minimum-secret-here
```

### Testing Checklist

- [ ] Token includes "Bearer " prefix
- [ ] Token is not expired
- [ ] BETTER_AUTH_SECRET matches frontend
- [ ] User ID in URL matches JWT uid claim
- [ ] Authorization header is included in request
- [ ] CORS allows Authorization header

## Additional Resources

- [Better Auth Documentation](https://www.better-auth.com/)
- [FastAPI Security Tutorial](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Debugger](https://jwt.io/) - Inspect and verify JWT tokens
- [HTTP Status Codes](https://httpstatuses.com/)
