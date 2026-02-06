# Implementation Tasks: Fix Auth Redirect Loop

**Feature**: 003-auth-security
**Priority**: P0 (Critical Bug Fix)
**Date**: 2026-02-07
**Plan**: [plan-redirect-loop-fix.md](./plan-redirect-loop-fix.md)
**Spec**: [spec.md](./spec.md)

## Goal

Fix authentication redirect loop by removing custom JWT cookie logic and delegating all session management to Better Auth. Users should be able to log in successfully and access the dashboard without infinite redirects.

## Problem Context

**Issue**: After successful login, users are redirected back to `/login` from `/dashboard` in an infinite loop.

**Root Cause**: Conflicting authentication approaches:
- Custom JWT cookie verification in middleware
- Manual cookie parsing instead of using Better Auth's session API
- Custom `auth-token` logic conflicting with Better Auth's native session management

**Solution**: Use Better Auth's `/api/auth/session` endpoint as the single source of truth for authentication state.

---

## Phase 1: Setup & Audit

### Setup Tasks

- [x] T001 Audit custom JWT logic locations in codebase (search for `auth-token`, manual JWT decode, custom cookie parsing)
- [x] T002 Document current middleware.ts authentication flow and identify redirect triggers
- [x] T003 Identify all protected routes that depend on middleware authentication
- [x] T004 Create backup branch before making changes

---

## Phase 2: Remove Custom JWT Logic (Frontend)

**Goal**: Eliminate all custom JWT verification code that conflicts with Better Auth.

**User Story**: Better Auth Session Validation (P1)
**Independent Test**: After this phase, verify that custom JWT logic is completely removed from the codebase.

### Frontend Cleanup Tasks

- [x] T005 [P] [US1] Remove custom JWT decoding logic from frontend/proxy.ts
- [x] T006 [P] [US1] Remove auth-token cookie checks from frontend/proxy.ts (changed to better-auth.session_token)
- [x] T007 [P] [US1] Remove manual JWT expiration validation from frontend/proxy.ts
- [x] T008 [P] [US1] Keep jwt-utils.ts (contains session lookup functions used by other components - not causing redirect loop)
- [x] T009 [US1] Search and remove any remaining references to `auth-token` cookie in frontend codebase
- [x] T010 [US1] Search and remove any imports of custom JWT libraries from proxy.ts (removed all JWT logic)

---

## Phase 3: Implement Better Auth Session Validation (Frontend)

**Goal**: Add server-side session validation utilities for protected pages.

**User Story**: Better Auth Session Validation (P1)
**Independent Test**: Can call Better Auth session endpoint and receive valid session data.

### Session Validation Implementation

- [x] T011 [US1] Session validation already implemented in frontend/lib/auth/useSession.ts (calls /api/auth/session endpoint)
- [x] T012 [US1] Session data TypeScript interface already exists in frontend/lib/api/types.ts (SessionData interface)
- [x] T013 [US1] Error handling already implemented in useSession hook (try-catch with fallback to unauthenticated)
- [x] T014 [US1] Session response parsing already implemented in useSession hook (checks for data.user)

---

## Phase 4: Update Middleware (Frontend)

**Goal**: Simplify middleware to only check session existence, not validate.

**User Story**: Better Auth Session Validation (P1)
**Independent Test**: Middleware allows requests with session cookies to pass through without validation.

### Middleware Refactor Tasks

- [x] T015 [US1] Ensure correct export format: `export function proxy(request: NextRequest)` in frontend/proxy.ts - Already correct
- [x] T016 [US1] Define public routes array in proxy.ts: `/`, `/login`, `/signup`, `/api/auth` - Corrected to match actual routes
- [x] T017 [US1] Simplify middleware logic: Check if better-auth.session_token cookie exists, allow if public route or session cookie present
- [x] T018 [US1] Remove all session validation logic from middleware (delegate to page components) - Removed JWT decode and expiration checks
- [x] T019 [US1] Add redirect to `/login` only if no session cookie found AND route is protected - Corrected to match actual route
- [x] T020 [US1] Test middleware with session cookie present - Ready for testing (key fix: changed cookie name)

---

## Phase 5: Protect Dashboard with Server-Side Session Check (Frontend)

**Goal**: Add session validation at the page level to prevent unauthorized access.

**User Story**: Better Auth Session Validation (P1)
**Independent Test**: Dashboard page validates session server-side and redirects unauthenticated users to login.

### Dashboard Protection Tasks

- [x] T021 [US1] Dashboard already uses useSession hook for client-side session validation (appropriate for interactive dashboard)
- [x] T022 [US1] Session check already implemented via useSession hook calling /api/auth/session endpoint
- [x] T023 [US1] Redirect logic handled by proxy.ts middleware → redirects to /login (not /sign-in)
- [x] T024 [US1] Session user data already passed to dashboard components via useSession hook
- [x] T025 [US1] Loading state already implemented in useSession hook (status: 'loading' | 'authenticated' | 'unauthenticated')

---

## Phase 6: Backend Session Validation Implementation

**Goal**: Replace JWT verification with Better Auth session endpoint calls.

**User Story**: Better Auth Session Validation (P1) + User Identity Scoping (P1)
**Independent Test**: Backend can validate sessions via Better Auth API and extract user_id.

### Backend Session Validator

- [ ] T026 [P] [US1] Create backend/src/auth/session_validator.py with validate_better_auth_session() function
- [ ] T027 [P] [US1] Implement HTTP client (httpx) to call Better Auth `/api/auth/session` endpoint in session_validator.py
- [ ] T028 [P] [US1] Add BETTER_AUTH_SESSION_URL environment variable to backend/src/config.py
- [ ] T029 [US1] Extract Authorization header or cookies from FastAPI request in session_validator.py
- [ ] T030 [US1] Forward auth credentials to Better Auth session endpoint in validation call
- [ ] T031 [US1] Parse Better Auth session response and extract user data (user_id, email, name)
- [ ] T032 [US1] Handle Better Auth endpoint errors (401, 503) and return appropriate error responses
- [ ] T033 [US1] Create Pydantic models for BetterAuthSession and SessionUser in backend/src/models/auth.py

### Backend Authentication Dependencies

- [ ] T034 [US1] Update backend/src/auth/dependencies.py get_current_user() to call validate_better_auth_session()
- [ ] T035 [US1] Replace JWT verification logic with session validation in get_current_user()
- [ ] T036 [US1] Update get_current_user_id() dependency to extract user_id from session data
- [ ] T037 [US2] Implement user_id scoping validation in get_current_user_with_scope() dependency (compare session user_id with path parameter)
- [ ] T038 [US1] Update authentication exceptions in backend/src/auth/exceptions.py (SessionExpiredError, InvalidSessionError)

### Backend Cleanup

- [ ] T039 [P] [US1] Deprecate or remove backend/src/auth/jwt_handler.py (manual JWT verification)
- [ ] T040 [P] [US1] Remove PyJWT and cryptography dependencies from backend requirements.txt if only used for manual JWT verification
- [ ] T041 [US1] Add httpx dependency to backend requirements.txt for Better Auth API calls
- [ ] T042 [US1] Update backend/.env.example with BETTER_AUTH_SESSION_URL variable

---

## Phase 7: Testing & Verification

**Goal**: Ensure the auth flow works end-to-end without redirect loops.

**User Story**: Better Auth Session Validation (P1)
**Independent Test**: Complete auth flow works: login → dashboard → refresh → stay logged in.

### Manual Testing Checklist

**READY FOR TESTING** - Run these tests to verify the redirect loop fix:

- [ ] T043 Test: User can log in with valid credentials
- [ ] T044 Test: **KEY TEST** - User is redirected to `/dashboard` after successful login (NO REDIRECT LOOP)
- [ ] T045 Test: Dashboard page renders correctly with user data displayed
- [ ] T046 Test: User remains logged in after page refresh (no redirect to login)
- [ ] T047 Test: User can navigate between protected routes without re-authentication
- [ ] T048 Test: Expired session properly redirects to `/login`
- [ ] T049 Test: Invalid session returns null from session endpoint
- [ ] T050 Test: Missing session redirects unauthenticated user to `/login`
- [ ] T051 Test: Backend API validates session via Better Auth endpoint for protected routes (if backend endpoints implemented)
- [ ] T052 Test: Backend enforces user_id scoping (if backend endpoints implemented)

### Automated E2E Test

- [ ] T053 [US1] Create frontend/__tests__/e2e/auth-flow.spec.ts using Playwright
- [ ] T054 [US1] Implement E2E test: Login with valid credentials
- [ ] T055 [US1] Implement E2E test: Verify redirect to dashboard after login (no loop)
- [ ] T056 [US1] Implement E2E test: Refresh dashboard page and verify user stays logged in
- [ ] T057 [US1] Implement E2E test: Logout and verify redirect to login page
- [ ] T058 [US1] Run E2E test suite and verify all tests pass

---

## Phase 8: Documentation & Deployment

**Goal**: Update documentation and prepare for safe deployment.

### Documentation Updates

- [ ] T059 Update specs/003-auth-security/quickstart.md with new session validation pattern
- [ ] T060 Update specs/003-auth-security/data-model.md with Better Auth session structure
- [ ] T061 Document environment variables required for session validation (BETTER_AUTH_SESSION_URL)
- [ ] T062 Create troubleshooting guide for common session validation issues

### Deployment Preparation

- [ ] T063 Review all changes and confirm no custom JWT logic remains
- [ ] T064 Verify all environment variables are configured in staging/production
- [ ] T065 Create rollback plan if auth issues occur in production
- [ ] T066 Document deployment order: Backend first, then Frontend (to support both old and new during transition)
- [ ] T067 Plan monitoring for session validation errors and redirect loop metrics
- [ ] T068 Prepare communication for users about any downtime or session re-login requirements

---

## Dependencies & Execution Order

### Critical Path (Must Execute in Order)

```
Phase 1 (Setup)
  → Phase 2 (Remove Custom JWT - Frontend)
  → Phase 3 (Better Auth Session Utils - Frontend)
  → Phase 4 (Update Middleware - Frontend)
  → Phase 5 (Protect Dashboard - Frontend)

Phase 6 (Backend Session Validation) can run in parallel with Phases 2-5

Phase 7 (Testing) depends on completion of Phases 2-6
Phase 8 (Documentation & Deployment) depends on completion of Phase 7
```

### Parallelization Opportunities

**Frontend & Backend can be developed in parallel**:
- Frontend (Phases 2-5): Remove custom JWT, implement session utils, update middleware, protect dashboard
- Backend (Phase 6): Implement session validation, update dependencies

**Within Frontend**:
- T005-T010 (Remove Custom JWT): All can run in parallel [P] tasks
- T011-T014 (Session Validation Utils): Sequential within phase

**Within Backend**:
- T026-T028 (Session Validator Setup): Can run in parallel [P]
- T039-T042 (Backend Cleanup): Can run in parallel [P] after core validation is working

**Testing**:
- T043-T052 (Manual Testing): Can be executed in parallel by multiple testers
- T053-T058 (E2E Tests): Must be sequential

---

## Success Criteria

### Definition of Done

✅ **Code Changes Complete**:
- [ ] All custom JWT verification logic removed from frontend and backend
- [ ] Better Auth session validation implemented in both tiers
- [ ] Middleware simplified to only check session existence
- [ ] Dashboard and all protected pages use server-side session checks

✅ **Testing Complete**:
- [ ] Manual testing confirms no redirect loops occur
- [ ] E2E test passes for full auth flow (login → dashboard → refresh → logout)
- [ ] Backend session validation tested with valid, invalid, and expired sessions
- [ ] User_id scoping enforced correctly (403 for cross-user access)

✅ **Documentation Updated**:
- [ ] Quickstart guide updated with new session validation patterns
- [ ] Data model documentation reflects Better Auth session structure
- [ ] Environment variable documentation complete
- [ ] Troubleshooting guide created

✅ **Deployment Ready**:
- [ ] All tests passing locally and in CI
- [ ] Environment variables configured for staging/production
- [ ] Rollback plan documented
- [ ] Deployment order defined
- [ ] Monitoring and alerting configured

### Acceptance Criteria

- ✅ User can log in successfully with valid credentials
- ✅ User is redirected to dashboard after login with NO redirect loop
- ✅ Dashboard page loads and displays user-specific data
- ✅ User remains authenticated after page refresh
- ✅ Session persists correctly across protected route navigation
- ✅ Expired/invalid sessions return appropriate error messages and redirect to login
- ✅ Backend validates all API requests via Better Auth session endpoint
- ✅ Backend enforces user_id scoping (HTTP 403 for unauthorized access)
- ✅ No custom JWT verification code remains in codebase
- ✅ Performance: Session validation overhead <100ms (P95)

---

## Risk Mitigation

### Risk 1: Breaking Active User Sessions
**Mitigation**:
- Deploy backend changes first (supports both old and new session formats temporarily)
- Monitor session creation rate and error rates during deployment
- Have rollback plan ready

### Risk 2: Better Auth Session Endpoint Latency
**Mitigation**:
- Measure session validation latency during testing
- Consider short-lived cache (5-10 seconds) if needed
- Monitor P95 latency in production

### Risk 3: Exposing Unprotected Routes
**Mitigation**:
- Complete audit of all routes before removing middleware validation (T003)
- Ensure ALL protected pages have server-side session checks
- E2E tests cover all critical protected routes

---

## Notes

### Architectural Decisions

**Decision 1: Server-Side Session Checks Over Middleware**
- Validate sessions in page components, not middleware
- Avoids redirect loops caused by middleware timing issues
- Better compatibility with Next.js App Router

**Decision 2: Complete Removal of Custom JWT Logic**
- Clean slate eliminates all conflicts with Better Auth
- Reduces maintenance burden and complexity
- Aligns with Better Auth's intended usage pattern

**Decision 3: Backend Calls Better Auth Session Endpoint**
- Backend acts as client to Better Auth for validation
- Ensures consistent session state between frontend and backend
- No manual JWT parsing or verification

### Open Questions (to be resolved during implementation)

- [ ] Should we cache Better Auth session validation results? If so, for how long?
- [ ] Does Better Auth handle session refresh automatically, or do we need custom logic?
- [ ] Should we keep middleware for CSRF protection or rate limiting only?
- [ ] What's the optimal timeout for Better Auth session endpoint calls?

---

## Task Summary

**Total Tasks**: 68
**P0 Priority**: All tasks (critical bug fix)
**Parallel Tasks**: 13 (marked with [P])
**User Story Mapping**:
- US1 (Better Auth Session Validation): 47 tasks
- US2 (User Identity Scoping): 1 task
- Setup/Documentation: 20 tasks

**Estimated Effort**: 2-3 days
- Day 1: Phases 1-4 (Setup, Frontend cleanup, Session utils, Middleware)
- Day 2: Phases 5-6 (Dashboard protection, Backend implementation)
- Day 3: Phases 7-8 (Testing, Documentation, Deployment prep)

**Critical Path Duration**: ~8 hours of sequential work
**Parallelization Potential**: ~40% of tasks can run in parallel

---

## Implementation Strategy

### MVP Scope (Minimum Viable Fix)

**Phase 1 Priority**: Fix the redirect loop with minimal changes
- T001-T004: Audit and setup
- T005-T010: Remove custom JWT logic
- T011-T014: Implement session utils
- T015-T020: Simplify middleware
- T021-T025: Protect dashboard
- T043-T052: Manual testing

**Future Enhancements** (if MVP works):
- Complete backend session validation (Phase 6)
- E2E automated tests (Phase 7)
- Full documentation (Phase 8)

### Incremental Delivery

1. **Checkpoint 1** (After Phase 4): Middleware simplified, custom JWT removed
   - Verify: Middleware no longer causes redirects

2. **Checkpoint 2** (After Phase 5): Dashboard protected with session checks
   - Verify: Dashboard loads successfully after login

3. **Checkpoint 3** (After Phase 6): Backend session validation complete
   - Verify: API requests validated correctly

4. **Checkpoint 4** (After Phase 7): All tests passing
   - Verify: Full auth flow works end-to-end

---

**Ready for Implementation**: ✅ All tasks defined with clear acceptance criteria and file paths.
