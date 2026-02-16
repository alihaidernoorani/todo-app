---
id: "0006"
title: Implementation Plan AI Agent Integration
stage: plan
date: "2026-02-13"
surface: agent
model: claude-sonnet-4-5-20250929
feature: 008-ai-agent-integration
branch: 003-ai-todo-chatbot
user: alihaidernoorani
command: /sp.plan
labels: ["plan", "ai-agent", "mcp", "chatbot", "streaming", "jwt", "testing"]
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

You are an expert in developing agentic AI chatbots. Create a step-by-step implementation plan based on the clarified 008-ai-agent-integration spec.
Include steps for:

1. Ensuring chat handling works with conversation context.
2. Integrating MCP tool calls using the correct `run_tool` method.
3. Passing `mcp_client` and `user_id` properly.
4. Implementing error handling and logging for tools.
5. Writing automated tests for chat + MCP tool execution.

Output a clear, ordered plan suitable for developers to follow.

## Response snapshot

Read and audited 8 existing agent files. Identified 6 critical implementation gaps. Updated `plan.md` with:

**Implementation state audit:**
- ✅ Implemented: `agent.py`, `mcp_tools.py` (5 tools), `runner.py` (blocking + streaming), `backend_client.py`
- ❌ Gaps: no JWT auth on route, TODO stubs in handler, no streaming endpoint wired, no retry logic, `task_id` type mismatch (int vs UUID), domain restriction missing from system prompt

**8 ordered implementation steps added:**
1. Fix `task_id` type mismatch (int → str/UUID) in `mcp_tools.py`
2. Add single-retry wrapper to all MCP tool calls (≤0.5s delay, FR-017)
3. Enforce domain restriction in agent system prompt (FR-022)
4. Add JWT auth to `/chat` route via `Depends(get_current_user)` (FR-019/020)
5. Implement `conversation_service.py` and `message_service.py` (DB-backed history)
6. Wire DB services into `agent_handler.py` (replace TODO stubs)
7. Implement SSE streaming endpoint `POST /chat/stream` (FR-021)
8. Write test suite: `test_mcp_tools.py`, `test_agent_runner.py`, `test_agent_api.py`

**Constitution conflict flagged:** FR-013 (client-managed history) vs. Constitution §IX (DB-backed). Constitution takes precedence — implementation uses DB.

## Outcome

- ✅ Impact: Plan updated with precise, ordered, developer-ready steps; all 5 user requirements addressed
- 🧪 Tests: 3 test files specified with function-level test cases
- 📁 Files: Phase_III/specs/008-ai-agent-integration/plan.md
- 🔁 Next prompts: `/sp.tasks` to generate actionable task list from this plan; `/sp.adr conversation-context-storage` for the constitution conflict
- 🧠 Reflection: Code audit revealed implementation is ~40% complete; gaps are in auth, DB wiring, streaming, and retry — not in the core agent/tool wiring which works

## Evaluation notes (flywheel)

- Failure modes observed: setup-plan.sh resolves to branch-named feature dir (003-ai-todo-chatbot), not spec number (008); worked around using explicit Phase_III paths
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run `/sp.tasks` targeting the 8 implementation steps as task groups
