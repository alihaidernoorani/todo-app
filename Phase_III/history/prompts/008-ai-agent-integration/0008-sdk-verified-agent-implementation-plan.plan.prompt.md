---
id: "0008"
title: SDK-Verified Agent Implementation Plan
stage: plan
date: "2026-02-13"
surface: agent
model: claude-sonnet-4-5-20250929
feature: 008-ai-agent-integration
branch: 003-ai-todo-chatbot
user: alihaidernoorani
command: /sp.plan
labels: ["plan", "ai-agent", "mcp", "openai-agents-sdk", "jwt", "db-persistence", "sdk-verification"]
links:
  spec: Phase_III/specs/008-ai-agent-integration/spec.md
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - Phase_III/specs/008-ai-agent-integration/plan.md
tests:
  - "null"
---

## Prompt

Create a step-by-step implementation plan for spec 008-ai-agent-integration.

Follow the conversation flow:

1. Authenticate request
2. Receive user message
3. Load conversation history from database
4. Store user message
5. Run agent with MCP tools
6. Execute task operations
7. Store assistant response
8. Return response

The plan must cover:

- Agent route authentication
- Conversation persistence
- Agent context construction
- MCP tool integration
- Error handling
- End-to-end testing

Output an ordered developer-ready implementation plan.

Make sure chat endpoint is maintained in the plan: /api/{user_id}/chat

Use the skill to verify that all of the plan is inline with the documentation for OpenAI Agents SDK and MCP Server and that there is no contradiction with the documentation

## Response snapshot

Read plan.md template, audited all agent source files, verified all SDK patterns against official OpenAI Agents SDK documentation via Context7. Wrote complete verified plan.md covering:

**SDK verification results (7 points checked):**
- ✅ `Agent()` with `ModelSettings(max_tokens=...)` — confirmed correct
- ✅ `@function_tool` with `RunContextWrapper[Any]` context access — confirmed correct
- ✅ `Runner.run(agent, list_of_dicts, context=dict)` — confirmed valid SDK format
- ✅ `result.final_output` as str — confirmed correct
- ✅ `isinstance(item, ToolCallItem)` / `isinstance(item, ToolCallOutputItem)` — confirmed; `item.output` is `str` (not dict), requires `json.loads()`
- ⚠️ `Runner.run_streamed()` returns result object not async generator (moot — streaming excluded from hackathon scope)
- ✅ `task_id` must be `str` (UUID), not `int`

**9 ordered implementation steps produced:**
1. Fix `task_id: int` → `task_id: str` in `mcp_tools.py` (runtime crash fix)
2. Create `conversation_service.py` — `get_or_create_conversation()` (FR-025)
3. Create `message_service.py` — `load_conversation_history()` + `persist_message()` (FR-013, FR-023)
4. Update `runner.py` — extract `tool_calls` via `isinstance` checks + `AgentRunResult` dataclass (FR-024)
5. Wire DB services into `agent_handler.py` replacing TODO stubs
6. Add `get_current_user_with_path_validation` + `get_db` to `agent_routes.py` (FR-019/020); keep `user_id: str`
7. Fix `AgentChatResponse.tool_calls` default to `[]` not `None` (SC-012)
8. Verify router prefix at `/api/v1/agent` in `main.py`
9. Write test suite in `tests/agents/` (4 files, 10 test functions)

**Endpoint preserved**: `POST /api/v1/agent/{user_id}/chat`

## Outcome

- ✅ Impact: Plan finalized with all 6 implementation gaps addressed; SDK patterns verified; endpoint constraint preserved; ready for /sp.tasks
- 🧪 Tests: 4 test files specified with 10 function-level test cases covering auth, conversation creation, tool_calls extraction, message persistence
- 📁 Files: Phase_III/specs/008-ai-agent-integration/plan.md (fully rewritten with SDK-verified code)
- 🔁 Next prompts: `/sp.tasks` to generate actionable task list from the 9-step plan
- 🧠 Reflection: SDK verification corrected two subtle issues: (1) `item.output` is str not dict — requires json.loads(); (2) `isinstance(item, ToolCallItem)` preferred over string `.type` comparison for reliability. User explicitly required endpoint `/{user_id}/chat` preserved — plan blocked twice until correction confirmed.

## Evaluation notes (flywheel)

- Failure modes observed: Two plan Write rejections — first for changing endpoint path (removed user_id), second for writing without SDK verification. Both resolved by following user direction: (1) restore /{user_id}/chat, (2) verify via openai-agents-sdk skill + Context7 before writing.
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.tasks targeting 9 implementation steps; verify tasks map correctly to files-to-create and files-to-modify sections in plan.md
