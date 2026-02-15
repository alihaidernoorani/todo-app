# Tasks: AI Agent Integration (008)

**Feature**: `008-ai-agent-integration` | **Branch**: `003-ai-todo-chatbot`
**Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Scope**: Hackathon — stateless endpoint, DB-backed conversation history, complete JSON response

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)
- All file paths relative to `backend/`

---

## Phase 1: Setup (Verify Existing Scaffold)

**Purpose**: Confirm all pre-built files are present and identify any missing imports or syntax issues before implementation begins.

**Checkpoint**: All scaffold files exist and are importable.

- [X] T001 Audit existing agent scaffold — confirm `src/agents/core/agent.py`, `src/agents/mcp/mcp_tools.py`, `src/agents/core/runner.py`, `src/agents/api/agent_handler.py`, `src/agents/api/agent_routes.py`, `src/agents/api/schemas.py`, `src/mcp/client/backend_client.py` exist and import without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire the shared infrastructure that every user story depends on. No user story can be validated until this phase is complete.

**⚠️ CRITICAL**: Complete this phase before any user story work.

**Checkpoint**: `POST /api/v1/agent/{user_id}/chat` returns 401 for unauthenticated requests and 200 with `{agent_response, tool_calls, conversation_id, user_message_id, agent_message_id}` for valid authenticated requests.

### Parallel group (T002–T007 have no mutual dependencies — run simultaneously):

- [X] T002 [P] Fix `task_id` type from `int` to `str` in `complete_task`, `update_task`, and `delete_task` function signatures in `src/agents/mcp/mcp_tools.py` — prevents runtime `TypeError` when LLM passes UUID strings from `list_tasks` output
- [X] T003 [P] Update `AgentChatResponse` in `src/agents/api/schemas.py` — change `tool_calls` field to `default_factory=list` so response always contains `"tool_calls": []` (never `null`); verify `ToolCallInfo` dataclass has `tool_name`, `arguments`, `result` fields
- [X] T004 [P] Verify router registration in `src/main.py` — confirm `app.include_router(agent_router, prefix="/api/v1/agent")` is present; add if missing; smoke-test `GET /api/v1/agent/health` returns `{"status": "healthy"}`
- [X] T005 [P] Rewrite `run_agent()` in `src/agents/core/runner.py` — introduce `AgentRunResult` dataclass (`response_text: str`, `tool_calls: list[dict]`); extract tool calls from `result.new_items` using `isinstance(item, ToolCallItem)` / `isinstance(item, ToolCallOutputItem)` (import from `agents.items`); `item.output` is `str` — use `json.loads()` to convert; return `AgentRunResult` instead of tuple `(str, result)`
- [X] T006 [P] Create `src/services/conversation_service.py` — implement `get_or_create_conversation(db: AsyncSession, user_id: str, conversation_id: int | None) -> Conversation`; `None` → INSERT new row; existing ID → SELECT + verify `conversation.user_id == user_id` (403 if mismatch, 404 if not found)
- [X] T007 [P] Create `src/services/message_service.py` — implement `load_conversation_history(db, conversation_id, limit=20) -> list[dict]` (SELECT last 20 DESC, reverse to oldest-first, return `[{"role": ..., "content": ...}]`); implement `persist_message(db, conversation_id, user_id, role, content) -> int` (INSERT + return `message.id`)

### Sequential group (T008–T009 require T006 and T007 to be complete first):

- [X] T008 Rewrite `AgentRequestHandler.process_chat_request()` in `src/agents/api/agent_handler.py` — replace both TODO stubs: call `get_or_create_conversation()`, `load_conversation_history()`, `persist_message()` (user then assistant); call `run_agent()` with `AgentRunResult`; build `AgentChatResponse` with `tool_calls` list from `ToolCallInfo` objects; pass `db: AsyncSession` as parameter; depends on T005, T006, T007
- [X] T009 Add JWT auth and DB session to `src/agents/api/agent_routes.py` — inject `Depends(get_current_user_with_path_validation)` and `Depends(get_db)`; change `user_id` parameter type to `str`; validate `request.message` is non-empty (400); re-raise `HTTPException` from services (403/404); catch `Exception` → 500 with safe message; depends on T005, T008

---

## Phase 3: User Story 1 — Task Creation via Natural Language (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks by describing them in plain English via the chat endpoint.

**Independent Test**: `POST /api/v1/agent/{user_id}/chat` with `{"message": "Add a task to buy groceries", "conversation_id": null}` → 200 response, new task visible in `list_tasks`, `tool_calls` contains `add_task` entry.

**Depends on**: Phase 2 complete (all foundational tasks T001–T009)

- [X] T010 [P] [US1] Write unit test `tests/agents/test_mcp_tools.py::test_add_task_calls_backend_client` — mock `BackendClient.create_task`, call `add_task(ctx, title="buy groceries")`, assert mock called with correct `user_id` and `title`
- [X] T011 [US1] Write integration test `tests/agents/test_agent_api.py::test_create_task_via_chat` — post message "Add a task to buy groceries" with valid auth + `conversation_id: null`; assert `status_code == 200`, `body["conversation_id"]` is int, `body["agent_response"]` is non-empty string, `body["tool_calls"]` contains entry with `tool_name == "add_task"`

---

## Phase 4: User Story 2 — Task Listing and Retrieval (Priority: P2)

**Goal**: Users can ask about their tasks in natural language and receive a formatted response.

**Independent Test**: `POST /api/v1/agent/{user_id}/chat` with `{"message": "What tasks do I have?"}` → 200, `tool_calls` contains `list_tasks` entry, `agent_response` lists tasks or says none exist.

**Depends on**: Phase 2 complete

- [X] T012 [US2] Write integration test `tests/agents/test_agent_api.py::test_list_tasks_via_chat` — post "What tasks do I have?" with valid auth; assert `status_code == 200`, `body["tool_calls"]` contains entry with `tool_name == "list_tasks"`, `body["agent_response"]` is a non-empty string

---

## Phase 5: User Story 3 — Task Completion (Priority: P2)

**Goal**: Users can mark tasks complete by referring to them by description without needing task IDs.

**Independent Test**: Post "Mark 'buy groceries' as done" → 200, `tool_calls` contains `complete_task` entry with a UUID `task_id` string.

**Depends on**: Phase 2 complete

- [X] T013 [P] [US3] Write unit test `tests/agents/test_mcp_tools.py::test_complete_task_accepts_uuid_string` — mock `BackendClient.complete_task`; call `complete_task(ctx, task_id="3f8a2b-uuid-string")`; assert mock called with `task_id="3f8a2b-uuid-string"` (confirms string type accepted, not int)
- [X] T014 [US3] Write integration test `tests/agents/test_agent_api.py::test_complete_task_via_chat` — post "Mark buy groceries as done" with valid auth; assert `status_code == 200`, `body["tool_calls"]` contains entry with `tool_name == "complete_task"`

---

## Phase 6: User Story 6 — Conversational Context Awareness (Priority: P2)

**Goal**: The backend loads and passes conversation history to the agent, enabling multi-turn context without the client sending history.

**Independent Test**: Send two messages in the same conversation: "Create a task to call mom" then "Actually, make it call dad instead" — assert agent resolves "it" from DB-loaded history, `body["conversation_id"]` is consistent across both turns.

**Depends on**: Phase 2 complete (message persistence, conversation loading)

- [X] T015 [P] [US6] Write service test `tests/agents/test_message_service.py::test_load_empty_for_new_conversation` — create blank conversation; call `load_conversation_history(db, conv.id)`; assert returns `[]`
- [X] T016 [P] [US6] Write service test `tests/agents/test_message_service.py::test_load_returns_last_20_of_25` — insert 25 messages; call `load_conversation_history(db, conv.id)`; assert `len(result) == 20` and messages are oldest-first order
- [X] T017 [US6] Write integration test `tests/agents/test_agent_api.py::test_second_turn_uses_db_history` — post first message with `conversation_id: null` → extract returned `conversation_id`; post second message with that `conversation_id`; assert `status_code == 200`, `body["user_message_id"]` is new ID; assert DB has 4 rows for that conversation (2 turns × 2 messages each)

---

## Phase 7: User Story 4 — Task Updates and Modifications (Priority: P3)

**Goal**: Users can modify task titles or details by describing the change in natural language.

**Independent Test**: Post "Change 'buy milk' to 'buy almond milk'" → 200, `tool_calls` contains `update_task` entry with a UUID `task_id` string.

**Depends on**: Phase 2 complete

- [X] T018 [P] [US4] Write unit test `tests/agents/test_mcp_tools.py::test_update_task_accepts_uuid_string` — mock `BackendClient.update_task`; call `update_task(ctx, task_id="uuid-str", title="buy almond milk")`; assert mock called with `task_id="uuid-str"` (string, not int)
- [X] T019 [US4] Write integration test `tests/agents/test_agent_api.py::test_update_task_via_chat` — post "Change buy milk to buy almond milk" with valid auth; assert `status_code == 200`, `body["tool_calls"]` contains entry with `tool_name == "update_task"`

---

## Phase 8: User Story 5 — Task Deletion (Priority: P3)

**Goal**: Users can remove tasks by describing what to delete in natural language.

**Independent Test**: Post "Delete the task about buying milk" → 200, `tool_calls` contains `delete_task` entry with a UUID `task_id` string.

**Depends on**: Phase 2 complete

- [X] T020 [P] [US5] Write unit test `tests/agents/test_mcp_tools.py::test_delete_task_accepts_uuid_string` — mock `BackendClient.delete_task`; call `delete_task(ctx, task_id="uuid-str")`; assert mock called with `task_id="uuid-str"` (confirms string type accepted)
- [X] T021 [US5] Write integration test `tests/agents/test_agent_api.py::test_delete_task_via_chat` — post "Delete the buy milk task" with valid auth; assert `status_code == 200`, `body["tool_calls"]` contains entry with `tool_name == "delete_task"`

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Auth edge cases, service-layer unit tests, and final contract validation.

- [X] T022 Write service tests `tests/agents/test_conversation_service.py` — three cases: (1) `conversation_id=None` → new `Conversation` row with non-null `id`; (2) existing conversation with wrong `user_id` → `HTTPException 403`; (3) non-existent `conversation_id=99999` → `HTTPException 404`
- [X] T023 Write auth edge-case tests in `tests/agents/test_agent_api.py` — two cases: (1) no `Authorization` header → 401; (2) valid JWT but path `{user_id}` ≠ JWT `sub` → 403
- [X] T024 Write message persistence test `tests/agents/test_agent_api.py::test_messages_persisted_after_turn` — post one message; call `load_conversation_history(db, conv_id)` directly; assert `len == 2` (one user row + one assistant row) confirming FR-023
- [X] T025 [P] Write service test `tests/agents/test_message_service.py::test_persist_message_returns_integer_id` — call `persist_message(db, conv.id, "user-1", "user", "Hello")`; assert `isinstance(msg_id, int)` and `msg_id > 0`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ←— BLOCKS everything below
    ├── Phase 3 (US1 - Task Creation)      P1
    ├── Phase 4 (US2 - Task Listing)       P2
    ├── Phase 5 (US3 - Task Completion)    P2
    ├── Phase 6 (US6 - Context Awareness)  P2
    ├── Phase 7 (US4 - Task Updates)       P3
    └── Phase 8 (US5 - Task Deletion)      P3
                ↓
          Final Phase (Polish)
```

### Within Phase 2 (Foundational)

```
T002, T003, T004, T005, T006, T007  ← all independent, run in parallel
                ↓
             T008  ← requires T006 + T007
                ↓
             T009  ← requires T005 + T008
```

### User Story Dependencies

All Phase 3–8 stories depend only on Phase 2 being complete — they are **independent of each other** and can be worked in parallel.

---

## Parallel Execution Examples

### Phase 2 Parallel Group

```bash
# All 6 tasks can execute simultaneously (different files):
T002  →  src/agents/mcp/mcp_tools.py
T003  →  src/agents/api/schemas.py
T004  →  src/main.py
T005  →  src/agents/core/runner.py
T006  →  src/services/conversation_service.py
T007  →  src/services/message_service.py
```

### Phase 3–8 Parallel (after Phase 2)

```bash
# US1 tests    →  tests/agents/test_mcp_tools.py + test_agent_api.py
# US2 tests    →  tests/agents/test_agent_api.py
# US3 tests    →  tests/agents/test_mcp_tools.py + test_agent_api.py
# US4/US5 tests → tests/agents/test_mcp_tools.py + test_agent_api.py
# US6 tests    →  tests/agents/test_message_service.py + test_agent_api.py
```

---

## Implementation Strategy

### MVP (Phase 2 + US1 only — 10 tasks)

1. Complete Phase 1 (T001)
2. Complete Phase 2 parallel group (T002–T007) — foundation built
3. Complete Phase 2 sequential (T008–T009) — endpoint wired
4. Complete Phase 3 / US1 (T010–T011) — task creation working end-to-end
5. **STOP and VALIDATE**: `POST /api/v1/agent/{user_id}/chat` with `"Add task to buy groceries"` → 200 with `tool_calls`
6. Demo if ready — all other stories share the same endpoint and tooling

### Incremental Delivery

1. MVP (Phase 2 + US1) → validate task creation end-to-end
2. Add US2 + US3 (T012–T014) → all read/write operations working
3. Add US6 (T015–T017) → multi-turn conversations validated
4. Add US4 + US5 (T018–T021) → full CRUD complete
5. Add Final Phase (T022–T025) → production-ready test coverage

---

## Files Created / Modified

| Task | File | Action |
|------|------|--------|
| T002 | `src/agents/mcp/mcp_tools.py` | Modify — `task_id: int` → `str` |
| T003 | `src/agents/api/schemas.py` | Modify — `tool_calls` default `[]` |
| T004 | `src/main.py` | Verify/Modify — router prefix |
| T005 | `src/agents/core/runner.py` | Modify — `AgentRunResult` + tool_calls extraction |
| T006 | `src/services/conversation_service.py` | **Create** |
| T007 | `src/services/message_service.py` | **Create** |
| T008 | `src/agents/api/agent_handler.py` | Modify — replace TODO stubs |
| T009 | `src/agents/api/agent_routes.py` | Modify — add auth + DB deps |
| T010, T013, T018, T020 | `tests/agents/test_mcp_tools.py` | **Create** |
| T011, T012, T014, T017, T019, T021, T023, T024 | `tests/agents/test_agent_api.py` | **Create** |
| T015, T016, T025 | `tests/agents/test_message_service.py` | **Create** |
| T022 | `tests/agents/test_conversation_service.py` | **Create** |

---

**Total tasks**: 25
**Phase 2 (foundational)**: 8 tasks (T002–T009)
**User story tasks**: 12 tasks (T010–T021, across US1–US6)
**Polish/cross-cutting**: 4 tasks (T022–T025)
**Parallel opportunities**: 10 tasks marked [P]

**Plan Status**: ✅ Ready for `/sp.implement`
**Endpoint**: `POST /api/v1/agent/{user_id}/chat`
