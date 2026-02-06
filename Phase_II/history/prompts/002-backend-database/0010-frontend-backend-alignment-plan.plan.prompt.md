---
id: 0010
title: Frontend Backend Alignment Plan
stage: plan
date: 2026-02-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-database
branch: 005-backend-frontend-alignment
user: alihaidernoorani
command: /sp.plan
labels: ["planning", "frontend-alignment", "server-actions", "environment-variables"]
links:
  spec: /mnt/c/Users/DELL/Desktop/The_Evolution_of_todo/Phase_II/specs/002-backend-database/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-database/plan.md (addendum added)
tests:
  - Integration tests planned for frontend-backend alignment
---

## Prompt

Goal:
Ensure all frontend task features successfully hit the backend endpoints and perform the correct operations.

Backend Contract:
All task endpoints use path-based user context:

GET     /health
GET     /api/{user_id}/tasks
POST    /api/{user_id}/tasks
GET     /api/{user_id}/tasks/{id}
PUT     /api/{user_id}/tasks/{id}
DELETE  /api/{user_id}/tasks/{id}
PATCH   /api/{user_id}/tasks/{id}/complete

Success Criteria:
1. Frontend correctly constructs URLs using the authenticated user_id.
2. All task actions map to the correct endpoint:
   - Load tasks → GET /api/{user_id}/tasks
   - Create task → POST /api/{user_id}/tasks
   - Update task → PUT /api/{user_id}/tasks/{id}
   - Delete task → DELETE /api/{user_id}/tasks/{id}
   - Toggle complete → PATCH /api/{user_id}/tasks/{id}/complete
3. No hardcoded user IDs.
4. Proper error handling for non-200 responses.
5. No 500 errors during task creation or fetching.
6. Environment variables correctly provide the backend base URL.
7. All frontend features work end-to-end with the backend API.

Deliverables:
- Step-by-step integration plan
- List of required frontend and backend changes
- Validation steps to confirm endpoints work correctly

## Response snapshot

Created comprehensive plan addendum for frontend-backend alignment addressing server action failures discovered during testing.

**Analysis**:
- Backend implementation is correct and fully functional
- Issue isolated to frontend server actions using incorrect environment variables
- Root cause: `NEXT_PUBLIC_API_URL` used in server context (not accessible)
- Solution aligns with clarifications added to spec.md (Session 2026-02-06)

**Plan Structure**:

**Phase 0: Current State Analysis**
- Identified specific files requiring changes (`tasks.ts`, `client.ts`, `.env*`)
- Confirmed auth utilities already correct (cookie-based via `next/headers`)
- Verified backend endpoints working correctly

**Phase 1: Environment Variable Fix**
- Add `BACKEND_URL` to `.env.local` and `.env.production`
- Replace `process.env.NEXT_PUBLIC_API_URL` with `process.env.BACKEND_URL` in server actions
- Add explicit checks for missing environment variables

**Phase 2: Structured Error Responses**
- Implement `ApiResponse<T>` type (success/error wrapper)
- Add error code mapping (401 → AUTH_FAILED, 503 → BACKEND_UNAVAILABLE, etc.)
- Transform HTTP errors to user-friendly messages
- Update all server action signatures to return `ApiResponse<T>`

**Phase 3: Frontend Component Updates**
- Update task components to handle `ApiResponse` types
- Add error display UI with retry logic
- Implement loading states during operations

**Testing & Validation**:
- Integration tests for all CRUD operations
- Manual testing checklist (10 validation points)
- Verification of all 5 clarifications from spec

**Timeline**: ~4 hours total implementation time

**Key Decisions**:
1. Server-only `BACKEND_URL` variable (not `NEXT_PUBLIC_*`)
2. Structured error responses for type-safe error handling
3. No backend changes required (already correctly implemented)
4. Cookie-based JWT token retrieval (already implemented)

## Outcome

- ✅ Impact: Clear implementation path to resolve server action failures; addresses all 5 clarifications from spec
- 🧪 Tests: Integration test strategy defined; manual validation checklist with 10 checkpoints
- 📁 Files: Modified specs/002-backend-database/plan.md (added comprehensive addendum); frontend changes scoped to 3 files
- 🔁 Next prompts: Run /sp.tasks to generate detailed task list incorporating addendum changes
- 🧠 Reflection: Plan successfully bridges gap between correct backend implementation and frontend integration issues; structured approach ensures systematic resolution of environment variable and error handling problems

## Evaluation notes (flywheel)

- Failure modes observed: Server actions using client-side environment variables leads to runtime errors; lack of structured error responses makes debugging difficult
- Graders run and results (PASS/FAIL): PASS - Plan addresses all root causes identified in clarification session; backend requires no changes (validation passed)
- Prompt variant (if applicable): Standard planning workflow with addendum approach (preserving existing plan while adding frontend alignment fixes)
- Next experiment (smallest change to try): Implement Phase 1 first (environment variable fix) and validate that server actions can reach backend before proceeding to error handling refactor
