# Tasks: AI Agent Integration using OpenAI Agents SDK

**Input**: Design documents from `Phase_III/specs/ai-agent-integration/`
**Prerequisites**: plan.md, spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tests**: Not explicitly requested in spec - tests are optional and not included in this task list.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `Phase_III/` directory:
- Agent tier: `backend/src/agents/`
- Backend (external dependency): `backend/` (via REST API only)
- MCP server: `backend/src/mcp/` (already implemented)
- Database models: `backend/src/models/` (already implemented)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic agent structure. Follow OpenAI Agents SDK patterns for all setup tasks.

- [X] T001 Create agent tier directory structure: `Phase_III/backend/src/agents/`, `Phase_III/backend/src/agents/config/`, `Phase_III/backend/src/agents/mcp/`, `Phase_III/backend/src/agents/core/`, `Phase_III/backend/src/agents/api/`, `Phase_III/backend/tests/agents/`
- [X] T002 Initialize Python project dependencies - Add `openai[agents]` to backend pyproject.toml dependencies
- [X] T003 [P] Create __init__.py files in all agent directories
- [X] T004 [P] Create README.md in `Phase_III/backend/src/agents/` with quickstart instructions
- [X] T005 Create .env.example - Update `Phase_III/backend/.env.example` with OPENAI_API_KEY configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented. Follow OpenAI Agents SDK patterns for all foundational tasks.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create agent configuration module in `backend/src/agents/config/agent_config.py` - Define system instructions for the agent (NOT AgentConfig class - use simple Agent() initialization per SDK)
- [X] T007 Create MCP tool functions in `backend/src/agents/mcp/mcp_tools.py` - Implement @function_tool decorated functions for all 5 MCP tools following OpenAI Agents SDK patterns
- [X] T008 Create main agent in `backend/src/agents/core/agent.py` - Initialize Agent using Agent(name, instructions, tools) pattern from OpenAI Agents SDK
- [X] T009 Create conversation handler in `backend/src/agents/core/conversation_handler.py` - Build conversation history using UserMessageItem and AssistantMessageItem from SDK
- [X] T010 Create agent runner in `backend/src/agents/core/runner.py` - Use Runner.run() to execute agent with conversation history

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - AI Agent Creates Task (Priority: P1) 🎯 MVP

**Goal**: Enable AI agent to create new tasks via natural language using add_task MCP tool. Tasks persist to database with proper user_id scoping.

**Independent Test**: Ask agent "Create a task to review code today". Verify task appears in database with correct user_id. Ask agent to create another task with different user and verify isolation.

### Implementation for User Story 1

- [X] T011 [US1] Implement add_task function tool in `backend/src/agents/mcp/mcp_tools.py` - Create @function_tool decorated async function that calls add_task MCP tool
- [X] T012 [US1] Update main agent to include add_task tool - Add add_task to the agent's tools list
- [X] T013 [US1] Add verification script at `backend/tests/agents/verify_task_creation.py` - Test using Runner.run() with task creation messages

**Checkpoint**: ✅ User Story 1 is fully functional - AI agent can create tasks via natural language

---

## Phase 4: User Story 2 - AI Agent Lists User's Tasks (Priority: P1) 🎯 MVP

**Goal**: Enable AI agent to retrieve tasks via natural language using list_tasks MCP tool with optional status filtering (all, pending, completed).

**Independent Test**: Ask agent "Show me my pending tasks". Verify only pending tasks returned. Ask "Show me all tasks" and verify all tasks returned. Ask second user to view tasks and verify no data leakage.

### Implementation for User Story 2

- [X] T014 [US2] Implement list_tasks function tool in `backend/src/agents/mcp/mcp_tools.py` - Create @function_tool decorated async function that calls list_tasks MCP tool
- [X] T015 [US2] Update main agent to include list_tasks tool - Add list_tasks to the agent's tools list
- [X] T016 [US2] Add verification script at `backend/tests/agents/verify_task_listing.py` - Test using Runner.run() with task listing messages

**Checkpoint**: ✅ User Stories 1 AND 2 both work independently - AI agent can create and list tasks via natural language

---

## Phase 5: User Story 3 - AI Agent Completes Task (Priority: P2)

**Goal**: Enable AI agent to mark tasks as complete via natural language using complete_task MCP tool.

**Independent Test**: Ask agent "Complete task #123". Verify task status changes to completed in database. Ask agent to complete task belonging to different user and verify operation fails with authorization error.

### Implementation for User Story 3

- [X] T017 [US3] Implement complete_task function tool in `backend/src/agents/mcp/mcp_tools.py` - Create @function_tool decorated async function that calls complete_task MCP tool
- [X] T018 [US3] Update main agent to include complete_task tool - Add complete_task to the agent's tools list
- [X] T019 [US3] Add verification script at `backend/tests/agents/verify_task_completion.py` - Test using Runner.run() with task completion messages

**Checkpoint**: ✅ User Stories 1, 2, AND 3 all work independently - AI agent can create, list, and complete tasks via natural language

---

## Phase 6: User Story 4 - AI Agent Updates Task Details (Priority: P3)

**Goal**: Enable AI agent to modify task title or description via natural language using update_task MCP tool.

**Independent Test**: Ask agent "Change task #123 title to 'Review PRs' and add description 'Check all open PRs'". Verify title and description update correctly. Ask agent to update task belonging to different user and verify operation fails.

### Implementation for User Story 4

- [X] T020 [US4] Implement update_task function tool in `backend/src/agents/mcp/mcp_tools.py` - Create @function_tool decorated async function that calls update_task MCP tool
- [X] T021 [US4] Update main agent to include update_task tool - Add update_task to the agent's tools list
- [X] T022 [US4] Add verification script at `backend/tests/agents/verify_task_update.py` - Test using Runner.run() with task update messages

**Checkpoint**: ✅ User Stories 1-4 all work independently - AI agent can create, list, complete, and update tasks via natural language

---

## Phase 7: User Story 5 - AI Agent Deletes Task (Priority: P3)

**Goal**: Enable AI agent to remove tasks via natural language using delete_task MCP tool.

**Independent Test**: Ask agent "Delete task #123". Verify task no longer exists in database. Ask agent to delete task belonging to different user and verify operation fails. Ask agent to delete non-existent task and verify appropriate error message.

### Implementation for User Story 5

- [X] T023 [US5] Implement delete_task function tool in `backend/src/agents/mcp/mcp_tools.py` - Create @function_tool decorated async function that calls delete_task MCP tool
- [X] T024 [US5] Update main agent to include delete_task tool - Add delete_task to the agent's tools list
- [X] T025 [US5] Add verification script at `backend/tests/agents/verify_task_deletion.py` - Test using Runner.run() with task deletion messages

**Checkpoint**: ✅ All user stories are independently functional - Full natural language task management works!

---

## Phase 8: API Integration

**Purpose**: Create API endpoints for agent interaction and final integration.

- [X] T026 Create agent API endpoint in `backend/src/agents/api/agent_routes.py` - Implement POST /api/agent/message endpoint that uses Runner.run() to execute agent
- [X] T027 Implement agent request handler in `backend/src/agents/api/agent_handler.py` - Build conversation history and call Runner.run() with proper context
- [X] T028 Add request validation in `backend/src/agents/api/schemas.py` - Create Pydantic schemas for agent API requests and responses
- [X] T029 Add response serialization in `backend/src/agents/api/serializers.py` - Format Runner.run() results for API consumption

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation.

- [X] T030 Add comprehensive logging using SDK tracing - Use enable_tracing() and set_trace_handler() for observability
- [X] T031 Create integration test suite in `backend/tests/agents/test_agent_integration.py` - Test Runner.run() with various conversation scenarios
- [X] T032 Add guardrails for input/output validation - Implement InputGuardrail and output_guardrail decorators per SDK patterns
- [X] T033 Add documentation and usage examples - Document Agent, function_tool, and Runner.run() usage patterns
- [X] T034 Validate stateless behavior - Test agent works correctly across multiple Runner.run() calls with conversation history

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2 → P3 → P3)
- **API Integration (Phase 8)**: Depends on user stories being complete
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent of US1 but complements it
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent but requires tasks to exist (can use US1 to create test data)
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Independent but requires tasks to exist (can use US1 to create test data)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Independent but requires tasks to exist (can use US1 to create test data)

### Within Each User Story

- Tool wrapper implementation before handler implementation
- Handler implementation before verification script
- All components must follow OpenAI Agents SDK patterns

### Parallel Opportunities

- **Setup Phase**: T003 (create __init__.py files) and T004 (README) can run in parallel
- **Foundational Phase**: T008-T010 can run in parallel after T006-T007
- **Once Foundational completes**: All user stories (US1-US5) can start in parallel if team capacity allows
- **API Integration**: T026-T029 can run in parallel (different files)
- **Polish Phase**: T030-T034 can all run in parallel (different files)

---

## Parallel Example: After Foundational Phase

```bash
# With sufficient team capacity, launch all user stories in parallel:
Task: "Implement add_task wrapper in backend/src/agents/mcp/mcp_tools.py" (US1)
Task: "Implement list_tasks wrapper in backend/src/agents/mcp/mcp_tools.py" (US2)
Task: "Implement complete_task wrapper in backend/src/agents/mcp/mcp_tools.py" (US3)
Task: "Implement update_task wrapper in backend/src/agents/mcp/mcp_tools.py" (US4)
Task: "Implement delete_task wrapper in backend/src/agents/mcp/mcp_tools.py" (US5)

# All wrappers in different files - no conflicts
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (add_task)
4. Complete Phase 4: User Story 2 (list_tasks)
5. **STOP and VALIDATE**: Test both tools independently
6. Deploy/demo if ready - Basic natural language task management works!

**MVP delivers**: AI agent can create and list tasks via natural language - the two most critical operations.

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
3. Stories complete and integrate independently via agent coordination

---

## OpenAI Agents SDK Compliance

**CRITICAL**: All tasks explicitly reference "Follow OpenAI Agents SDK patterns" because:
- OpenAI Agents SDK defines the official structure for agent creation and tool integration
- Manual invention of custom agent structure is prohibited
- Claude Code must generate code according to OpenAI Agents SDK patterns
- Agent configuration, tool registration, and execution must follow OpenAI Agents SDK conventions

Each implementation task includes "following OpenAI Agents SDK patterns" directive.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- All tools MUST remain stateless (no in-memory storage)
- All tools MUST enforce user_id scoping for security
- Backend communication MUST be via MCP tools only (no direct database access from agent)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Follow OpenAI Agents SDK patterns for all agent-related implementation
- Verification scripts are for manual testing (not automated tests per spec)

---

## Key Requirements Checklist

Per user requirements, this task list ensures:

✅ Tasks follow OpenAI Agents SDK patterns (explicitly stated in each implementation task)
✅ Stateless agent (no in-memory storage, validated in T034)
✅ All tools accept user_id (specified in T011, T014, T017, T020, T023)
✅ All operations use database models (via MCP tools in foundational T007)
✅ Follow existing schema patterns (schemas defined in T008 matching backend)
✅ Include validation and error handling (T010 foundational, per-handler in implementation)
✅ Return structured responses (schemas in T008, responses in each handler)
✅ Each task self-contained (one tool per task in Phases 3-7)
✅ Include verification step in each task (verify_*.py scripts in T013, T016, T019, T022, T025)
✅ Confirm stateless behavior (T034 restart test)
✅ No frontend, agent, or chat endpoint work (strictly backend agent tier only)

---

## Next Steps

1. Review and approve this task list
2. Begin implementation starting with Phase 1 (Setup)
3. Use `/sp.implement` to execute the implementation plan when ready
4. Each task can be worked on independently following the checklist format