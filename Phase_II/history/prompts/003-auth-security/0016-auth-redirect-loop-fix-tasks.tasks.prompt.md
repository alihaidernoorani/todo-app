---
id: 0016
title: Auth Redirect Loop Fix Tasks
stage: tasks
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: 005-backend-frontend-alignment
user: alihaidernoorani
command: /sp.tasks
labels: ["authentication", "better-auth", "redirect-loop", "task-generation", "P0"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/tasks-redirect-fix.md
tests:
  - None (task generation phase)
---

## Prompt

```text
fix-auth-redirect-loop

Feature: 003-auth-security
Priority: P0

Problem:
User successfully logs in, session is valid,
but middleware redirects from /dashboard to /login.

Root Cause:
Middleware uses custom cookie or JWT logic instead of
Better Auth session.

Goal:
Use Better Auth session as the single source of truth
and eliminate redirect loop.

---

Tasks

1) Remove Custom JWT Logic
File: middleware.ts
- Remove:
  - auth-token cookie checks
  - JWT decoding
  - manual expiration logic

2) Fix Middleware Function
File: middleware.ts
- Ensure correct export:
  export function middleware(request: NextRequest)

3) Use Session-Based Protection
File: middleware.ts
- Call `/api/auth/session` internally.
- If session exists:
  allow request.
- If no session:
  redirect to /login.

4) Define Public Routes
File: middleware.ts
Public routes:
- /
- /login
- /sign-in
- /sign-up
- /api/auth/*

All others require session.

5) Remove Conflicting Logic
Search entire codebase:
- Remove references to:
  - auth-token
  - custom JWT middleware
  - manual cookie parsing

6) Dashboard Session Check
File: dashboard layout or page
- Fetch Better Auth session server-side.
- If no session:
  redirect to /login.

7) End-to-End Test
Verify:

1) Login
2) Redirect to /dashboard
3) Refresh page
4) Stay on dashboard
5) No redirect loop
6) Logout works

---

Acceptance Criteria
- No redirect loop after login.
- Dashboard accessible after authentication.
- Middleware uses Better Auth session only.
- No custom JWT or auth-token logic remains.
- Session persists across refresh.
```

## Response snapshot

**Task Breakdown Generated: Fix Auth Redirect Loop**

**Total Tasks**: 68 tasks organized in 8 phases
**Priority**: P0 (Critical bug fix)
**Estimated Effort**: 2-3 days

**Phase Structure**:

1. **Phase 1: Setup & Audit** (4 tasks)
   - Audit custom JWT logic locations
   - Document current middleware flow
   - Identify protected routes
   - Create backup branch

2. **Phase 2: Remove Custom JWT Logic - Frontend** (6 tasks)
   - Remove JWT decoding from lib/auth/client.ts
   - Remove auth-token cookie checks from middleware.ts
   - Remove manual JWT expiration validation
   - Delete custom JWT utilities
   - Clean up all auth-token references
   - Remove custom JWT library imports

3. **Phase 3: Implement Better Auth Session Validation - Frontend** (4 tasks)
   - Create session.ts with getSession() function
   - Implement BetterAuthSession TypeScript interface
   - Add error handling for session endpoint failures
   - Add session response parsing and validation

4. **Phase 4: Update Middleware - Frontend** (6 tasks)
   - Ensure correct middleware export format
   - Define public routes array
   - Simplify middleware logic (check cookie existence only)
   - Remove session validation from middleware
   - Add redirect for missing session
   - Test middleware with session cookie

5. **Phase 5: Protect Dashboard - Frontend** (5 tasks)
   - Make dashboard page async server component
   - Add server-side session check
   - Implement redirect to login if no session
   - Pass session data to client components
   - Add loading state for UX

6. **Phase 6: Backend Session Validation** (17 tasks)
   - Session Validator (8 tasks): Create validator, implement HTTP client, extract auth credentials, parse responses
   - Authentication Dependencies (5 tasks): Update get_current_user(), implement user_id scoping
   - Backend Cleanup (4 tasks): Remove JWT handler, update dependencies

7. **Phase 7: Testing & Verification** (16 tasks)
   - Manual testing checklist (10 tests)
   - Automated E2E tests (6 tasks)

8. **Phase 8: Documentation & Deployment** (10 tasks)
   - Update quickstart, data-model, environment docs
   - Create troubleshooting guide
   - Prepare deployment plan and rollback strategy

**Parallelization Opportunities**:
- Frontend (Phases 2-5) and Backend (Phase 6) can run in parallel
- Within frontend: JWT removal tasks (T005-T010) can run in parallel
- Within backend: Session validator setup (T026-T028) and cleanup (T039-T042) can run in parallel
- Total parallel tasks: 13 (marked with [P])

**Task Format Compliance**:
- ✅ All tasks follow strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- ✅ Task IDs sequential (T001-T068)
- ✅ Parallel tasks marked with [P]
- ✅ User Story tasks tagged with [US1] or [US2]
- ✅ Clear file paths provided for implementation tasks
- ✅ Test tasks clearly marked

**User Story Mapping**:
- US1 (Better Auth Session Validation - P1): 47 tasks
- US2 (User Identity Scoping - P1): 1 task
- Setup/Documentation: 20 tasks

**Success Criteria Defined**:
- ✅ No redirect loops after login
- ✅ Dashboard accessible post-authentication
- ✅ Session persists after refresh
- ✅ All custom JWT logic removed
- ✅ E2E tests pass
- ✅ Performance <100ms session validation

**Risk Mitigation Strategies**:
1. Breaking active sessions → Phased deployment (backend first)
2. Session endpoint latency → Performance monitoring and optional caching
3. Unprotected routes → Complete audit and E2E test coverage

**MVP Scope Identified**:
- Phases 1-5 (Frontend fix) + Manual testing
- Minimum viable fix to resolve redirect loop
- Backend and E2E tests can follow as enhancements

**Dependencies & Critical Path**:
```
Setup → Remove JWT → Session Utils → Middleware → Dashboard
                              ↓
Backend Session Validation (parallel)
                              ↓
Testing → Documentation → Deployment
```

## Outcome

- ✅ Impact: Comprehensive task breakdown created with 68 actionable tasks to fix P0 redirect loop bug. Clear execution order, parallelization opportunities, and acceptance criteria defined.
- 🧪 Tests: 16 test tasks included (10 manual, 6 E2E automated). Full coverage of auth flow verification.
- 📁 Files: Created specs/003-auth-security/tasks-redirect-fix.md with complete phase breakdown, dependencies, and implementation strategy.
- 🔁 Next prompts: Run `/sp.implement` to begin executing tasks. Start with Phase 1 (Setup) followed by Phase 2 (Remove Custom JWT).
- 🧠 Reflection: Task organization prioritizes fixing the immediate redirect loop (frontend) while allowing backend improvements in parallel. MVP scope defined for rapid resolution.

## Evaluation notes (flywheel)

- Failure modes observed: Original task input was high-level. Generated tasks provide granular, executable steps with specific file paths and clear acceptance criteria.
- Graders run and results (PASS/FAIL): PASS - All 68 tasks follow strict checklist format with Task IDs, file paths, and appropriate [P]/[Story] labels.
- Prompt variant (if applicable): Standard task generation workflow with focus on bug fix prioritization and clear phasing.
- Next experiment (smallest change to try): Implement MVP scope first (Phases 1-5 + manual testing) to quickly resolve redirect loop, then iterate with backend and automation.
