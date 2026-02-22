---
id: 0011
title: Frontend Backend Alignment Tasks
stage: tasks
date: 2026-02-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-database
branch: 005-backend-frontend-alignment
user: alihaidernoorani
command: /sp.tasks
labels: ["tasks", "frontend-alignment", "server-actions", "error-handling", "integration"]
links:
  spec: specs/002-backend-database/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-database/frontend-backend-alignment-tasks.md
tests:
  - T045-T058 (14 integration and manual tests)
---

## Prompt

fix-frontend-backend-task-integration

Feature: 002-backend-database
Priority: P0

Problem:
Frontend features are not correctly hitting backend endpoints.
Add Task fails with 500 error.
CRUD operations are not fully verified end-to-end.

Backend uses path-based user context:
`/api/{user_id}/tasks`

Goal:
Ensure all frontend task features correctly call backend endpoints
and complete CRUD operations successfully.

[Full task descriptions provided by user for 8 main areas: API Base URL Configuration, User ID Injection, Task Fetch, Add Task, Update Task, Delete Task, Error Handling, End-to-End Verification]

Acceptance Criteria:
- All task endpoints work from the frontend.
- No 500 errors during CRUD operations.
- Correct user_id is used in all API paths.
- Tasks update in UI after each action.
- End-to-end flow works in production.

## Response snapshot

Generated comprehensive 63-task implementation plan addressing frontend-backend alignment issues based on plan addendum and clarifications.

**Task Organization**:

**Phase 1: Setup & Environment Configuration** (T001-T005, 15 min)
- Add BACKEND_URL to all environment files (.env.local, .env.production, .env.example)
- Verify cookie-based JWT authentication already working
- Verify backend endpoints accessible

**Phase 2: Type Definitions & Error Handling Infrastructure** (T006-T011, 25 min)
- Create ApiError, ApiSuccess, ApiResponse types
- Implement error code mapping functions
- Add user-friendly message helpers
- Per FR-026 and FR-027 from clarifications

**Phase 3: Server Action Core Fix - Critical Path** (T012-T017, 45 min)
- Replace NEXT_PUBLIC_API_URL with BACKEND_URL (line 47 fix)
- Add explicit BACKEND_URL validation
- Update makeAuthenticatedRequest to return ApiResponse<T>
- Wrap responses in success/error structures
- Handle network failures gracefully

**Phase 4: Update Server Action Exports** (T018-T024, 20 min)
- Update all 7 server action return types to ApiResponse wrappers
- Ensure TypeScript compilation succeeds

**Phase 5: Verify Other API Files** (T025-T027, 15 min)
- Check lib/api/client.ts for similar issues
- Grep for remaining NEXT_PUBLIC_API_URL usage
- Verify client components unaffected

**Phase 6: Component Error Handling - US1 Create Task** (T028-T032, 30 min)
- Fix "Add Task" 500 error
- Add error state and display
- Implement retry logic for transient errors
- Clear errors on success

**Phase 7: Component Error Handling - US2 List Tasks** (T033-T036, 25 min)
- Update list fetch to handle ApiResponse
- Display loading/error/empty states
- Add retry mechanism

**Phase 8: Component Error Handling - US4 Update/Toggle** (T037-T040, 35 min)
- Implement optimistic UI updates with rollback
- Handle toggle and edit errors inline
- Show user-friendly error messages

**Phase 9: Component Error Handling - US5 Delete** (T041-T044, 25 min)
- Add confirmation dialog
- Show error toasts on failure
- Remove from UI only after success

**Phase 10: Integration Testing** (T045-T058, 90 min)
- 14 manual testing tasks covering all scenarios
- 3 automated integration tests
- Verify all 5 clarifications from spec
- Comprehensive manual testing checklist

**Phase 11: Documentation & Cleanup** (T059-T063, 20 min)
- Update README files
- Document error codes
- Remove deprecated code
- Ensure TypeScript strict mode compliance

**Key Decisions**:
1. MVP scope defined: Phases 1-4 + US1 (T001-T032, ~2 hours) fixes critical create task error
2. Full scope: All phases (~5 hours) provides complete error handling
3. Parallel opportunities identified: Component updates can run in parallel after core fix
4. Sequential critical path maintained for core infrastructure changes

**Dependencies**:
- Setup → Types → Core Fix → Exports (sequential, critical path)
- Component phases can run in parallel after exports complete
- Testing and documentation can run in parallel after components done

**Success Metrics**:
1. Zero 500 errors during task operations
2. All requests use BACKEND_URL (not NEXT_PUBLIC_API_URL)
3. All responses follow ApiResponse<T> structure
4. User-friendly error messages in UI
5. End-to-end CRUD works in dev and production

## Outcome

- ✅ Impact: Clear, actionable 63-task plan addressing all root causes; MVP scope defined for rapid critical fix; full scope provides complete solution
- 🧪 Tests: 14 integration/manual tests (T045-T058) covering all scenarios; comprehensive checklist for manual validation
- 📁 Files: Created specs/002-backend-database/frontend-backend-alignment-tasks.md with detailed tasks including before/after code examples
- 🔁 Next prompts: Start with MVP scope (T001-T032) to fix critical "Add Task" 500 error, then validate before proceeding
- 🧠 Reflection: Task list successfully bridges plan addendum with executable implementation; clear dependencies and parallel opportunities; MVP-first approach enables rapid critical fix validation before full scope

## Evaluation notes (flywheel)

- Failure modes observed: Server action environment variable misuse causes runtime failures; lack of structured errors makes debugging difficult; missing validation creates cascading failures
- Graders run and results (PASS/FAIL): PASS - All tasks follow required checkbox format; clear dependencies; MVP scope well-defined; parallel opportunities identified
- Prompt variant (if applicable): Standard task generation workflow enhanced with MVP scope definition and parallel execution guidance
- Next experiment (smallest change to try): Execute MVP scope (T001-T032) first to validate critical fix works before investing in full error handling infrastructure
