# Implementation Plan: Backend and Database for Phase 2 (Revised)

**Branch**: `002-backend-database` | **Date**: 2026-01-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-backend-database/spec.md`
**Revision**: v2.0 - Updated API design per user requirements

## Summary

Implement a persistent backend for the Todo application using FastAPI, SQLModel, and Neon PostgreSQL. This revision updates the API design to use:
1. **Path-based user context**: `/api/{user_id}/tasks` instead of header-based
2. **Resource name**: `tasks` (not `todos`)
3. **PUT method** for full updates
4. **Dedicated PATCH endpoint** for completion toggle: `/api/{user_id}/tasks/{id}/complete`

All database queries must filter by `user_id` to ensure multi-tenant security.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: FastAPI, SQLModel, psycopg (v3), uvicorn, Alembic
**Storage**: Neon Serverless PostgreSQL
**Testing**: pytest, pytest-asyncio, httpx (TestClient)
**Target Platform**: Linux server (containerized deployment)
**Project Type**: Web application (backend only for this feature)
**Performance Goals**: <2 seconds for CRUD operations (up to 1000 items per user)
**Constraints**: All queries must include user_id filter; no auth enforcement yet (Spec-2)
**Scale/Scope**: Initial MVP supporting multiple users with isolated data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Multi-Tier Isolation | ✅ PASS | Backend code in `/backend/` |
| II. Persistence First | ✅ PASS | SQLModel + Neon PostgreSQL; Alembic for migrations |
| III. Secure by Design | ⚠️ PARTIAL | Data isolation enforced via path param; JWT auth deferred to Spec-2 |
| IV. Zero Manual Coding | ✅ PASS | All code Claude Code generated |
| V. Test-First Discipline | ✅ PASS | Test strategy defined in research.md |
| VI. API Contract Enforcement | ✅ PASS | REST endpoints documented in contracts/ |

**Note on Principle III**: JWT authentication is explicitly deferred to a separate specification. This feature implements data isolation via user_id path parameter. This is documented and acceptable for MVP.

## Project Structure

### Documentation (this feature)

```text
specs/002-backend-database/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical decisions and research
├── data-model.md        # Entity definitions and schema
├── quickstart.md        # Developer setup guide
├── contracts/
│   └── task_api_contract.md  # API endpoint definitions
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (created by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Environment configuration
│   ├── database.py             # Database session management
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py             # Task SQLModel (table=True)
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── task.py             # TaskCreate, TaskUpdate, TaskRead
│   ├── services/
│   │   ├── __init__.py
│   │   └── task_service.py     # CRUD business logic
│   └── api/
│       ├── __init__.py
│       ├── deps.py             # Dependency injection (get_session)
│       └── v1/
│           ├── __init__.py
│           ├── router.py       # API router aggregator
│           └── tasks.py        # Task CRUD endpoints
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── contract/
│   │   └── test_task_contract.py
│   ├── integration/
│   │   └── test_task_api.py
│   └── unit/
│       └── test_task_service.py
├── alembic/
│   ├── versions/
│   │   └── 001_create_tasks_table.py
│   └── env.py
├── alembic.ini
├── pyproject.toml
├── .env.example
└── .gitignore
```

**Structure Decision**: Web application structure selected per Constitution Principle I (Multi-Tier Isolation). Backend code isolated in `/backend/` with clear separation of models, schemas, services, and API layers.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         FastAPI Application                       │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   API       │───▶│  Services   │───▶│  Database Session   │  │
│  │ (tasks.py)  │    │ (task_svc)  │    │   (SQLModel)        │  │
│  └─────────────┘    └─────────────┘    └──────────┬──────────┘  │
│         │                                         │              │
│         │                                         ▼              │
│  ┌─────────────┐                         ┌─────────────────────┐│
│  │  Path Param │                         │  Neon PostgreSQL    ││
│  │  {user_id}  │                         │  (tasks table)      ││
│  └─────────────┘                         └─────────────────────┘│
└──────────────────────────────────────────────────────────────────┘

Request Flow:
1. Request arrives at /api/{user_id}/tasks endpoint
2. Path parameter extracts user_id (UUID validation)
3. Pydantic schema validates request body
4. Service layer executes business logic
5. All DB queries include user_id filter (data isolation)
6. Response serialized via Pydantic schema
```

## Key Technical Decisions

| Decision | Choice | Rationale | Alternatives Rejected |
|----------|--------|-----------|----------------------|
| ORM | SQLModel | Constitution mandate; FastAPI integration | Raw SQL, SQLAlchemy alone |
| Async Driver | psycopg (v3) | Native async; Neon compatible | asyncpg (no ORM), psycopg2 (no async) |
| Data Isolation | Path-based user_id | RESTful; explicit in URL | Header-based (less RESTful) |
| Update Method | PUT (full replace) | RESTful semantics for update | PATCH only (partial) |
| Toggle Completion | Dedicated PATCH /complete | Clear intent; single-purpose | PUT with full body (verbose) |
| Validation | Pydantic v2 | Performance; SQLModel built-in | Manual validation |
| Migration | Alembic | Constitution mandate; SQLAlchemy standard | Django migrations (wrong framework) |

See [research.md](./research.md) for detailed decision documentation.

## API Endpoints Summary

| Method | Path | Description | Status Codes |
|--------|------|-------------|--------------|
| GET | `/api/{user_id}/tasks` | List all tasks for user | 200, 400 |
| POST | `/api/{user_id}/tasks` | Create a new task | 201, 400, 422 |
| GET | `/api/{user_id}/tasks/{id}` | Get single task details | 200, 400, 404 |
| PUT | `/api/{user_id}/tasks/{id}` | Full update of task | 200, 400, 404, 422 |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete a task | 204, 400, 404 |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle completion status | 200, 404 |

See [contracts/task_api_contract.md](./contracts/task_api_contract.md) for full API specification.

## Data Model Summary

**Task Entity**:
- `id`: UUID (PK, auto-generated)
- `title`: VARCHAR(255), required
- `description`: VARCHAR(2000), nullable
- `is_completed`: BOOLEAN, default false
- `created_at`: TIMESTAMP WITH TIME ZONE, auto-generated
- `user_id`: UUID, required, indexed

**Indexes**:
- `idx_task_user_id` on (user_id)
- `idx_task_user_created` on (user_id, created_at DESC)

See [data-model.md](./data-model.md) for full schema details.

## Testing Strategy

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Contract | `tests/contract/` | Verify API shape matches OpenAPI spec |
| Integration | `tests/integration/` | Full request cycle with test database |
| Unit | `tests/unit/` | Service logic with mocked sessions |

**Key Test Scenarios**:
1. CRUD operations succeed for valid inputs
2. Validation rejects invalid inputs with correct error codes
3. Cross-user access returns 404 (not 403)
4. Empty list returns `[]`, not error
5. Database unavailability returns 503
6. Toggle completion flips is_completed value

## Complexity Tracking

> No constitution violations requiring justification.

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| Layers | 4 (API → Service → Model → DB) | Standard separation of concerns |
| Schemas | 4 (Base, Create, Update, Read) | Pydantic best practice for CRUD |
| Endpoints | 6 | Minimum for CRUD + toggle operation |

## Dependencies

**Runtime**:
- fastapi >= 0.109.0
- sqlmodel >= 0.0.14
- psycopg[binary] >= 3.1.0
- uvicorn >= 0.27.0
- python-dotenv >= 1.0.0
- alembic >= 1.13.0

**Development**:
- pytest >= 8.0.0
- pytest-asyncio >= 0.23.0
- httpx >= 0.26.0
- aiosqlite >= 0.19.0
- ruff >= 0.2.0
- mypy >= 1.8.0

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Neon connection issues | Medium | High | Connection pooling; graceful error handling |
| user_id filter bypass | Low | Critical | Service layer enforcement; code review; tests |
| Migration failures | Low | Medium | Alembic with rollback; test migrations first |

## Next Steps

1. Run `/sp.tasks` to generate implementation task list
2. Execute tasks in dependency order
3. Validate each user story independently
4. Run full test suite before merge
5. Proceed to authentication feature (Spec-2)

---

# Addendum: Frontend-Backend Alignment (2026-02-06)

**Context**: Server action failures discovered during testing. Backend implementation is correct; frontend integration needs fixes based on clarifications added to spec.md (Session 2026-02-06).

## Issue Summary

**Problem**: "Add Task" button triggers 500 error. Backend logs show no POST request, indicating failure inside Next.js server action.

**Root Causes** (identified via `/sp.clarify`):
1. Server actions using `NEXT_PUBLIC_API_URL` (client-side variable) instead of `BACKEND_URL` (server-only)
2. Environment variable not accessible in server context
3. Potential JWT token retrieval issues from cookies

**Backend Status**: ✅ All endpoints correctly implemented and tested
**Frontend Status**: ⚠️ Requires alignment fixes

## Frontend Alignment Plan

### Phase 0: Current State Analysis

**Files Requiring Changes**:
- `frontend/lib/api/tasks.ts` - Line 47 uses `NEXT_PUBLIC_API_URL`
- `frontend/lib/api/client.ts` - May have similar issue
- `frontend/.env*` files - Need `BACKEND_URL` addition

**Files Already Correct**:
- `frontend/lib/auth/jwt-utils.ts` - Correctly uses `cookies()` from `next/headers`
- `backend/src/api/v1/tasks.py` - All endpoints working correctly
- `backend/src/api/v1/router.py` - Routing configured properly

### Phase 1: Environment Variable Fix

**Objective**: Replace `NEXT_PUBLIC_API_URL` with server-only `BACKEND_URL` in all server actions

**Changes Required**:

1. **Add BACKEND_URL to environment files**:
```bash
# frontend/.env.local
BACKEND_URL=http://localhost:8000

# frontend/.env.production
BACKEND_URL=https://huggingface.co/spaces/alihaidernoorani/Todo_App
```

2. **Update `frontend/lib/api/tasks.ts` Line 47**:
```typescript
// BEFORE (incorrect - client-side variable):
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// AFTER (correct - server-only variable):
const baseURL = process.env.BACKEND_URL || 'http://localhost:8000'
```

3. **Verify fallback handling**:
```typescript
// Add explicit check for missing BACKEND_URL
if (!process.env.BACKEND_URL) {
  throw new Error('BACKEND_URL environment variable is required for server actions')
}
```

### Phase 2: Structured Error Responses

**Objective**: Implement structured error returns per FR-026 and FR-027

**Type Definitions** (`frontend/lib/api/types.ts`):
```typescript
// Add to existing types
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

**Update Server Action Returns** (`frontend/lib/api/tasks.ts`):
```typescript
// Modify makeAuthenticatedRequest to return ApiResponse<T>
async function makeAuthenticatedRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // ... existing code ...

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

// Helper functions
function mapStatusToErrorCode(status: number): string {
  const codeMap: Record<number, string> = {
    401: 'AUTH_FAILED',
    403: 'ACCESS_DENIED',
    404: 'NOT_FOUND',
    422: 'VALIDATION_ERROR',
    503: 'BACKEND_UNAVAILABLE'
  }
  return codeMap[status] || 'UNKNOWN_ERROR'
}

function getUserFriendlyMessage(status: number, errorData: any): string {
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

### Phase 3: Frontend Component Updates

**Update task components to handle ApiResponse**:
```typescript
// Example: CreateTaskButton component
async function handleCreateTask(taskData: TaskCreate) {
  const result = await createTask(taskData)

  if (!result.success) {
    // Display user-friendly error message
    setError(result.error.message)

    // Optionally retry for transient errors
    if (result.error.code === 'BACKEND_UNAVAILABLE') {
      setShowRetry(true)
    }
    return
  }

  // Success - update UI with result.data
  addTaskToList(result.data)
}
```

### Testing & Validation

**Integration Tests**:
1. Verify `BACKEND_URL` is accessible in server actions
2. Test all CRUD operations end-to-end
3. Verify error responses are structured correctly
4. Confirm user-friendly messages display properly

**Manual Testing Checklist**:
- [ ] Environment variable `BACKEND_URL` set in `.env.local`
- [ ] Server actions can access `process.env.BACKEND_URL`
- [ ] "Add Task" button successfully creates task (no 500 error)
- [ ] Task list loads immediately after creation
- [ ] Toggle complete works without errors
- [ ] Delete removes task from UI
- [ ] Error messages are user-friendly (not raw HTTP errors)
- [ ] Network tab shows correct backend URL in requests

### Success Criteria (from Clarifications)

All 5 clarifications must be validated:

1. ✅ **BACKEND_URL server-only variable**: `process.env.BACKEND_URL` used in server actions
2. ✅ **Consistent API URL usage**: All server actions use same `BACKEND_URL` variable
3. ✅ **Cookie-based authentication**: JWT tokens read via `cookies()` from `next/headers`
4. ✅ **Structured error responses**: All server actions return `ApiResponse<T>` type
5. ✅ **Environment consistency**: `BACKEND_URL` defined in both `.env.local` and `.env.production`

### Implementation Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Add BACKEND_URL to .env files | 5 minutes |
| 1 | Update tasks.ts makeAuthenticatedRequest | 15 minutes |
| 1 | Verify other files don't use NEXT_PUBLIC_API_URL | 10 minutes |
| 2 | Add ApiResponse types | 10 minutes |
| 2 | Update error handling in makeAuthenticatedRequest | 30 minutes |
| 2 | Add error code mapping functions | 15 minutes |
| 3 | Update task components to handle ApiResponse | 45 minutes |
| 3 | Add error display UI | 30 minutes |
| Testing | Integration tests | 60 minutes |
| Testing | Manual validation | 30 minutes |
| **Total** | | **~4 hours** |

### PHR Reference

This addendum is based on clarifications documented in:
- **PHR**: `history/prompts/002-backend-database/0009-server-action-failure-clarification.spec.prompt.md`
- **Clarifications**: `spec.md` Session 2026-02-06 (5 Q&A pairs)

---

**Addendum Status**: Ready for Implementation
**Next Command**: `/sp.tasks` (to generate detailed task list incorporating addendum changes)
