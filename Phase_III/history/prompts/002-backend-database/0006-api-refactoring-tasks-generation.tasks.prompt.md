---
id: 0006
title: API Refactoring Tasks Generation
stage: tasks
date: 2026-01-24
surface: agent
model: claude-opus-4-5-20251101
feature: 002-backend-database
branch: 002-backend-database
user: alihaidernoorani
command: /sp.tasks
labels: ["tasks", "api-refactoring", "path-based-routing", "task-generation"]
links:
  spec: specs/002-backend-database/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-database/tasks.md
tests:
  - null
---

## Prompt

Based on the updated API design plan, generate a granular task list to transition the backend to a path-based user context.

Required Checklist items:
- [ ] Refactor FastAPI router prefix to include the path parameter: `/api/{user_id}/tasks`.
- [ ] Rename all "todo" references to "tasks" across models, schemas, and endpoint functions.
- [ ] Update the **POST** endpoint to extract `user_id` from the URL path instead of the request body or headers.
- [ ] Update the **GET** (List) endpoint to fetch tasks specifically filtered by the `{user_id}` provided in the path.
- [ ] Implement the **PUT** method at `/api/{user_id}/tasks/{id}` for full resource updates, ensuring the `user_id` in the path matches the task's owner.
- [ ] Create a dedicated **PATCH** endpoint at `/api/{user_id}/tasks/{id}/complete` specifically for toggling the `is_completed` status.
- [ ] Implement the **DELETE** endpoint at `/api/{user_id}/tasks/{id}` with ownership verification.
- [ ] Update Pydantic request/response schemas to align with the "tasks" resource naming convention.
- [ ] Verify that all changes are reflected in the automatically generated Swagger UI documentation.

Constraints:
- All task implementations must occur within `/backend/`.
- Every database query must strictly use the `{user_id}` from the path to maintain data isolation.

## Response snapshot

Generated comprehensive tasks.md (v2.0) with 56 tasks across 8 phases:

**Phase 1: Setup** (T001-T007) - File renames from todo to task naming
- Rename model, schema, service, and API files
- Update __init__.py exports

**Phase 2: Foundational** (T008-T016) - Core refactoring
- Refactor models, schemas, services
- Remove header-based user extraction, add path parameter support
- Update router prefix from `/api/v1` to `/api`
- Update Alembic migrations

**Phase 3-7: User Stories** (T017-T046)
- US1 (P1): POST endpoint with path-based user_id
- US2 (P1): GET (list) endpoint with user isolation
- US3 (P2): GET (single) endpoint with ownership verification
- US4 (P2): PUT for full updates + PATCH /complete for toggle
- US5 (P3): DELETE with ownership verification

**Phase 8: Polish** (T047-T056) - Tests and validation
- Update contract, unit, integration tests
- Run linters and type checkers
- Verify Swagger UI documentation

## Outcome

- ✅ Impact: Complete task list for transitioning from header-based to path-based API design
- 🧪 Tests: 30 integration test tasks included for all endpoints
- 📁 Files: 1 file updated (specs/002-backend-database/tasks.md)
- 🔁 Next prompts: /sp.implement to execute the refactoring tasks
- 🧠 Reflection: Tasks organized by user story enable incremental delivery; MVP achievable with Phase 1-4 (Setup + Foundational + US1 + US2)

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (task generation phase)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Consider adding task estimation complexity indicators
