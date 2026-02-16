---
id: "0010"
title: implement-ai-agent-integration
stage: green
date: 2026-02-16
surface: agent
model: claude-sonnet-4-5-20250929
feature: 008-ai-agent-integration
branch: 003-ai-todo-chatbot
user: alihaidernoorani
command: /sp.implement
labels: ["agent", "mcp", "fastapi", "openai-agents-sdk", "authentication", "frontend", "chat"]
links:
  spec: specs/008-ai-agent-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/agents/mcp/mcp_tools.py
  - backend/src/agents/api/schemas.py
  - backend/src/api/v1/router.py
  - backend/src/agents/core/runner.py
  - backend/src/services/conversation_service.py
  - backend/src/services/message_service.py
  - backend/src/agents/api/agent_handler.py
  - backend/src/agents/api/agent_routes.py
  - backend/tests/agents/test_mcp_tools.py
  - backend/tests/agents/test_message_service.py
  - backend/tests/agents/test_conversation_service.py
  - backend/tests/agents/test_agent_api.py
  - frontend/app/dashboard/page.tsx
  - frontend/components/chat/ChatWidget.tsx
  - frontend/lib/api/chat.ts
  - frontend/lib/hooks/useChatMessages.ts
tests:
  - backend/tests/agents/test_mcp_tools.py (T010, T013, T018, T020)
  - backend/tests/agents/test_message_service.py (T015, T016, T025)
  - backend/tests/agents/test_conversation_service.py (T022)
  - backend/tests/agents/test_agent_api.py (T011, T012, T014, T017, T019, T021, T023, T024)
---

## Prompt

Implement the tasks defined for spec 008-ai-agent-integration.

Follow the official Phase III hackathon architecture and stateless request cycle:

1. Authenticate the request.
2. Receive the user message.
3. Load conversation history from the database.
4. Store the user message.
5. Run the agent with MCP tools.
6. Execute any task operations via MCP.
7. Store the assistant response.
8. Return the response to the client.

Additionally, fix a 401 Unauthorized error in HuggingFace deployment logs:
- Frontend was calling `/api/8/chat` (corrupted userId from parseInt) with no Authorization header.

## Response snapshot

### Backend Implementation (25 tasks completed, 25/25 tests passing)

**MCP Tools** (`backend/src/agents/mcp/mcp_tools.py`):
- Changed `task_id: int` → `task_id: str` in `complete_task`, `update_task`, `delete_task` so UUID strings from the LLM aren't rejected.

**Schemas** (`backend/src/agents/api/schemas.py`):
- Changed `tool_calls: Optional[List[...]] = None` → `tool_calls: List[...] = Field(default_factory=list)` so response always returns `[]`, never `null`.

**Runner** (`backend/src/agents/core/runner.py`):
- Introduced `AgentRunResult(response_text, tool_calls)` dataclass.
- `run_agent()` calls `Runner.run()`, extracts `ToolCallItem`/`ToolCallOutputItem` from `result.new_items` to build the tool_calls list.

**Services** (new files):
- `conversation_service.py`: `get_or_create_conversation(db, user_id, conversation_id)` — creates new conversation or validates ownership of existing one (403/404).
- `message_service.py`: `load_conversation_history(db, conversation_id, limit)` returns oldest-first list; `persist_message(db, ...)` inserts and returns message ID.

**Agent Handler** (`agent_handler.py`): Full stateless cycle replacing TODO stubs — load history → persist user msg → run agent → persist assistant msg → return ChatResponse.

**Agent Routes** (`agent_routes.py`): Added `Depends(get_current_user_with_path_validation)` and `Depends(get_session)`; empty message → 400.

**Router** (`api/v1/router.py`): Agent router included with no prefix so path is `/api/{user_id}/chat` matching frontend calls.

### Frontend Fix (401 Unauthorized)

**Root cause 1** (`dashboard/page.tsx`): `parseInt(user.id, 10)` converted Better Auth string ID `"8GBiKeunGmj00FfgOWVgYugezllW1p5q"` to `8`. Fixed: `const userId = user?.id ?? null`.

**Root cause 2** (`chat.ts`): No `Authorization` header in fetch. Fixed: import `TokenStorage` and add `Authorization: Bearer ${token}` header.

**Type updates**: `ChatWidget.tsx` and `useChatMessages.ts` updated `userId: number` → `userId: string`.

### Test Fixes
- `expire_on_commit=False` on test `AsyncSession` to prevent MissingGreenlet after commit.
- `ToolContext(tool_arguments=...)` required field added to test helper.
- `import jwt` (PyJWT) instead of `from jose import jwt` for test token generation.
- Reverted router prefix from `/v1/agent` back to no-prefix after 404 in deployment.

## Outcome

- ✅ Impact: Full stateless AI chat endpoint implemented and integrated; 25 backend tests passing; frontend correctly authenticates chat requests with Bearer token and passes correct string user ID.
- 🧪 Tests: 25/25 passing — 4 unit test files covering MCP tools, message service, conversation service, and API integration.
- 📁 Files: 16 files modified/created across backend services, routes, tests, and frontend chat components.
- 🔁 Next prompts: Deploy and verify end-to-end chat in HuggingFace; test multi-turn conversation with real LLM.
- 🧠 Reflection: Key insight — test JWT library must match backend JWT library (PyJWT not jose). FunctionTool must be called via `on_invoke_tool(ctx, json_str)` not direct call. Always check frontend URL construction and auth headers before backend debugging.

## Evaluation notes (flywheel)

- Failure modes observed: jose/PyJWT mismatch in tests; parseInt corrupting Better Auth string IDs; missing Authorization header; router prefix mismatch causing 404.
- Graders run and results (PASS/FAIL): pytest backend/tests/agents/ — 25 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Verify HuggingFace deployment end-to-end with real OpenRouter LLM call.
