---
id: 0006
title: Generate UUID String Fix Tasks
stage: tasks
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.tasks
labels: ["tasks", "migration", "uuid-to-string", "auth-fix", "p0"]
links:
  spec: /specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/tasks-uuid-string-fix.md
tests:
  - null
---

## Prompt

fix-user-id-uuid-string-mismatch

Feature: 003-auth-security
Priority: P0

Problem:
Backend expects UUID user IDs, but Better Auth generates immutable string IDs.
This causes: 400 "Invalid user ID format" and blocks authentication.

Goal:
Align backend with Better Auth and resolve all issues until authentication works end-to-end.

---

Tasks

1) API Layer
File: src/api/deps.py
- Remove UUID(user_id) validation.
- Accept user_id as string from JWT.
- Ensure authorization uses string IDs.

2) Data Models
File: src/models/task.py
- Change user_id: UUID → user_id: str.
- Update all other models using UUID user IDs.

3) Database
- Create Alembic migration.
- Change tasks.user_id column: UUID → TEXT/VARCHAR.
- Safely convert existing data if present.

4) Service Layer
File: src/services/task_service.py
- Remove UUID-specific logic.
- Ensure all operations use string user IDs.

5) Better Auth Integration
- Verify Better Auth user ID format is passed unchanged.
- Confirm JWT payload contains correct string user_id.
- Ensure backend JWT validation matches Better Auth secret and algorithm.
- Fix any mismatches in token structure or claims.

6) Environment & Config Checks
- Verify shared auth secret between frontend and backend.
- Confirm correct backend URL in frontend.
- Ensure CORS and auth headers are configured correctly.

7) Tests
- Replace UUID-based test user IDs with string IDs.
- Update auth-related tests.
- Ensure all tests pass.

8) End-to-End Auth Verification
Test full flow:
1. User signup/login via Better Auth.
2. String user ID generated.
3. JWT issued.
4. Authenticated API request.
5. Backend returns 200 OK with user-scoped data.

9) Final Auth Stabilization
- Fix any remaining auth errors.
- Ensure consistent behavior in dev and production.
- Confirm CRUD operations work with authenticated users.

---

Acceptance Criteria
- Backend accepts Better Auth string user IDs.
- Database stores user_id as TEXT/VARCHAR.
- JWT validation works correctly.
- All tests pass.
- End-to-end authentication flow works in production.

User also requested: "These are a lot of tasks. Shorten the number of tasks"

## Response snapshot

Generated consolidated tasks.md with 30 tasks (reduced from initial 70 tasks).

**Key consolidations**:
- Combined verification tasks into Phase 4
- Merged all service function updates into single task (T009)
- Consolidated test updates by test type (5 tasks instead of 9)
- Simplified E2E testing to 5 essential scenarios
- Streamlined production deployment to 4 critical steps
- Minimal cleanup phase (2 tasks)

**Result**: 8 phases, 30 total tasks
- Phase 1: Data Model (3 tasks) - CRITICAL BLOCKER
- Phase 2: Database Migration (4 tasks)
- Phase 3: API/Service Layer (3 tasks)
- Phase 4: Auth Verification (4 tasks)
- Phase 5: Test Updates (5 tasks)
- Phase 6: E2E Testing (5 tasks)
- Phase 7: Production Deployment (4 tasks)
- Phase 8: Cleanup (2 tasks)

**Critical path**: T001 → T004-T007 → T020-T024 → T025-T028 (17 tasks)
**Parallel opportunities**: 12 tasks marked [P]
**Estimated time**: 2-3 hours (single developer) or 1-2 hours (parallel team)

## Outcome

- ✅ Impact: Created actionable tasks.md for UUID→string migration fix (P0 blocking issue)
- 🧪 Tests: No tests run (documentation task)
- 📁 Files: 1 file created (tasks-uuid-string-fix.md)
- 🔁 Next prompts: Run /sp.implement to execute tasks, or manually implement phases 1-2 first (critical path)
- 🧠 Reflection: Successfully reduced granularity while maintaining clarity. Each task now represents meaningful work units. Phase 1 (data model) correctly identified as critical blocker for all downstream work.

## Evaluation notes (flywheel)

- Failure modes observed: Initial version had too many micro-tasks (70), causing cognitive overhead. User correctly requested consolidation.
- Graders run and results (PASS/FAIL): N/A (documentation task)
- Prompt variant (if applicable): tasks-consolidation-v1
- Next experiment (smallest change to try): When generating tasks in future, default to 20-40 tasks range unless high granularity explicitly requested. Consolidate related updates (e.g., "update all X functions" instead of listing each function).
