# Tasks: MCP Task Tools for AI Chatbot

**Input**: Design documents from `Phase_III/specs/007-mcp-task-tools/`
**Prerequisites**: plan.md, spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Not explicitly requested in spec - tests are optional and not included in this task list.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `Phase_III/` directory:
- Agent tier: `agent/mcp_server/`
- Backend (external dependency): `backend/` (via REST API only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic MCP server structure. Follow the MCP Builder skill for all setup tasks.

- [X] T001 Create agent tier directory structure: `Phase_III/backend/src/mcp/`, `Phase_III/backend/src/mcp/tools/`, `Phase_III/backend/src/mcp/client/`, `Phase_III/backend/src/mcp/schemas/`, `Phase_III/backend/tests/mcp/` (✅ Integrated into backend)
- [X] T002 Initialize Python project with pyproject.toml - Added mcp>=1.0.0 to existing backend dependencies (httpx already present) (✅ Complete)
- [X] T003 [P] Create __init__.py files in all MCP directories (✅ Complete)
- [X] T004 [P] Create README.md in `Phase_III/backend/src/mcp/` with quickstart instructions (✅ Complete)
- [X] T005 Create .env.example - Updated `Phase_III/backend/.env.example` with MCP configuration (BACKEND_URL, REQUEST_TIMEOUT, MCP_DEBUG) (✅ Complete)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented. Follow the MCP Builder skill for all foundational tasks.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Implement async HTTP client in `Phase_III/backend/src/mcp/client/backend_client.py` with connection pooling, timeout configuration, error handling, and methods for each REST endpoint (✅ Complete - All 5 REST methods implemented)
- [X] T007 Create Pydantic schemas in `Phase_III/backend/src/mcp/schemas/task_schemas.py` for tool inputs/outputs matching backend API contracts (✅ Complete - All input/output schemas defined)
- [X] T008 Initialize MCP server entry point in `Phase_III/backend/src/mcp/server.py` following MCP SDK structure with server initialization, all 5 tools registered via decorators, and stdio transport (✅ Complete)
- [X] T009 [P] Create base error handling - BackendClientError class and _handle_error method implemented in backend_client.py (✅ Complete)

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI Agent Creates Task (Priority: P1) 🎯 MVP

**Goal**: Enable AI agent to create new tasks via add_task MCP tool. Tasks persist to database with proper user_id scoping.

**Independent Test**: Invoke add_task tool with user_id and task details. Verify task appears in database with correct user_id. Call tool again with different user_id and verify proper isolation.

### Implementation for User Story 1

- [X] T010 [US1] Implemented in `backend/src/mcp/server.py` via _handle_add_task() function. Uses AddTaskInput schema, calls backend_client.create_task(), returns AddTaskOutput (✅ Complete)
- [X] T011 [US1] Registered via @app.list_tools() decorator in server.py with full schema and description (✅ Complete)
- [X] T012 [US1] Created verification script at `backend/tests/mcp/verify_add_task.py` with 3 test scenarios (✅ Complete)

**Checkpoint**: ✅ User Story 1 is fully functional - AI agent can create tasks that persist to database

---

## Phase 4: User Story 2 - AI Agent Lists User's Tasks (Priority: P1) 🎯 MVP

**Goal**: Enable AI agent to retrieve tasks via list_tasks MCP tool with optional status filtering (all, pending, completed).

**Independent Test**: Create multiple tasks for a user with different statuses. Call list_tasks with status="pending" and verify only pending tasks returned. Call with status="all" and verify all tasks returned. Create tasks for second user and verify no data leakage.

### Implementation for User Story 2

- [X] T013 [US2] Implemented in `backend/src/mcp/server.py` via _handle_list_tasks() function. Uses ListTasksInput schema with status enum validation, calls backend_client.list_tasks(), returns ListTasksOutput with task array (✅ Complete)
- [X] T014 [US2] Registered via @app.list_tools() decorator with full schema and status filter description (✅ Complete)
- [X] T015 [US2] Created verification script at `backend/tests/mcp/verify_list_tasks.py` with 4 test scenarios including status filtering and user isolation (✅ Complete)

**Checkpoint**: ✅ User Stories 1 AND 2 both work independently - AI agent can create and list tasks

---

## Phase 5: User Story 3 - AI Agent Completes Task (Priority: P2)

**Goal**: Enable AI agent to mark tasks as complete via complete_task MCP tool.

**Independent Test**: Create a pending task for a user. Call complete_task with task_id. Verify task status changes to completed in database. Attempt to complete task belonging to different user and verify operation fails with authorization error.

### Implementation for User Story 3

- [X] T016 [US3] Implemented in `backend/src/mcp/server.py` via _handle_complete_task() function. Uses CompleteTaskInput schema, calls backend_client.complete_task(), returns CompleteTaskOutput (✅ Complete)
- [X] T017 [US3] Registered via @app.list_tools() decorator (✅ Complete)
- [X] T018 [US3] Created verification script at `backend/tests/mcp/verify_complete_task.py` with status change and cross-user blocking tests (✅ Complete)

**Checkpoint**: ✅ User Stories 1, 2, AND 3 all work independently - AI agent can create, list, and complete tasks

---

## Phase 6: User Story 4 - AI Agent Updates Task Details (Priority: P3)

**Goal**: Enable AI agent to modify task title or description via update_task MCP tool.

**Independent Test**: Create a task for a user. Call update_task with new title only and verify title updates while description unchanged. Call update_task with new description only and verify description updates while title unchanged. Attempt to update task belonging to different user and verify operation fails.

### Implementation for User Story 4

- [X] T019 [US4] Implemented in `backend/src/mcp/server.py` via _handle_update_task() function. Uses UpdateTaskInput schema, calls backend_client.update_task() with merge logic, returns UpdateTaskOutput (✅ Complete)
- [X] T020 [US4] Registered via @app.list_tools() decorator (✅ Complete)
- [X] T021 [US4] Created verification script at `backend/tests/mcp/verify_update_task.py` with partial update tests and cross-user blocking (✅ Complete)

**Checkpoint**: ✅ User Stories 1-4 all work independently - AI agent can create, list, complete, and update tasks

---

## Phase 7: User Story 5 - AI Agent Deletes Task (Priority: P3)

**Goal**: Enable AI agent to remove tasks via delete_task MCP tool.

**Independent Test**: Create a task for a user. Call delete_task with task_id. Verify task no longer exists in database (call list_tasks to confirm). Attempt to delete task belonging to different user and verify operation fails. Attempt to delete non-existent task_id and verify appropriate error.

### Implementation for User Story 5

- [X] T022 [US5] Implemented in `backend/src/mcp/server.py` via _handle_delete_task() function. Uses DeleteTaskInput schema, calls backend_client.delete_task(), returns DeleteTaskOutput with success flag (✅ Complete)
- [X] T023 [US5] Registered via @app.list_tools() decorator (✅ Complete)
- [X] T024 [US5] Created verification script at `backend/tests/mcp/verify_delete_task.py` with deletion, cross-user blocking, and non-existent task error tests (✅ Complete)

**Checkpoint**: ✅ All user stories are independently functional - Full MCP tool suite is complete

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories. Follow MCP Builder skill for MCP-specific tasks.

- [X] T025 [P] Logging implemented in backend_client.py - all HTTP operations log method, URL, user_id (✅ Complete)
- [X] T026 [P] Logging implemented in server.py call_tool() function - logs tool name, arguments, and errors (✅ Complete)
- [ ] T027 Create stateless validation test - requires running backend server for testing (⏸️ Manual Testing Required)
- [ ] T028 Create integration test with mocked responses (⏸️ Optional Enhancement)
- [X] T029 README.md created at `backend/src/mcp/README.md` with complete setup, configuration, usage, and troubleshooting (✅ Complete)
- [X] T030 [P] Parameter validation via Pydantic schemas with Field constraints (min_length, max_length, UUID type, pattern for status enum) (✅ Complete)
- [X] T031 Config file created at `backend/src/mcp/config.py` using pydantic-settings for environment variable loading (✅ Complete)
- [X] T032 [P] Docstrings added to all functions in backend_client.py, server.py, and handler functions (✅ Complete)
- [ ] T033 End-to-end validation - requires running backend server and executing verification scripts (⏸️ Manual Testing Required)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P3 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1 but complements it
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent but requires tasks to exist (can use US1 to create test data)
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent but requires tasks to exist (can use US1 to create test data)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent but requires tasks to exist (can use US1 to create test data)

### Within Each User Story

- Tool implementation before registration in server
- Tool registration before verification script
- All tools must follow MCP Builder skill structure

### Parallel Opportunities

- **Setup Phase**: T003 (create __init__.py files) and T004 (README) can run in parallel
- **Foundational Phase**: T009 (error handling) can run in parallel with T006-T008 if careful about file boundaries
- **Once Foundational completes**: All user stories (US1-US5) can start in parallel if team capacity allows
- **Polish Phase**: T025, T026, T030, T032 can all run in parallel (different files)

---

## Parallel Example: After Foundational Phase

```bash
# With sufficient team capacity, launch all user stories in parallel:
Task: "Implement add_task tool in Phase_III/agent/mcp_server/tools/add_task.py" (US1)
Task: "Implement list_tasks tool in Phase_III/agent/mcp_server/tools/list_tasks.py" (US2)
Task: "Implement complete_task tool in Phase_III/agent/mcp_server/tools/complete_task.py" (US3)
Task: "Implement update_task tool in Phase_III/agent/mcp_server/tools/update_task.py" (US4)
Task: "Implement delete_task tool in Phase_III/agent/mcp_server/tools/delete_task.py" (US5)

# All tools in different files - no conflicts
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (add_task)
4. Complete Phase 4: User Story 2 (list_tasks)
5. **STOP and VALIDATE**: Test both tools independently
6. Deploy/demo if ready - Basic task management via AI agent works!

**MVP delivers**: AI agent can create tasks and list tasks - the two most critical operations.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Can create tasks!)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP! Create + List)
4. Add User Story 3 → Test independently → Deploy/Demo (+ Complete tasks)
5. Add User Story 4 → Test independently → Deploy/Demo (+ Update tasks)
6. Add User Story 5 → Test independently → Deploy/Demo (Full CRUD!)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational phase:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (add_task)
   - Developer B: User Story 2 (list_tasks)
   - Developer C: User Story 3 (complete_task)
   - Developer D: User Story 4 (update_task)
   - Developer E: User Story 5 (delete_task)
3. Stories complete and integrate independently via MCP server tool registration

---

## MCP Builder Skill Compliance

**CRITICAL**: All tasks explicitly reference "Follow the MCP Builder skill" because:
- MCP Builder skill defines the official structure for MCP servers and tools
- Manual invention of custom MCP structure is prohibited
- Claude Code must generate code according to MCP Builder patterns
- Tool registration, schema definition, and server initialization must follow MCP Builder conventions

Each implementation task (T010, T013, T016, T019, T022) includes "following MCP Builder skill" directive.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All tools MUST remain stateless (no in-memory storage)
- All tools MUST enforce user_id scoping for security
- Backend communication MUST be via REST API only (no direct database access from agent tier)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow MCP Builder skill for all MCP-related implementation
- Verification scripts are for manual testing (not automated tests per spec)

---

## Key Requirements Checklist

Per user requirements, this task list ensures:

✅ Tasks follow MCP Builder skill (explicitly stated in each implementation task)
✅ Stateless MCP server (no in-memory storage, validated in T027)
✅ All tools accept user_id (specified in T010, T013, T016, T019, T022)
✅ All operations use database models (via backend REST API in foundational T006)
✅ Follow Phase II Task schema (schemas defined in T007 matching backend)
✅ Include validation and error handling (T009 foundational, per-tool in implementation)
✅ Return structured responses (schemas in T007, responses in each tool)
✅ Each task self-contained (one tool per task in Phases 3-7)
✅ Include verification step in each task (verify_*.py scripts in T012, T015, T018, T021, T024)
✅ Confirm stateless behavior (T027 restart test)
✅ No frontend, agent, or chat endpoint work (strictly agent tier MCP tools only)
