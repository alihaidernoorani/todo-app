---
id: 0005
title: API Design Revision Plan
stage: plan
date: 2026-01-24
surface: agent
model: claude-opus-4-5-20251101
feature: 002-backend-database
branch: 002-backend-database
user: alihaidernoorani
command: /sp.plan
labels: ["api-design", "rest", "path-based-routing", "revision"]
links:
  spec: specs/002-backend-database/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-backend-database/plan.md
  - specs/002-backend-database/research.md
  - specs/002-backend-database/data-model.md
  - specs/002-backend-database/contracts/task_api_contract.md
tests:
  - null
---

## Prompt

Update the API design to use:
1. Path-based user context: /api/{user_id}/tasks instead of header-based
2. Resource name: tasks (not todos)
3. PUT method for full updates
4. Dedicated PATCH endpoint for completion toggle: /api/{user_id}/tasks/{id}/complete

## Response snapshot

Revised all planning artifacts to implement the new API design:

**plan.md (v2.0)**: Updated architecture overview and endpoint summary table to use path-based user context `/api/{user_id}/tasks`, PUT for full updates, and dedicated PATCH `/complete` endpoint. Updated project structure to reflect `task.py` naming.

**research.md (v2.0)**: Added two new technical decisions:
- Decision 7: Path-based user context over header-based (more RESTful, explicit ownership in URL)
- Decision 8: PUT for full updates, PATCH only for toggle completion (clearer semantics)

**data-model.md (v2.0)**: Changed all entity naming from `Todo/todos` to `Task/tasks`. Updated SQLModel class definitions, Alembic migration template, and SQL schema.

**contracts/task_api_contract.md (New)**: Created comprehensive API contract with:
- Full endpoint definitions with path parameters {user_id} and {id}
- Request/response schemas for all operations
- OpenAPI 3.1.0 specification (YAML)
- Error response schema with error codes
- curl examples for all endpoints

## Outcome

- ✅ Impact: Complete API design revision from header-based to path-based routing
- 🧪 Tests: N/A (planning phase)
- 📁 Files: 4 files updated/created
- 🔁 Next prompts: /sp.tasks to regenerate task list, then /sp.implement to rebuild backend
- 🧠 Reflection: Original implementation followed old plan.md design; proper artifact revision enables clean re-implementation

## Evaluation notes (flywheel)

- Failure modes observed: Initial implementation followed documented artifacts (plan.md) which had different design than user intent
- Graders run and results (PASS/FAIL): N/A (planning phase)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Consider adding API design review checkpoint before implementation
