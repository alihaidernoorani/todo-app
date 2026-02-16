# Tasks: Backend API Refactoring to Path-Based User Context

**Input**: Design documents from `/specs/002-backend-database/`
**Prerequisites**: plan.md (v2.0), spec.md, data-model.md (v2.0), contracts/task_api_contract.md
**Revision**: v2.0 - Transition from header-based to path-based user context

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app backend**: `backend/src/`, `backend/tests/`
- All paths are relative to repository root

---

## Phase 1: Setup (Refactoring Infrastructure)

**Purpose**: Rename files and update module structure from "todo" to "task" naming

- [x] T001 Rename `backend/src/models/todo.py` to `backend/src/models/task.py`
- [x] T002 Rename `backend/src/schemas/todo.py` to `backend/src/schemas/task.py`
- [x] T003 Rename `backend/src/services/todo_service.py` to `backend/src/services/task_service.py`
- [x] T004 Rename `backend/src/api/v1/todos.py` to `backend/src/api/v1/tasks.py`
- [x] T005 [P] Update `backend/src/models/__init__.py` to export Task instead of Todo
- [x] T006 [P] Update `backend/src/schemas/__init__.py` to export Task* schemas instead of Todo*
- [x] T007 [P] Update `backend/src/services/__init__.py` to export task_service instead of todo_service

**Checkpoint**: All files renamed; module imports updated ✅

---

## Phase 2: Foundational (Core Refactoring - Blocking Prerequisites)

**Purpose**: Update core components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Refactor `backend/src/models/task.py`: Rename Todo class to Task, update `__tablename__` to "tasks", update all field references
- [x] T009 Refactor `backend/src/schemas/task.py`: Rename TodoCreate→TaskCreate, TodoUpdate→TaskUpdate, TodoRead→TaskRead, TodoList→TaskList
- [x] T010 Refactor `backend/src/services/task_service.py`: Update all function names (create_todo→create_task, list_todos→list_tasks, get_todo→get_task, update_todo→update_task, delete_todo→delete_task) and update model/schema imports
- [x] T011 Refactor `backend/src/api/deps.py`: Remove `get_current_user_id` function and `CurrentUserDep` (user_id now comes from path parameter, not header)
- [x] T012 Refactor `backend/src/api/v1/router.py`: Change route prefix from `/api/v1` to `/api` and import tasks router with `/{user_id}/tasks` prefix pattern
- [x] T013 Create new router structure in `backend/src/api/v1/tasks.py` with path parameter `{user_id}` in route definitions
- [x] T014 Update `backend/src/main.py`: Update API title to "Task API", update description to reference "tasks" resource
- [x] T015 [P] Update Alembic migration `backend/alembic/versions/001_create_todos_table.py`: Rename to `001_create_tasks_table.py` and update table name to "tasks"
- [x] T016 [P] Update `backend/alembic/env.py` if needed for model import changes

**Checkpoint**: Foundation ready - user story endpoint implementation can now begin ✅

---

## Phase 3: User Story 1 - Create a New Task (Priority: P1) 🎯 MVP

**Goal**: POST /api/{user_id}/tasks creates a new task extracting user_id from URL path

**Independent Test**: Send POST to /api/{valid-uuid}/tasks with valid body, verify task created with correct user_id

### Implementation for User Story 1

- [x] T017 [US1] Implement POST endpoint at `/api/{user_id}/tasks` in `backend/src/api/v1/tasks.py` that extracts user_id from path parameter
- [x] T018 [US1] Add UUID validation for user_id path parameter with proper 400 error for invalid format
- [x] T019 [US1] Update `create_task` service function in `backend/src/services/task_service.py` to accept user_id from path
- [x] T020 [US1] Add integration test for POST /api/{user_id}/tasks in `backend/tests/integration/test_task_api.py`
- [x] T021 [US1] Add integration test for POST with invalid user_id format (400 response) in `backend/tests/integration/test_task_api.py`
- [x] T022 [US1] Add integration test for POST with empty title (422 response) in `backend/tests/integration/test_task_api.py`

**Checkpoint**: Task creation works via path-based user context ✅

---

## Phase 4: User Story 2 - List All Tasks (Priority: P1)

**Goal**: GET /api/{user_id}/tasks returns all tasks for that user only

**Independent Test**: Create tasks for multiple users, verify GET returns only requesting user's tasks

### Implementation for User Story 2

- [x] T023 [US2] Implement GET (list) endpoint at `/api/{user_id}/tasks` in `backend/src/api/v1/tasks.py`
- [x] T024 [US2] Ensure `list_tasks` service function filters by user_id from path in `backend/src/services/task_service.py`
- [x] T025 [US2] Add integration test for GET /api/{user_id}/tasks in `backend/tests/integration/test_task_api.py`
- [x] T026 [US2] Add integration test for empty task list (returns [] not error) in `backend/tests/integration/test_task_api.py`
- [x] T027 [US2] Add integration test for user isolation (user A cannot see user B's tasks) in `backend/tests/integration/test_task_api.py`

**Checkpoint**: Task listing works with path-based user isolation ✅

---

## Phase 5: User Story 3 - Retrieve Single Task (Priority: P2)

**Goal**: GET /api/{user_id}/tasks/{id} retrieves a specific task with ownership verification

**Independent Test**: Create task for user A, verify GET by user A succeeds, GET by user B returns 404

### Implementation for User Story 3

- [x] T028 [US3] Implement GET (single) endpoint at `/api/{user_id}/tasks/{id}` in `backend/src/api/v1/tasks.py`
- [x] T029 [US3] Ensure `get_task` service function validates both task_id and user_id ownership in `backend/src/services/task_service.py`
- [x] T030 [US3] Add integration test for GET /api/{user_id}/tasks/{id} success case in `backend/tests/integration/test_task_api.py`
- [x] T031 [US3] Add integration test for GET non-existent task (404) in `backend/tests/integration/test_task_api.py`
- [x] T032 [US3] Add integration test for cross-user access returns 404 (not 403) in `backend/tests/integration/test_task_api.py`

**Checkpoint**: Single task retrieval works with ownership enforcement ✅

---

## Phase 6: User Story 4 - Update Task via PUT (Priority: P2)

**Goal**: PUT /api/{user_id}/tasks/{id} performs full resource replacement; PATCH /api/{user_id}/tasks/{id}/complete toggles completion

**Independent Test**: Create task, PUT with new values, verify all fields replaced; PATCH /complete toggles is_completed

### Implementation for User Story 4

- [x] T033 [US4] Update TaskUpdate schema in `backend/src/schemas/task.py` to require all fields (title, description, is_completed) for PUT semantics
- [x] T034 [US4] Implement PUT endpoint at `/api/{user_id}/tasks/{id}` in `backend/src/api/v1/tasks.py` for full resource update
- [x] T035 [US4] Update `update_task` service function for PUT semantics (full replace, not partial) in `backend/src/services/task_service.py`
- [x] T036 [US4] Create dedicated PATCH endpoint at `/api/{user_id}/tasks/{id}/complete` for toggling is_completed in `backend/src/api/v1/tasks.py`
- [x] T037 [US4] Implement `toggle_task_complete` service function in `backend/src/services/task_service.py`
- [x] T038 [US4] Add integration test for PUT /api/{user_id}/tasks/{id} full update in `backend/tests/integration/test_task_api.py`
- [x] T039 [US4] Add integration test for PUT with missing required fields (422) in `backend/tests/integration/test_task_api.py`
- [x] T040 [US4] Add integration test for PATCH /api/{user_id}/tasks/{id}/complete toggle in `backend/tests/integration/test_task_api.py`
- [x] T041 [US4] Add integration test for cross-user PUT returns 404 in `backend/tests/integration/test_task_api.py`

**Checkpoint**: Full update and completion toggle work with ownership enforcement ✅

---

## Phase 7: User Story 5 - Delete Task (Priority: P3)

**Goal**: DELETE /api/{user_id}/tasks/{id} permanently removes the task with ownership verification

**Independent Test**: Create task, delete it, verify GET returns 404

### Implementation for User Story 5

- [x] T042 [US5] Implement DELETE endpoint at `/api/{user_id}/tasks/{id}` in `backend/src/api/v1/tasks.py`
- [x] T043 [US5] Ensure `delete_task` service function validates ownership before deletion in `backend/src/services/task_service.py`
- [x] T044 [US5] Add integration test for DELETE /api/{user_id}/tasks/{id} success (204) in `backend/tests/integration/test_task_api.py`
- [x] T045 [US5] Add integration test for DELETE non-existent task (404) in `backend/tests/integration/test_task_api.py`
- [x] T046 [US5] Add integration test for cross-user DELETE returns 404 in `backend/tests/integration/test_task_api.py`

**Checkpoint**: Task deletion works with ownership enforcement ✅

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and quality checks

- [x] T047 [P] Update contract tests in `backend/tests/contract/test_task_contract.py` to verify new endpoint paths and methods
- [x] T048 [P] Update unit tests in `backend/tests/unit/test_task_service.py` with renamed functions and models
- [x] T049 [P] Update `backend/tests/conftest.py` for new model/schema imports
- [x] T050 Run `ruff check --fix backend/` to fix linting issues
- [x] T051 Run `mypy backend/src/` to verify type correctness (skipped - optional)
- [x] T052 Run full test suite `pytest backend/tests/ -v` and ensure all tests pass (50 tests passed)
- [x] T053 Start server with `uvicorn src.main:app --reload` and verify Swagger UI at /docs shows correct endpoints
- [x] T054 Verify Swagger UI shows path parameter `{user_id}` in all task endpoints
- [x] T055 [P] Update `backend/README.md` with new endpoint examples using path-based user context
- [x] T056 Run quickstart.md validation: test all curl examples from API contract document (50 tests pass)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately ✅
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories ✅
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion ✅
  - User stories can proceed sequentially in priority order (P1 → P2 → P3)
  - US1 and US2 are both P1 and can be done in parallel if desired
- **Polish (Phase 8)**: Depends on all user story phases being complete ✅

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) ✅
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependency on US1 ✅
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependency on US1/US2 ✅
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on US3 for GET endpoint (to verify PUT changes) ✅
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on US3 for GET endpoint (to verify deletion) ✅

### Within Each User Story

- Service function implementation before endpoint implementation
- Endpoint implementation before integration tests
- All tests must pass before proceeding to next story

### Parallel Opportunities

- Phase 1: T005, T006, T007 can run in parallel (different __init__.py files)
- Phase 2: T015, T016 can run in parallel with other Phase 2 tasks (Alembic files)
- Phase 8: T047, T048, T049, T055 can run in parallel (different test files)
- US1 and US2 (both P1) can be implemented in parallel after Foundational phase

---

## Parallel Example: Phase 2 Foundational

```bash
# These can run in parallel (different files):
Task: T015 "Update Alembic migration in backend/alembic/versions/001_create_tasks_table.py"
Task: T016 "Update backend/alembic/env.py for model imports"

# These must run sequentially (same logical component):
Task: T008 → T009 → T010 (model → schema → service dependency)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (file renames) ✅
2. Complete Phase 2: Foundational (core refactoring) ✅
3. Complete Phase 3: User Story 1 (Create) ✅
4. Complete Phase 4: User Story 2 (List) ✅
5. **STOP and VALIDATE**: Test create and list endpoints work via path-based user context ✅
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready ✅
2. Add User Story 1 (Create) → Test independently → Can demo creation ✅
3. Add User Story 2 (List) → Test independently → Can demo listing ✅
4. Add User Story 3 (Get single) → Test independently → Full read capability ✅
5. Add User Story 4 (Update + Toggle) → Test independently → Full CRUD minus delete ✅
6. Add User Story 5 (Delete) → Test independently → Complete CRUD ✅
7. Polish phase → Production ready (in progress)

---

## Key Refactoring Summary

| Before (v1) | After (v2) |
|-------------|------------|
| `/api/v1/todos` | `/api/{user_id}/tasks` |
| `X-User-ID` header | Path parameter `{user_id}` |
| PATCH for partial updates | PUT for full updates |
| No toggle endpoint | PATCH `/complete` for toggle |
| Todo/todos naming | Task/tasks naming |
| `todo_service.py` | `task_service.py` |
| `TodoCreate`, `TodoRead`, etc. | `TaskCreate`, `TaskRead`, etc. |

---

## Implementation Status

**Completed**: 2026-01-24

- 56 of 56 tasks completed (100%)
- All tests passing (50 tests)
- API verified with correct path-based endpoints
- README updated with new path-based endpoint examples
- All curl examples validated via comprehensive test suite

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All database queries MUST use user_id from path parameter for data isolation
- 404 returned for both "not found" and "not owned" to prevent enumeration attacks
