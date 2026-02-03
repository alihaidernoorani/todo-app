---
id: 0007
title: Backend API Refactor Implementation
stage: green
date: 2026-01-24
surface: agent
model: claude-opus-4-5-20251101
feature: 002-backend-database
branch: 002-backend-database
user: developer
command: /sp.implement
labels: ["refactoring", "fastapi", "path-based-auth", "crud-api"]
links:
  spec: specs/002-backend-database/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/models/task.py
  - backend/src/schemas/task.py
  - backend/src/services/task_service.py
  - backend/src/api/v1/tasks.py
  - backend/src/api/deps.py
  - backend/src/api/v1/router.py
  - backend/src/main.py
  - backend/alembic/versions/001_create_tasks_table.py
  - backend/tests/conftest.py
  - backend/tests/integration/test_task_api.py
  - backend/tests/unit/test_task_service.py
  - backend/tests/contract/test_task_contract.py
  - specs/002-backend-database/tasks.md
tests:
  - backend/tests/integration/test_task_api.py (22 tests)
  - backend/tests/unit/test_task_service.py (18 tests)
  - backend/tests/contract/test_task_contract.py (10 tests)
---

## Prompt

/sp.implement

Action: Implement the Backend API refactor according to the approved Plan and Tasks.

Instructions:
- Target Directory: `/backend/`
- Refactor to path parameter structure `/api/{user_id}/tasks`
- Rename "todo" to "tasks" throughout
- Implement PUT method for full resource updates (all fields required)
- Implement PATCH `/api/{user_id}/tasks/{id}/complete` for toggling completion
- Use SQLModel with user_id from path for data isolation
- Verify Swagger UI shows correct endpoints

Verification:
- Ensure the FastAPI application successfully launches and the Swagger UI at `/docs` reflects the updated path parameters and resource names.

## Response snapshot

Successfully implemented the complete Backend API refactoring from header-based to path-based user context:

**Phase 1 (Setup)**: Renamed all files from "todo" to "task" naming:
- `todo.py` → `task.py` (models, schemas)
- `todo_service.py` → `task_service.py`
- `todos.py` → `tasks.py` (api/v1)

**Phase 2 (Foundational)**: Core refactoring:
- Updated Task model with `__tablename__ = "tasks"`
- Updated schemas: TaskCreate, TaskUpdate (PUT semantics), TaskRead, TaskList
- Updated task_service with all renamed functions + new toggle_task_complete
- Replaced header-based auth with path parameter validation in deps.py
- Updated router to use `/api/{user_id}/tasks` pattern

**Phases 3-7 (User Stories)**: All CRUD endpoints implemented:
- POST `/api/{user_id}/tasks` - Create task
- GET `/api/{user_id}/tasks` - List tasks (user-isolated)
- GET `/api/{user_id}/tasks/{id}` - Get single task
- PUT `/api/{user_id}/tasks/{id}` - Full update (all fields required)
- PATCH `/api/{user_id}/tasks/{id}/complete` - Toggle completion
- DELETE `/api/{user_id}/tasks/{id}` - Delete task

**Phase 8 (Polish)**: All tests updated and passing (50 tests total)

## Outcome

- ✅ Impact: Complete API refactoring from `/api/v1/todos` with header auth to `/api/{user_id}/tasks` with path-based user context
- 🧪 Tests: 50 tests passing (22 integration, 18 unit, 10 contract)
- 📁 Files: 13 files modified/created
- 🔁 Next prompts: Update README.md with new endpoint examples, validate curl examples
- 🧠 Reflection: Clean separation of concerns with path-based user context eliminates header parsing complexity

## Evaluation notes (flywheel)

- Failure modes observed: None - implementation proceeded smoothly following task order
- Graders run and results (PASS/FAIL): ruff check PASS, pytest PASS (50/50)
- Prompt variant (if applicable): Standard /sp.implement
- Next experiment (smallest change to try): N/A - implementation complete
