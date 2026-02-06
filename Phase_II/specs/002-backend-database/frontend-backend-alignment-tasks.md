# Implementation Tasks: Frontend-Backend Alignment

**Feature**: Backend and Database for Phase 2 (Frontend Integration Fix)
**Branch**: `005-backend-frontend-alignment`
**Created**: 2026-02-06
**Priority**: P0 (Critical - Blocks user functionality)

## Overview

This task list addresses the server action failures discovered during testing. The backend is correctly implemented; frontend server actions need fixes to properly integrate with backend API endpoints.

**Problem**: "Add Task" button triggers 500 error. Backend logs show no POST request, indicating failure inside Next.js server action.

**Root Causes**:
1. Server actions using `NEXT_PUBLIC_API_URL` (client-side variable) instead of `BACKEND_URL` (server-only)
2. Environment variable not accessible in server context
3. Missing structured error handling

**Success Criteria** (from Session 2026-02-06 clarifications):
- ✅ Server-only `BACKEND_URL` variable used in all server actions
- ✅ Consistent API URL across all server actions
- ✅ Cookie-based JWT authentication (already working)
- ✅ Structured error responses (`ApiResponse<T>` wrapper)
- ✅ Environment consistency across local and production

---

## Phase 1: Setup & Environment Configuration

**Goal**: Configure environment variables and verify server action prerequisites

### Tasks

- [x] T001 Add BACKEND_URL to frontend/.env.local with value `http://localhost:8000`
- [x] T002 Add BACKEND_URL to frontend/.env.production with value `https://huggingface.co/spaces/alihaidernoorani/Todo_App`
- [x] T003 Add BACKEND_URL to frontend/.env.example with documentation comment
- [x] T004 [P] Verify frontend/lib/auth/jwt-utils.ts correctly uses `cookies()` from `next/headers`
- [x] T005 [P] Verify backend endpoints are accessible at http://localhost:8000/api/{user_id}/tasks

**Acceptance Criteria**:
- Environment files contain `BACKEND_URL` variable
- Server actions can access `process.env.BACKEND_URL`
- Auth utilities confirmed working with cookie-based JWT

**Estimated Time**: 15 minutes

---

## Phase 2: Type Definitions & Error Handling Infrastructure

**Goal**: Define structured error response types per FR-026 and FR-027

### Tasks

- [x] T006 Create ApiError interface in frontend/lib/api/types.ts
- [x] T007 Create ApiSuccess interface in frontend/lib/api/types.ts
- [x] T008 Create ApiResponse type union in frontend/lib/api/types.ts
- [x] T009 Add mapStatusToErrorCode helper function to frontend/lib/api/errors.ts
- [x] T010 Add getUserFriendlyMessage helper function to frontend/lib/api/errors.ts
- [x] T011 Export error code constants (AUTH_FAILED, BACKEND_UNAVAILABLE, etc.) from frontend/lib/api/errors.ts

**Code Reference** (T006-T008 in frontend/lib/api/types.ts):
```typescript
export interface ApiError {
  success: false
  error: {
    code: string          // e.g., "BACKEND_UNAVAILABLE", "AUTH_FAILED"
    message: string       // User-friendly message
    status?: number       // HTTP status code
  }
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
```

**Code Reference** (T009-T010 in frontend/lib/api/errors.ts):
```typescript
export function mapStatusToErrorCode(status: number): string {
  const codeMap: Record<number, string> = {
    401: 'AUTH_FAILED',
    403: 'ACCESS_DENIED',
    404: 'NOT_FOUND',
    422: 'VALIDATION_ERROR',
    503: 'BACKEND_UNAVAILABLE'
  }
  return codeMap[status] || 'UNKNOWN_ERROR'
}

export function getUserFriendlyMessage(status: number, errorData: any): string {
  const messages: Record<number, string> = {
    401: 'Your session has expired. Please sign in again.',
    403: 'Access denied. You can only access your own tasks.',
    404: 'Task not found or you don\'t have permission to access it.',
    422: 'Invalid task data. Please check your input.',
    503: 'Service temporarily unavailable. Please try again later.'
  }
  return errorData.detail || messages[status] || `Error: HTTP ${status}`
}
```

**Acceptance Criteria**:
- Type definitions compile without errors
- Error helper functions return correct codes and messages
- Types exported and importable from other modules

**Estimated Time**: 25 minutes

---

## Phase 3: Server Action Core Fix (Critical Path)

**Goal**: Fix makeAuthenticatedRequest to use BACKEND_URL and return structured errors

### Tasks

- [x] T012 Update baseURL assignment in frontend/lib/api/tasks.ts line 47 from NEXT_PUBLIC_API_URL to BACKEND_URL
- [x] T013 Add explicit check for missing BACKEND_URL in frontend/lib/api/tasks.ts makeAuthenticatedRequest
- [x] T014 Update makeAuthenticatedRequest return type from `Promise<T>` to `Promise<ApiResponse<T>>` in frontend/lib/api/tasks.ts
- [x] T015 Wrap successful response in ApiSuccess structure in frontend/lib/api/tasks.ts makeAuthenticatedRequest
- [x] T016 Replace error throwing with ApiError return in frontend/lib/api/tasks.ts makeAuthenticatedRequest
- [x] T017 Add try-catch for network failures returning BACKEND_UNAVAILABLE error in frontend/lib/api/tasks.ts

**Before (T012 - Line 47 in frontend/lib/api/tasks.ts)**:
```typescript
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

**After (T012)**:
```typescript
const baseURL = process.env.BACKEND_URL || 'http://localhost:8000'
```

**Before (T014-T016 - makeAuthenticatedRequest function)**:
```typescript
async function makeAuthenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // ... auth logic ...

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    let errorMessage = errorData.detail || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  return response.json()
}
```

**After (T014-T017)**:
```typescript
async function makeAuthenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // ... auth logic ...

    const baseURL = process.env.BACKEND_URL
    if (!baseURL) {
      return {
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'Backend URL not configured. Please check environment variables.',
          status: 500
        }
      }
    }

    const response = await fetch(url, { ...options, headers })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: {
          code: mapStatusToErrorCode(response.status),
          message: getUserFriendlyMessage(response.status, errorData),
          status: response.status
        }
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Unable to connect to the server. Please try again.',
        status: 503
      }
    }
  }
}
```

**Acceptance Criteria**:
- Server actions use `process.env.BACKEND_URL` (not `NEXT_PUBLIC_API_URL`)
- Missing BACKEND_URL returns clear CONFIG_ERROR
- All responses wrapped in ApiResponse structure
- Network failures return BACKEND_UNAVAILABLE with user-friendly message
- HTTP errors return mapped error codes and messages

**Estimated Time**: 45 minutes

---

## Phase 4: Update Server Action Exports

**Goal**: Update all exported server action functions to return ApiResponse types

### Tasks

- [x] T018 Update createTask return type to `Promise<ApiResponse<TaskRead>>` in frontend/lib/api/tasks.ts
- [x] T019 Update listTasks return type to `Promise<ApiResponse<TaskList>>` in frontend/lib/api/tasks.ts
- [x] T020 Update getTask return type to `Promise<ApiResponse<TaskRead>>` in frontend/lib/api/tasks.ts
- [x] T021 Update updateTask return type to `Promise<ApiResponse<TaskRead>>` in frontend/lib/api/tasks.ts
- [x] T022 Update toggleTaskComplete return type to `Promise<ApiResponse<TaskRead>>` in frontend/lib/api/tasks.ts
- [x] T023 Update deleteTask return type to `Promise<ApiResponse<void>>` in frontend/lib/api/tasks.ts
- [x] T024 Update getTaskMetrics return type to `Promise<ApiResponse<TaskMetrics>>` in frontend/lib/api/tasks.ts

**Before (All functions)**:
```typescript
export async function createTask(taskData: TaskCreate): Promise<TaskRead>
export async function listTasks(): Promise<TaskList>
// etc...
```

**After (All functions)**:
```typescript
export async function createTask(taskData: TaskCreate): Promise<ApiResponse<TaskRead>>
export async function listTasks(): Promise<ApiResponse<TaskList>>
// etc...
```

**Acceptance Criteria**:
- All server action exports have ApiResponse wrapper
- TypeScript compilation succeeds
- Return types match internal makeAuthenticatedRequest usage

**Estimated Time**: 20 minutes

---

## Phase 5: Verify Other API Files

**Goal**: Ensure no other files use NEXT_PUBLIC_API_URL in server contexts

### Tasks

- [x] T025 Check frontend/lib/api/client.ts for NEXT_PUBLIC_API_URL usage and replace if found
- [x] T026 [P] Grep frontend/lib directory for any remaining NEXT_PUBLIC_API_URL in server actions
- [x] T027 [P] Verify frontend/components/AppInitializer.tsx uses NEXT_PUBLIC_API_URL correctly (client component only)

**Acceptance Criteria**:
- No server actions use `NEXT_PUBLIC_API_URL`
- Client components can still use `NEXT_PUBLIC_API_URL` if needed
- All API communication goes through BACKEND_URL in server context

**Estimated Time**: 15 minutes

---

## Phase 6: Frontend Component Error Handling (US1 - Create Task)

**Goal**: Update "Add Task" functionality to handle ApiResponse and display errors

### Tasks

- [x] T028 [US1] Update task creation handler in frontend/app/dashboard/page.tsx to check result.success
- [x] T029 [US1] Add error state variable for task creation errors in frontend/app/dashboard/page.tsx
- [x] T030 [US1] Display error message when result.success is false in frontend/app/dashboard/page.tsx
- [x] T031 [US1] Add retry button for BACKEND_UNAVAILABLE errors in frontend/app/dashboard/page.tsx
- [x] T032 [US1] Clear error state on successful task creation in frontend/app/dashboard/page.tsx

**Example Handler Update (T028-T032)**:
```typescript
async function handleCreateTask(taskData: TaskCreate) {
  setLoading(true)
  setError(null)

  const result = await createTask(taskData)

  if (!result.success) {
    setError(result.error.message)

    // Show retry for transient errors
    if (result.error.code === 'BACKEND_UNAVAILABLE') {
      setShowRetry(true)
    }

    setLoading(false)
    return
  }

  // Success - update UI
  addTaskToList(result.data)
  setLoading(false)
  setError(null)
}
```

**Acceptance Criteria**:
- Task creation displays loading state
- Errors show user-friendly messages
- BACKEND_UNAVAILABLE errors show retry button
- Successful creation adds task to UI and clears errors

**Estimated Time**: 30 minutes

---

## Phase 7: Frontend Component Error Handling (US2 - List Tasks)

**Goal**: Update task list fetching to handle ApiResponse

### Tasks

- [x] T033 [US2] Update task list fetch handler in frontend/app/dashboard/page.tsx to check result.success
- [x] T034 [US2] Add error state for task list loading errors in frontend/app/dashboard/page.tsx
- [x] T035 [US2] Display error message or empty state when list fetch fails in frontend/app/dashboard/page.tsx
- [x] T036 [US2] Add retry mechanism for failed list fetches in frontend/app/dashboard/page.tsx

**Acceptance Criteria**:
- Task list shows loading skeleton during fetch
- Failed fetches display user-friendly error
- Empty list shows helpful empty state (not error)
- Retry button available for transient failures

**Estimated Time**: 25 minutes

---

## Phase 8: Frontend Component Error Handling (US4 - Update/Toggle)

**Goal**: Update task update and toggle handlers to handle ApiResponse

### Tasks

- [x] T037 [US4] Update task toggle handler in task components to check result.success
- [x] T038 [US4] Add optimistic UI update with rollback on error for toggle operations
- [x] T039 [US4] Update task edit handler in task components to check result.success
- [x] T040 [US4] Display inline error messages for failed update operations

**Acceptance Criteria**:
- Toggle operations show optimistic UI update
- Failed toggles rollback to previous state with error message
- Edit operations display inline errors
- Successful updates reflect in UI immediately

**Estimated Time**: 35 minutes

---

## Phase 9: Frontend Component Error Handling (US5 - Delete)

**Goal**: Update task delete handler to handle ApiResponse

### Tasks

- [x] T041 [US5] Update task delete handler to check result.success
- [x] T042 [US5] Add confirmation dialog before delete operation
- [x] T043 [US5] Show error toast for failed delete operations
- [x] T044 [US5] Remove task from UI only after successful delete confirmation

**Acceptance Criteria**:
- Delete requires user confirmation
- Failed deletes show error toast
- Successful deletes remove task from UI
- No orphaned tasks due to failed backend deletes

**Estimated Time**: 25 minutes

---

## Phase 10: Integration Testing

**Goal**: Verify end-to-end functionality with manual and automated tests

### Tasks

- [ ] T045 Manual test: Verify `BACKEND_URL` environment variable is set in `.env.local`
- [ ] T046 Manual test: Start backend server and verify health endpoint responds
- [ ] T047 Manual test: Login to frontend and verify JWT token is generated
- [ ] T048 Manual test: Open Network tab and verify backend URL in task API requests
- [ ] T049 Manual test: Create task and verify POST `/api/{user_id}/tasks` returns 201
- [ ] T050 Manual test: Verify task list shows newly created task (GET request succeeds)
- [ ] T051 Manual test: Toggle task completion and verify PATCH request succeeds
- [ ] T052 Manual test: Edit task and verify PUT request succeeds
- [ ] T053 Manual test: Delete task and verify DELETE request succeeds
- [ ] T054 Manual test: Test error scenarios (backend down, invalid token, network failure)
- [ ] T055 Manual test: Verify error messages are user-friendly (not raw HTTP errors)
- [ ] T056 Write integration test for task creation flow in frontend/tests/integration/task-operations.spec.ts
- [ ] T057 Write integration test for task list fetch in frontend/tests/integration/task-operations.spec.ts
- [ ] T058 Write integration test for error handling in frontend/tests/integration/task-operations.spec.ts

**Manual Testing Checklist**:
```
Environment Setup:
- [ ] BACKEND_URL set in .env.local
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000

CRUD Operations:
- [ ] Task creation succeeds (no 500 error)
- [ ] Task list loads after creation
- [ ] Toggle complete works
- [ ] Task edit works
- [ ] Task delete works

Error Handling:
- [ ] User-friendly error messages display
- [ ] Retry button shows for transient errors
- [ ] Auth errors prompt re-login
- [ ] Network errors show appropriate message

Backend Integration:
- [ ] Correct backend URL in network requests
- [ ] user_id present in API paths
- [ ] JWT token in Authorization header
- [ ] All responses match ApiResponse<T> structure
```

**Acceptance Criteria**:
- All manual tests pass
- Integration tests cover critical paths
- Error scenarios properly handled
- All 5 clarifications from spec validated

**Estimated Time**: 90 minutes

---

## Phase 11: Documentation & Cleanup

**Goal**: Update documentation and remove deprecated code

### Tasks

- [x] T059 Update frontend/README.md with BACKEND_URL environment variable requirement
- [ ] T060 [P] Update specs/002-backend-database/quickstart.md with new environment setup steps
- [x] T061 [P] Document error codes and their meanings in frontend/lib/api/README.md
- [x] T062 Remove any commented-out code related to NEXT_PUBLIC_API_URL
- [x] T063 Update TypeScript strict mode if any type errors surface

**Acceptance Criteria**:
- Documentation reflects current implementation
- Environment variables clearly documented
- No deprecated code remains
- TypeScript compilation succeeds with no errors

**Estimated Time**: 20 minutes

---

## Dependencies & Execution Order

### Critical Path (Must be sequential):
```
Phase 1 (Setup) → Phase 2 (Types) → Phase 3 (Core Fix) → Phase 4 (Exports) → Phases 6-9 (Components) → Phase 10 (Testing)
```

### Parallel Opportunities:

**After Phase 2 completes**:
- Phase 5 (Verification) can run in parallel with Phase 3

**After Phase 4 completes**:
- Phases 6, 7, 8, 9 (Component updates) can run in parallel (different components)

**After Phase 9 completes**:
- Phase 10 (Testing) and Phase 11 (Documentation) can run in parallel

### User Story Dependencies:
- **US1 (Create Task)**: No dependencies - can test independently
- **US2 (List Tasks)**: No dependencies - can test independently
- **US4 (Update Task)**: Requires US1 (need task to update)
- **US5 (Delete Task)**: Requires US1 (need task to delete)

---

## Implementation Strategy

### MVP Scope (Phase 1-4 + US1):
**Goal**: Fix critical "Add Task" 500 error
**Time**: ~2 hours
**Deliverable**: Task creation works end-to-end

**Tasks**: T001-T032

**Success Criteria**:
- No 500 error when clicking "Add Task"
- Task appears in list after creation
- User-friendly error if backend unavailable

### Full Scope (All Phases):
**Goal**: Complete frontend-backend alignment with error handling
**Time**: ~4-5 hours
**Deliverable**: All CRUD operations work with proper error handling

**Tasks**: T001-T063

**Success Criteria**:
- All 5 clarifications validated
- All CRUD operations work
- Error handling for all failure modes
- Integration tests pass
- Documentation updated

---

## Task Summary

**Total Tasks**: 63
- Setup & Environment: 5 tasks (15 min)
- Type Definitions: 6 tasks (25 min)
- Core Server Action Fix: 6 tasks (45 min)
- Server Action Exports: 7 tasks (20 min)
- Verification: 3 tasks (15 min)
- Component Updates (US1): 5 tasks (30 min)
- Component Updates (US2): 4 tasks (25 min)
- Component Updates (US4): 4 tasks (35 min)
- Component Updates (US5): 4 tasks (25 min)
- Integration Testing: 14 tasks (90 min)
- Documentation: 5 tasks (20 min)

**Estimated Total Time**: ~5 hours

**Parallel Opportunities**:
- After types defined: Verification (T025-T027) || Core fix (T012-T017)
- After exports updated: All component phases (T028-T044) can run in parallel
- Final phase: Testing (T045-T058) || Documentation (T059-T063)

**Critical Success Metrics**:
1. Zero 500 errors during task operations
2. All API requests use correct `BACKEND_URL`
3. All responses follow `ApiResponse<T>` structure
4. User-friendly error messages in UI
5. End-to-end CRUD flow works in both development and production

---

## Next Steps

1. **Start with MVP Scope** (T001-T032) to fix critical create task issue
2. **Validate MVP** before proceeding to full scope
3. **Complete remaining phases** in dependency order
4. **Run integration tests** to verify all scenarios
5. **Update documentation** and clean up code
6. **Create PR** with summary and test plan

**Command to start**: Begin with Phase 1 (T001-T005) to set up environment variables.
