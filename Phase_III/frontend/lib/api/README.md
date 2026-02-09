# API Layer Documentation

## Overview

This directory contains the API client implementation for communicating with the FastAPI backend. All server actions use structured error handling with `ApiResponse<T>` wrappers.

## Architecture

### Server Actions vs Client Components

**Server Actions** (in `tasks.ts`):
- Use `BACKEND_URL` environment variable (server-side only)
- Run on the server, not in the browser
- Access backend API with cookie-based authentication
- Return `ApiResponse<T>` for type-safe error handling

**Client Components**:
- Use `NEXT_PUBLIC_API_URL` environment variable (browser-accessible)
- Run in the browser
- Should rarely need direct API access (prefer server actions)

## Error Handling

### ApiResponse<T> Type

All server actions return `ApiResponse<T>`, a discriminated union:

```typescript
type ApiResponse<T> = ApiSuccess<T> | ApiError

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiError {
  success: false
  error: {
    code: ErrorCode       // Programmatic error code
    message: string       // User-friendly message
    status?: number       // HTTP status code
  }
}
```

### Error Codes

| Error Code | HTTP Status | Meaning | User Action |
|------------|-------------|---------|-------------|
| `AUTH_FAILED` | 401 | JWT token invalid or expired | Redirect to login |
| `ACCESS_DENIED` | 403 | User lacks permission for resource | Show permission error |
| `NOT_FOUND` | 404 | Resource doesn't exist | Show not found message |
| `VALIDATION_ERROR` | 422 | Invalid input data | Display validation errors |
| `BACKEND_UNAVAILABLE` | 503 | Backend service down | Show retry button |
| `CONFIG_ERROR` | 500 | Missing environment variable | Check server configuration |
| `UNKNOWN_ERROR` | N/A | Unexpected error | Show generic error |

### Usage Example

```typescript
import { createTask } from '@/lib/api/tasks'
import { ERROR_CODES, shouldRedirectToLogin } from '@/lib/api/errors'

async function handleCreateTask(taskData: TaskCreate) {
  const result = await createTask(taskData)

  // Check for failure
  if (!result.success) {
    // Handle authentication errors
    if (shouldRedirectToLogin(result.error.code)) {
      router.push('/login')
      return
    }

    // Show user-friendly error
    setError(result.error.message)

    // Enable retry for transient errors
    if (result.error.code === ERROR_CODES.BACKEND_UNAVAILABLE) {
      setShowRetry(true)
    }

    return
  }

  // Success - use the data
  const newTask = result.data
  addToList(newTask)
}
```

## Helper Functions

### `mapStatusToErrorCode(status: number): ErrorCode`

Maps HTTP status codes to programmatic error codes.

```typescript
mapStatusToErrorCode(401) // => "AUTH_FAILED"
mapStatusToErrorCode(503) // => "BACKEND_UNAVAILABLE"
```

### `getUserFriendlyMessage(status: number, errorData?: any): string`

Generates user-friendly error messages.

```typescript
getUserFriendlyMessage(401)
// => "Your session has expired. Please sign in again."

getUserFriendlyMessage(503)
// => "Service temporarily unavailable. Please try again later."
```

### `shouldRedirectToLogin(errorCode: ErrorCode): boolean`

Checks if error requires authentication redirect.

```typescript
shouldRedirectToLogin(ERROR_CODES.AUTH_FAILED) // => true
shouldRedirectToLogin(ERROR_CODES.NOT_FOUND)   // => false
```

## Authentication Flow

All server actions follow this pattern:

1. Extract JWT from cookie using `getJWTToken()` from `next/headers`
2. Extract `user_id` from JWT payload
3. Make authenticated request to backend with JWT in Authorization header
4. Backend validates JWT and returns user-scoped data
5. Frontend returns `ApiResponse<T>` to caller

```typescript
async function makeAuthenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Get JWT from cookie
  const token = await getJWTToken()
  if (!token) {
    return {
      success: false,
      error: {
        code: ERROR_CODES.AUTH_FAILED,
        message: 'Authentication required',
        status: 401
      }
    }
  }

  // Extract user_id from JWT
  const userId = await getUserIdFromJWT()

  // Make request with Authorization header
  const response = await fetch(`${baseURL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  })

  // Handle response...
}
```

## Environment Variables

### Required Variables

**Development (`.env.local`)**:
```env
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production (`.env.production`)**:
```env
BACKEND_URL=https://your-backend.com
NEXT_PUBLIC_API_URL=https://your-backend.com
```

### Variable Usage

- `BACKEND_URL`: Used by **server actions** (not accessible in browser)
- `NEXT_PUBLIC_API_URL`: Used by **client components** (accessible in browser)

**Security Note**: Never expose sensitive operations through `NEXT_PUBLIC_API_URL`. Always use server actions for authenticated operations.

## Available Server Actions

### Task Operations

| Function | Return Type | Description |
|----------|-------------|-------------|
| `createTask(data)` | `ApiResponse<TaskRead>` | Create new task |
| `listTasks()` | `ApiResponse<TaskList>` | Get all user's tasks |
| `getTask(id)` | `ApiResponse<TaskRead>` | Get single task |
| `updateTask(id, data)` | `ApiResponse<TaskRead>` | Update task |
| `toggleTaskComplete(id)` | `ApiResponse<TaskRead>` | Toggle completion |
| `deleteTask(id)` | `ApiResponse<void>` | Delete task |
| `getTaskMetrics()` | `ApiResponse<TaskMetrics>` | Get task statistics |

All operations are **user-scoped** - users can only access their own tasks.

## Best Practices

### 1. Always Check Success

```typescript
const result = await createTask(data)
if (!result.success) {
  // Handle error
  return
}
// Use result.data
```

### 2. Handle Authentication Errors

```typescript
if (shouldRedirectToLogin(result.error.code)) {
  router.push('/login')
  return
}
```

### 3. Show User-Friendly Messages

```typescript
// Good ✅
setError(result.error.message)

// Bad ❌
setError("Error: " + result.error.code)
```

### 4. Enable Retry for Transient Errors

```typescript
if (result.error.code === ERROR_CODES.BACKEND_UNAVAILABLE) {
  setShowRetry(true)
}
```

### 5. Use Optimistic Updates

```typescript
// Show change immediately
setTasks([...tasks, newTask])

// Call API in background
const result = await createTask(taskData)

// Rollback on error
if (!result.success) {
  setTasks(tasks) // Revert
  showError(result.error.message)
}
```

## Troubleshooting

### "Backend URL not configured"

**Cause**: `BACKEND_URL` environment variable not set

**Fix**: Add to `.env.local`:
```env
BACKEND_URL=http://localhost:8000
```

### "Your session has expired"

**Cause**: JWT token invalid or expired (401 error)

**Fix**: User will be redirected to login automatically

### "Service temporarily unavailable"

**Cause**: Backend server not running or unreachable (503 error)

**Fix**:
1. Check backend server is running on correct port
2. Verify `BACKEND_URL` is correct
3. Check network connectivity

### TypeScript Errors

All server actions return `ApiResponse<T>`. Always check `result.success` before accessing `result.data`:

```typescript
// TypeScript error ❌
const task = await createTask(data)
console.log(task.title)

// Correct ✅
const result = await createTask(data)
if (result.success) {
  console.log(result.data.title)
}
```

## Migration Guide

### From Direct Returns to ApiResponse

**Before**:
```typescript
async function createTask(data: TaskCreate): Promise<TaskRead> {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error("Failed")
  return response.json()
}

// Usage
try {
  const task = await createTask(data)
  console.log(task)
} catch (error) {
  console.error(error)
}
```

**After**:
```typescript
async function createTask(data: TaskCreate): Promise<ApiResponse<TaskRead>> {
  const response = await fetch(url, options)
  if (!response.ok) {
    return {
      success: false,
      error: {
        code: mapStatusToErrorCode(response.status),
        message: getUserFriendlyMessage(response.status),
        status: response.status
      }
    }
  }
  return { success: true, data: await response.json() }
}

// Usage
const result = await createTask(data)
if (!result.success) {
  console.error(result.error.message)
  return
}
console.log(result.data)
```

## Related Files

- `types.ts` - Type definitions for API models
- `errors.ts` - Error handling utilities
- `tasks.ts` - Task CRUD server actions
- `client.ts` - Client-side API client (legacy, prefer server actions)
