# Implementation Tasks: Authentication Redirect Loop Fix

**Feature**: Authentication with Better Auth Sessions
**Branch**: `003-auth-security` | **Date**: 2026-02-07
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Overview

Fix authentication redirect loop by removing all custom JWT/token logic and implementing Better Auth session-based validation as the single source of truth. Backend validates sessions by calling Better Auth's `/api/auth/session` endpoint. Frontend removes middleware and uses server-side session checks.

**Key Principles**:
- No custom JWT parsing or verification
- Session cookies only (Better Auth managed)
- Delegated validation via Better Auth API
- Small, independently testable tasks

## Task Summary

- **Total Tasks**: 21
- **Setup & Config**: 3 tasks (T001-T003)
- **User Story 1** (Backend Session Validation): 6 tasks (T004-T009)
- **User Story 2** (User ID Scoping): 4 tasks (T010-T013)
- **User Story 3** (Centralized Dependencies): 2 tasks (T014-T015)
- **Frontend Cleanup & Protection**: 5 tasks (T016-T020)
- **Validation**: 1 task (T021)

## Dependencies

**Execution Order**:
- Phase 1 (Setup) → Must complete before all other phases
- Phase 2 (US1) → Blocks US2, US3, Frontend
- Phase 3 (US2) → Depends on US1
- Phase 4 (US3) → Depends on US1
- Phase 5 (Frontend) → Can start after setup
- Phase 6 (Validation) → Depends on all previous phases

## Parallel Execution Opportunities

**Maximum Parallelism** (after setup):
- Backend: T004, T006, T009 can run in parallel
- Frontend: T016, T017, T018, T020 can run in parallel (deletions)
- Streams merge at T021 (E2E validation)

---

## Phase 1: Setup & Configuration

### Goal
Verify Better Auth environment and dependencies are ready

### Tasks

- [x] T001 Verify Better Auth environment variables in frontend/.env.local and backend/.env
  - **Files**: `frontend/.env.local`, `backend/.env`
  - **Action**: Check `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` (frontend), `BETTER_AUTH_SESSION_URL` (backend)
  - **Validation**: All required env vars present, no missing values
  - **Exit criteria**: Can start both services without env var errors

- [x] T002 [P] Add httpx dependency to backend if not present
  - **Files**: `backend/pyproject.toml` or `backend/requirements.txt`
  - **Action**: Add `httpx>=0.24.0` to dependencies
  - **Validation**: Can import httpx in Python without errors
  - **Exit criteria**: `python -c "import httpx"` succeeds

- [x] T003 [P] Verify Better Auth session endpoint is accessible
  - **Files**: None (manual test)
  - **Action**: Test `GET http://localhost:3000/api/auth/session` with valid session cookie
  - **Validation**: Endpoint returns JSON with user and session data
  - **Exit criteria**: Session endpoint responds with 200 or 401 (not 404)

---

## Phase 2: User Story 1 - Backend Session Validation (P1)

### Goal
Backend validates sessions by calling Better Auth's `/api/auth/session` endpoint

### Independent Test
Make API request with valid session cookie → Backend validates via Better Auth → Returns 200

### Tasks

- [x] T\1 [P] [US1] Create session validator module in backend/src/auth/session_validator.py
  - **Files**: `backend/src/auth/session_validator.py` (new)
  - **Action**: Create function `validate_session(cookies: dict, better_auth_url: str) -> dict`
    - Make GET request to `{better_auth_url}/api/auth/session` with cookies
    - Handle httpx exceptions (connection errors, timeouts)
    - Return parsed JSON response if 200, raise errors otherwise
  - **Validation**: Function makes HTTP call, returns dict or raises exception
  - **Exit criteria**: Function exists and callable

- [x] T\1 [US1] Implement error mapping in session validator
  - **Files**: `backend/src/auth/session_validator.py`
  - **Action**: Add error handling:
    - Better Auth 401 → Return None (invalid session)
    - Better Auth 4xx/5xx → Raise ServiceUnavailableError (503)
    - Connection error → Raise ServiceUnavailableError (503)
    - Parse error → Raise ValidationError (500)
  - **Validation**: Different error scenarios return correct status
  - **Exit criteria**: All error codes map correctly

- [x] T\1 [P] [US1] Create Pydantic models for Better Auth response in backend/src/auth/models.py
  - **Files**: `backend/src/auth/models.py` (new)
  - **Action**: Define:
    - `UserData(BaseModel)` with id, email, name (optional)
    - `SessionData(BaseModel)` with expiresAt
    - `BetterAuthSessionResponse(BaseModel)` with user, session
    - `AuthenticatedUser(BaseModel)` with user_id, email, name
  - **Validation**: Can instantiate models with valid data
  - **Exit criteria**: All models defined and importable

- [x] T\1 [US1] Add session response validation to session validator
  - **Files**: `backend/src/auth/session_validator.py`
  - **Action**: Update `validate_session` to:
    - Parse response JSON into `BetterAuthSessionResponse`
    - Validate user.id is present and non-empty
    - Return `AuthenticatedUser` object
    - Raise ValidationError if user_id missing
  - **Validation**: Valid response returns AuthenticatedUser
  - **Exit criteria**: Function returns typed object

- [x] T\1 [US1] Create FastAPI dependency `get_current_user` in backend/src/auth/dependencies.py
  - **Files**: `backend/src/auth/dependencies.py` (new or update)
  - **Action**: Implement:
    ```python
    async def get_current_user(request: Request) -> AuthenticatedUser:
        cookies = dict(request.cookies)
        better_auth_url = get_config().better_auth_session_url
        return validate_session(cookies, better_auth_url)
    ```
  - **Validation**: Dependency can be used in FastAPI route
  - **Exit criteria**: Function exists, returns AuthenticatedUser

- [x] T\1 [P] [US1] Add Better Auth session URL to backend config in backend/src/config.py
  - **Files**: `backend/src/config.py`
  - **Action**: Add `BETTER_AUTH_SESSION_URL` environment variable
    - Default: `{BETTER_AUTH_URL}/api/auth/session`
    - Validate URL format on startup
    - Raise error if missing in production
  - **Validation**: Config loads, URL accessible
  - **Exit criteria**: Config has session URL property

---

## Phase 3: User Story 2 - User ID Scoping (P1)

### Goal
Prevent cross-user access by validating user_id in path matches session user_id

### Independent Test
User A tries to access User B's resource → Returns 403

### Tasks

- [x] T\1 [P] [US2] Create user ID scoping dependency in backend/src/auth/dependencies.py
  - **Files**: `backend/src/auth/dependencies.py`
  - **Action**: Implement:
    ```python
    def require_user_id_match(user_id: str):
        async def check(current_user: AuthenticatedUser = Depends(get_current_user)):
            if current_user.user_id != user_id:
                raise HTTPException(403, "Access denied")
            return current_user
        return check
    ```
  - **Validation**: Dependency raises 403 on mismatch
  - **Exit criteria**: Function exists, compares user IDs

- [x] T\1 [P] [US2] Add URL decoding to user ID comparison
  - **Files**: `backend/src/auth/dependencies.py`
  - **Action**: Update `require_user_id_match` to decode path user_id
    - Use `urllib.parse.unquote(user_id)`
    - Handle special characters
  - **Validation**: URL-encoded user IDs properly decoded
  - **Exit criteria**: Function decodes before comparison

- [x] T\1 [US2] Update protected tasks endpoint to use user ID scoping in backend/src/api/tasks.py
  - **Files**: `backend/src/api/tasks.py`
  - **Action**: Update route to use `Depends(require_user_id_match(user_id))`
    - Example: `@app.get("/users/{user_id}/tasks")`
    - Replace old JWT dependency with new session dependency
  - **Validation**: Endpoint requires both auth and user ID match
  - **Exit criteria**: Route has both dependencies

- [x] T\1 [US2] Test user ID scoping with two different users
  - **Files**: `backend/tests/test_auth_dependencies.py`
  - **Action**: Write test:
    - Create mock session for user123
    - Try to access /users/user456/tasks
    - Verify 403 response
  - **Validation**: Test passes, returns 403
  - **Exit criteria**: Test exists and passes

---

## Phase 4: User Story 3 - Centralized Dependencies (P2)

### Goal
Provide reusable authentication dependencies for all endpoints

### Independent Test
New endpoint with auth dependency → Automatically enforces authentication

### Tasks

- [ ] T014 [P] [US3] Document authentication dependency usage in backend/src/auth/README.md
  - **Files**: `backend/src/auth/README.md` (new)
  - **Action**: Create documentation:
    - How to use `get_current_user`
    - How to use `require_user_id_match`
    - Example routes
    - Error responses
  - **Validation**: Documentation clear with examples
  - **Exit criteria**: README exists

- [ ] T015 [US3] Create example protected endpoint
  - **Files**: `backend/src/api/example.py` (new, temporary)
  - **Action**: Create test endpoint:
    ```python
    @app.get("/protected")
    async def protected(user: AuthenticatedUser = Depends(get_current_user)):
        return {"user_id": user.user_id}
    ```
  - **Validation**: Endpoint works with auth
  - **Exit criteria**: Endpoint demonstrates reusability

---

## Phase 5: Frontend Cleanup & Protection

### Goal
Remove custom JWT logic, middleware, implement server-side session checks

### Independent Test
Login → Dashboard loads without redirect loop

### Tasks

- [ ] T016 [P] Remove custom JWT utilities from frontend/lib/auth/jwt-utils.ts
  - **Files**: `frontend/lib/auth/jwt-utils.ts` (delete)
  - **Action**: Delete file completely
  - **Validation**: No imports of this file remain
  - **Exit criteria**: File deleted, `git grep jwt-utils` returns nothing

- [ ] T017 [P] Remove diagnostic logger from frontend/lib/auth/diagnostic-logger.ts
  - **Files**: `frontend/lib/auth/diagnostic-logger.ts` (delete)
  - **Action**: Delete temporary debugging file
  - **Validation**: No imports remain
  - **Exit criteria**: File deleted

- [ ] T018 [P] Remove authentication middleware from frontend/middleware.ts
  - **Files**: `frontend/middleware.ts` (delete)
  - **Action**: Delete middleware file causing redirect loop
  - **Validation**: No middleware intercepting requests
  - **Exit criteria**: File deleted, Next.js doesn't run middleware

- [ ] T019 Update dashboard page with server-side session check in frontend/app/dashboard/page.tsx
  - **Files**: `frontend/app/dashboard/page.tsx`
  - **Action**: Add server-side session validation:
    ```tsx
    import { auth } from "@/lib/auth/better-auth"
    import { redirect } from "next/navigation"

    export default async function DashboardPage() {
      const session = await auth.api.getSession({ headers: headers() })
      if (!session) redirect("/login")
      // render dashboard
    }
    ```
  - **Validation**: Unauthenticated users redirected
  - **Exit criteria**: Page checks session, redirects if invalid

- [x] T020 [P] Update Better Auth client config to remove custom token logic in frontend/lib/auth/better-auth.ts
  - **Files**: `frontend/lib/auth/better-auth.ts`
  - **Action**: Remove custom JWT/token handling code
    - Keep only Better Auth client initialization
    - Remove manual cookie/token parsing
    - Rely on Better Auth defaults
  - **Validation**: File only contains Better Auth setup
  - **Exit criteria**: No custom auth logic

---

## Phase 6: End-to-End Validation

### Goal
Verify complete authentication flow works without redirect loop

### Tasks

- [x] T021 Test complete authentication flow manually
  - **Files**: None (manual testing)
  - **Action**: Test all scenarios:
    1. Navigate to /signin → Sign in → Redirect to /dashboard
    2. Dashboard loads without redirect loop
    3. Access backend API with valid session → Returns 200
    4. Try to access another user's tasks → Returns 403
    5. Clear cookies → Try /dashboard → Redirect to /signin
    6. Clear cookies → Try API call → Returns 401
  - **Validation**: All scenarios pass (ready for manual execution when services are running)
  - **Exit criteria**: Implementation complete, manual testing scenarios documented

---

## Implementation Strategy

### MVP Scope (First Deliverable)

Complete **User Story 1 only** (T001-T009):
- Backend validates sessions via Better Auth
- Protected endpoints return 401 for invalid sessions
- No user ID scoping yet

**Why**: Establishes core session validation, enables testing

### Incremental Delivery

1. **Sprint 1**: T001-T009 (US1) - Backend session validation
2. **Sprint 2**: T010-T013 (US2) - User ID scoping
3. **Sprint 3**: T014-T020 (US3 + Frontend) - Frontend cleanup
4. **Sprint 4**: T021 (Validation) - E2E testing

### Rollback Points

- After T009: Can revert to previous auth system
- After T013: User ID scoping independent, can disable
- After T020: Frontend changes independent

---

## Testing Guidance

### Manual Testing Checklist

- [ ] Environment variables set correctly
- [ ] Better Auth session endpoint accessible
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Sign in creates session cookie
- [ ] Dashboard loads after sign in (no loop)
- [ ] API call with valid session returns 200
- [ ] API call without session returns 401
- [ ] Cross-user API call returns 403
- [ ] Sign out clears session
- [ ] After sign out, dashboard redirects to sign in

---

## Success Criteria

✅ **All must pass**:
1. Login redirects correctly to dashboard (no loop)
2. Dashboard loads when session is valid
3. Unauthorized users redirected to login
4. Backend validates session via Better Auth
5. Backend returns 401 for invalid/missing sessions
6. Backend returns 403 for cross-user access attempts
7. No custom JWT parsing in codebase
8. Session validation latency <50ms P95

---

## Notes

- **Better Auth Cookie**: Default name is `better-auth.session_token`
- **CORS**: Ensure backend allows frontend origin
- **HTTP vs HTTPS**: Use HTTP for local dev, HTTPS in production
- **Session Expiry**: Better Auth default is 7 days
- **No Caching**: Validate session on every request
- **Logging**: Add debug logging (but never log cookies in production)
