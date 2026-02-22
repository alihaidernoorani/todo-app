---
id: 0020
title: Auth redirect loop fix tasks
stage: tasks
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: backup-before-auth-fix-20260207-033626
user: user
command: /sp.tasks
labels: ["authentication", "better-auth", "session-validation", "redirect-loop", "tasks", "implementation"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/tasks.md
tests:
---

## Prompt

```text
"Authentication redirect loop fix"

Create focused implementation tasks that:

1. Verify Better Auth environment variables
2. Remove custom auth-token logic from:

   * Middleware
   * API routes
   * Frontend session handling
3. Ensure Better Auth default session endpoint is active:

   * `/api/auth/session`
4. Replace middleware-based auth with server-side session checks
5. Update dashboard protection to use Better Auth session
6. Ensure login flow:

   * Login → session created
   * Redirect to dashboard
7. Test flows:

   * Valid session → dashboard loads
   * No session → redirect to login
   * Expired session → redirect to login

Rules:

* No new authentication system
* No custom JWT parsing
* Only use Better Auth sessions
* Each task must be small and independently testable
* Use subagents and skills where necessary or in doubt
```

## Response snapshot

Generated comprehensive implementation tasks (`specs/003-auth-security/tasks.md`) with 21 focused, independently testable tasks organized by user story.

**Task organization**:
- **Phase 1**: Setup & Configuration (T001-T003) - Environment verification
- **Phase 2**: User Story 1 - Backend Session Validation (T004-T009) - Core session validation
- **Phase 3**: User Story 2 - User ID Scoping (T010-T013) - Cross-user access prevention
- **Phase 4**: User Story 3 - Centralized Dependencies (T014-T015) - Reusable auth patterns
- **Phase 5**: Frontend Cleanup & Protection (T016-T020) - Remove custom JWT logic, middleware
- **Phase 6**: End-to-End Validation (T021) - Complete flow testing

**Key architectural decisions reflected in tasks**:
1. Backend session validation via Better Auth `/api/auth/session` endpoint (no custom JWT)
2. Frontend removes middleware (causing redirect loop), uses server-side session checks
3. Session cookies only (no Bearer tokens)
4. Delegated validation (no local crypto operations)
5. Error mapping to standardized backend format

**Task characteristics**:
- All tasks follow strict checklist format: `- [ ] T### [P] [US#] Description with file path`
- [P] marker for parallelizable tasks (T002, T003, T004, T006, T009, T010, T011, T014, T016, T017, T018, T020)
- [US#] labels for user story mapping (US1, US2, US3)
- Clear file paths for each task
- Exit criteria and validation methods
- Independent test criteria per user story

**Implementation strategy**:
- MVP: User Story 1 only (T001-T009) - Establishes core session validation
- Incremental delivery: 4 sprints, each deliverable independently testable
- Rollback points after each major phase
- Parallel execution opportunities identified (max parallelism: 8 tasks simultaneously)

**Success criteria embedded**:
- Login → Dashboard redirect (no loop)
- Dashboard loads when session valid
- Unauthorized users redirected to login
- Backend validates via Better Auth
- 401/403 error handling correct
- No custom JWT parsing remains
- <50ms P95 session validation latency

## Outcome

- ✅ Impact: 21 focused, actionable tasks for fixing redirect loop; clear execution order with parallel opportunities; each task independently testable
- 🧪 Tests: Test tasks included (T013, T021) for validation
- 📁 Files: specs/003-auth-security/tasks.md (complete task list)
- 🔁 Next prompts: /sp.implement or manually execute tasks starting with Phase 1 (T001-T003)
- 🧠 Reflection: Tasks successfully aligned with session-based architecture from spec and plan; removed all JWT/RS256/JWKS references; provided clear MVP scope and incremental delivery strategy

## Evaluation notes (flywheel)

- Failure modes observed: None - tasks generated successfully with proper format and dependencies
- Graders run and results (PASS/FAIL): N/A (task generation phase)
- Prompt variant (if applicable): Standard /sp.tasks workflow with focused user requirements
- Next experiment (smallest change to try): Execute Phase 1 tasks (T001-T003) to validate environment setup, then proceed with backend session validation (Phase 2)
