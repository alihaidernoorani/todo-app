# Better Auth JWT Authentication Flow

**Feature**: 004-modern-ui-ux-dashboard
**Date**: 2026-01-25
**Security Model**: Stateless JWT with HttpOnly cookies

## Overview

This document defines the authentication contract between the Next.js frontend and FastAPI backend using Better Auth for JWT token management. The system uses HttpOnly cookies for token storage (XSS protection) and Bearer token Authorization headers for API requests.

---

## Authentication Architecture

```text
┌─────────────┐                  ┌──────────────┐                  ┌──────────────┐
│   Browser   │                  │   Next.js    │                  │   FastAPI    │
│  (Frontend) │                  │  (Frontend)  │                  │   (Backend)  │
└──────┬──────┘                  └──────┬───────┘                  └──────┬───────┘
       │                                │                                 │
       │  1. POST /api/auth/sign-in     │                                 │
       ├───────────────────────────────>│                                 │
       │    { email, password }         │                                 │
       │                                │  2. Verify credentials          │
       │                                │  (Better Auth SDK)              │
       │                                │                                 │
       │  3. Set HttpOnly cookie        │                                 │
       │<───────────────────────────────┤                                 │
       │    Set-Cookie: auth-token=JWT; │                                 │
       │    HttpOnly; SameSite=Strict   │                                 │
       │                                │                                 │
       │  4. Navigate to /dashboard     │                                 │
       ├───────────────────────────────>│                                 │
       │                                │                                 │
       │  5. Server-side cookie read    │                                 │
       │                                │  6. Extract user_id from JWT    │
       │                                │     (server-only operation)     │
       │                                │                                 │
       │  7. API Request                │                                 │
       │    GET /api/{user_id}/tasks    │                                 │
       │    Authorization: Bearer JWT   ├────────────────────────────────>│
       │                                │  8. Validate JWT signature      │
       │                                │     (shared BETTER_AUTH_SECRET) │
       │                                │                                 │
       │                                │  9. Verify user_id matches JWT  │
       │                                │     claim (403 if mismatch)     │
       │                                │                                 │
       │                                │<────────────────────────────────┤
       │                                │  10. Return task data           │
       │<───────────────────────────────┤                                 │
       │    Response: TaskList          │                                 │
       │                                │                                 │
```

---

## JWT Token Structure

### Token Format

**Standard JWT**: `header.payload.signature`

**Example**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzM4MTY0MDAwfQ.signature
```

### Header

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Claims)

```json
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",  // UUID (REQUIRED)
  "email": "user@example.com",                       // String (REQUIRED)
  "exp": 1738164000,                                 // Unix timestamp (REQUIRED)
  "iat": 1738077600,                                 // Unix timestamp (issued at)
  "jti": "unique-token-id"                           // Token ID for revocation (optional)
}
```

**Required Claims**:
- `user_id` (string, UUID format) - Used for API path construction and authorization
- `email` (string) - User identifier
- `exp` (number, Unix timestamp) - Token expiration time

**Optional Claims**:
- `iat` - Issued at timestamp
- `jti` - Unique token ID for revocation tracking
- `name` - User display name
- `roles` - Array of role strings (for future RBAC)

### Signature

**Algorithm**: HMAC SHA256 (HS256)

**Secret**: Shared `BETTER_AUTH_SECRET` environment variable (MUST be identical in frontend and backend)

**Validation**:
```typescript
// Frontend (Better Auth SDK handles this)
const isValid = verifyJWT(token, BETTER_AUTH_SECRET)

// Backend (FastAPI dependency)
from jose import jwt, JWTError

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

---

## Cookie Storage

### HttpOnly Cookie Configuration

**Cookie Name**: `auth-token`

**Cookie Attributes**:
```http
Set-Cookie: auth-token=<JWT_TOKEN>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
```

**Attribute Breakdown**:
- `HttpOnly`: Prevents JavaScript access (XSS protection)
- `Secure`: Only sent over HTTPS (production) - omitted in local dev
- `SameSite=Strict`: Prevents CSRF attacks (cookie not sent on cross-site requests)
- `Max-Age=900`: Cookie expires in 15 minutes (900 seconds)
- `Path=/`: Cookie sent for all routes

### Security Properties

**Why HttpOnly?**
- JavaScript cannot access `document.cookie` (prevents XSS token theft)
- Tokens automatically included in same-origin requests
- Even if XSS exploit exists, attacker cannot exfiltrate token

**Why SameSite=Strict?**
- Cookie not sent on navigation from external sites
- Protects against CSRF attacks
- User must directly navigate to site for cookie to be sent

**Trade-offs**:
- Cannot read token in client-side JavaScript (need server-side API for user_id extraction)
- Requires CORS configuration for cross-origin API calls

---

## Authentication Endpoints

### Sign-In

**Endpoint**: `POST /api/auth/sign-in`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "<JWT_TOKEN>",  // Also set in HttpOnly cookie
    "expires_at": "2026-01-25T15:45:00Z"
  }
}
```

**Headers**:
```http
Set-Cookie: auth-token=<JWT_TOKEN>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=900
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Invalid credentials"
}
```

---

### Sign-Out

**Endpoint**: `POST /api/auth/sign-out`

**Request**: No body required (cookie sent automatically)

**Success Response** (200 OK):
```json
{
  "message": "Signed out successfully"
}
```

**Headers** (clears cookie):
```http
Set-Cookie: auth-token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

---

### Get Current User

**Endpoint**: `GET /api/auth/session`

**Request**: No body (cookie sent automatically)

**Success Response** (200 OK):
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "expires_at": "2026-01-25T15:45:00Z"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Not authenticated"
}
```

---

## API Authorization Flow

### Request Flow

1. **Client makes API request**:
   ```typescript
   // ApiClient automatically extracts user_id and injects Authorization header
   const tasks = await apiClient.tasks.list()
   ```

2. **ApiClient constructs request**:
   ```typescript
   // Pseudocode
   const userId = await getUserIdFromJWT()  // Server-side call to read cookie
   const url = `${API_BASE_URL}/api/${userId}/tasks`
   const headers = {
     'Authorization': `Bearer ${jwtToken}`,  // Extracted from cookie server-side
     'Content-Type': 'application/json'
   }
   const response = await fetch(url, { headers, credentials: 'include' })
   ```

3. **Backend validates request**:
   ```python
   # FastAPI dependency
   def get_current_user(authorization: str = Header(...)) -> UUID:
       token = authorization.replace("Bearer ", "")
       payload = verify_token(token)  # Validates signature
       return UUID(payload["user_id"])

   # Endpoint handler
   @router.get("/api/{user_id}/tasks")
   async def list_tasks(
       user_id: UUID = Path(...),
       current_user: UUID = Depends(get_current_user)
   ):
       if user_id != current_user:
           raise HTTPException(status_code=403, detail="User ID mismatch")
       # ... fetch tasks
   ```

### Authorization Header Format

```http
Authorization: Bearer <JWT_TOKEN>
```

**Example**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzM4MTY0MDAwfQ.signature
```

---

## User ID Extraction Strategy

### Problem

- JWT stored in HttpOnly cookie (inaccessible to JavaScript)
- Client components need `user_id` for API path construction (`/api/{user_id}/tasks`)

### Solution: Server-Side Extraction

**Approach**: Use Next.js Server Actions to read cookie server-side and return user_id to client

**Implementation**:

**Server Action** (`frontend/src/lib/auth/jwt-utils.ts`):
```typescript
'use server'

import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'

export async function getUserIdFromJWT(): Promise<string | null> {
  const cookieStore = cookies()
  const authToken = cookieStore.get('auth-token')

  if (!authToken) {
    return null
  }

  try {
    const decoded = jwtDecode<{ user_id: string }>(authToken.value)
    return decoded.user_id
  } catch (error) {
    return null
  }
}
```

**Client Component Usage**:
```typescript
'use client'

import { getUserIdFromJWT } from '@/lib/auth/jwt-utils'

export function TaskStream() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    getUserIdFromJWT().then(setUserId)
  }, [])

  // Use userId for API path construction
  const createTask = async (data: TaskCreate) => {
    if (!userId) throw new Error('Not authenticated')
    const response = await fetch(`/api/${userId}/tasks`, { ... })
  }
}
```

**Security Note**: Server Action only decodes JWT (no signature verification) because cookie is already trusted (set by our own server). Backend still validates signature on API requests.

---

## Session Expiry Handling

### Expiry Detection

**Trigger**: API returns 401 Unauthorized

**ApiClient Error Interceptor**:
```typescript
async function handleResponse(response: Response) {
  if (response.status === 401) {
    // 1. Save draft to localStorage (if form has unsaved data)
    await saveDraftIfNeeded()

    // 2. Clear client-side state
    clearUserSession()

    // 3. Redirect to sign-in
    window.location.href = '/sign-in?expired=true'
  }

  return response
}
```

### Draft Recovery Flow

**On Session Expiry**:
1. Detect 401 from API
2. Check if TaskForm has unsaved data (title or description filled)
3. If yes: Save to `localStorage` with key `draft-task-${userId}`
4. Clear auth state and redirect to sign-in

**After Re-Authentication**:
1. Dashboard mounts
2. Check `localStorage` for `draft-task-${userId}`
3. If found and < 24 hours old: Show "Restore unsaved work?" modal
4. User clicks "Restore": Pre-fill form with draft data, delete draft
5. User clicks "Discard": Delete draft

---

## Token Refresh Strategy

### Current Implementation (Short-Lived Tokens)

**Token Lifetime**: 15 minutes (900 seconds)

**Refresh Approach**: Re-authenticate on expiry (no refresh tokens)

**Rationale**:
- Simple implementation (no refresh token storage)
- Low risk window (15-min sessions)
- Acceptable UX for task management (users re-auth every 15 min is reasonable)

### Future Enhancement (Refresh Tokens)

**If longer sessions needed**:
1. Issue access token (5 min) + refresh token (7 days)
2. Store refresh token in HttpOnly cookie (separate cookie)
3. On 401, attempt silent refresh via `/api/auth/refresh`
4. If refresh succeeds: Update access token, retry failed request
5. If refresh fails: Redirect to sign-in

---

## Security Considerations

### Threat Model

**Protected Against**:
- ✅ XSS token theft (HttpOnly cookies prevent `document.cookie` access)
- ✅ CSRF attacks (SameSite=Strict prevents cross-origin requests)
- ✅ Token interception (HTTPS in production, Secure flag)
- ✅ Cross-user data access (backend validates JWT user_id matches path user_id)

**Not Protected Against** (out of scope):
- ❌ Man-in-the-middle attacks on localhost (acceptable for dev; HTTPS required for prod)
- ❌ Compromised backend server (if backend is compromised, all bets are off)
- ❌ Browser exploit that bypasses HttpOnly (OS-level security issue)

### Secret Management

**BETTER_AUTH_SECRET**:
- MUST be at least 32 characters
- MUST use cryptographically random generation
- MUST be identical in frontend and backend `.env` files
- MUST NEVER be committed to git
- SHOULD rotate periodically (invalidates all sessions)

**Example Generation**:
```bash
openssl rand -base64 32
```

**Environment Variables**:
```env
# Frontend (.env.local)
BETTER_AUTH_SECRET=<32-char-random-string>
BETTER_AUTH_URL=http://localhost:3000

# Backend (.env)
BETTER_AUTH_SECRET=<same-32-char-string>
```

### CORS Configuration

**Required for Cross-Origin API Calls** (if frontend and backend on different ports/domains):

**Backend CORS Setup** (FastAPI):
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Frontend Fetch Config**:
```typescript
fetch(url, {
  credentials: 'include',  // Send cookies cross-origin
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## Testing Checklist

### Authentication Flow Tests

- [ ] Sign-in with valid credentials sets HttpOnly cookie
- [ ] Sign-in with invalid credentials returns 401 without setting cookie
- [ ] HttpOnly cookie is inaccessible to `document.cookie` in browser console
- [ ] API requests automatically include `Authorization: Bearer` header
- [ ] API requests with valid JWT return data
- [ ] API requests with expired JWT return 401
- [ ] API requests with mismatched user_id return 403
- [ ] Sign-out clears HttpOnly cookie
- [ ] Session expiry triggers draft save and redirect
- [ ] Draft recovery modal shows after re-authentication

### Security Tests

- [ ] XSS attempt to read `document.cookie` fails
- [ ] CSRF attempt from external site fails (SameSite=Strict)
- [ ] Direct API call without JWT returns 401
- [ ] User A cannot access User B's tasks (403)
- [ ] BETTER_AUTH_SECRET not found in client bundle (check DevTools > Sources)

---

## Summary

This authentication contract defines:
1. **JWT Structure**: HS256 signature, required claims (user_id, email, exp)
2. **Cookie Storage**: HttpOnly + Secure + SameSite=Strict for XSS/CSRF protection
3. **Authorization**: Bearer token in Authorization header, validated by backend
4. **User ID Extraction**: Server Actions read HttpOnly cookie, decode JWT, return user_id
5. **Session Expiry**: 401 triggers draft save + redirect; re-auth prompts draft restore
6. **Security Model**: Shared secret, signature validation, path-based authorization
7. **CORS**: `credentials: 'include'` for cross-origin cookie transmission

**Next Artifact**: [frontend-backend-types.ts](./frontend-backend-types.ts) - TypeScript type definitions
