---
id: "0037"
title: Fix list_tasks priority param and DB connection timeout
stage: green
date: 2026-04-26
surface: agent
model: claude-sonnet-4-6
feature: 003-auth-security
branch: 012-oauth-social-login
user: Ali Haider Noorani
command: direct fix
labels: ["bugfix","backend","database","mcp","agent"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/mcp/client/backend_client.py
  - backend/src/agents/api/agent_handler.py
tests:
  - null
---

## Prompt

The Problem
Your application is crashing because of a mismatch in code and a database timeout.

Code Mismatch: Your mcp_tools.py is trying to send a priority filter to the list_tasks function, but that function isn't programmed to accept it.

Database Timeout: While the application was stuck or crashing on that tool error, it left a database transaction "hanging" for too long. PostgreSQL eventually got tired of waiting and forcibly closed the connection.

The Solution
Update the Method: Go to your BackendClient class and update the list_tasks definition to include priority=None as an argument.

Close Transactions Faster: Ensure you commit your database changes (like saving messages) before calling external AI or MCP tools. This prevents the database from timing out if the external tool takes too long or fails.

Restart Services: After fixing the code, restart your backend and database connection pool to clear the "Idle" errors.

## Response snapshot

Two targeted fixes applied:

1. `backend_client.py` — `BackendClient.list_tasks()` signature expanded to include all parameters that `mcp_tools.py` was already passing: `priority`, `tags`, `search`, `sort_by`, `sort_order`, `page`, `page_size`. Each is forwarded as an HTTP query param to the backend REST API (`/api/{user_id}/tasks`), which already supported all of them.

2. `agent_handler.py` — Added `await db.close()` immediately after `persist_message()` for the user message (line 86). This releases the physical PostgreSQL connection back to the pool before the long-running agent/MCP call, preventing idle-session and idle-in-transaction timeouts. The SQLAlchemy `AsyncSession` remains valid and reacquires a connection when `persist_message()` is called again for the assistant message.

## Outcome

- ✅ Impact: Eliminates `TypeError: list_tasks() got an unexpected keyword argument 'priority'` crash and prevents PostgreSQL idle-connection timeouts during agent execution
- 🧪 Tests: No new tests added; existing backend tests cover list_tasks filtering
- 📁 Files: backend/src/mcp/client/backend_client.py, backend/src/agents/api/agent_handler.py
- 🔁 Next prompts: Restart backend service to clear any stale connection pool state
- 🧠 Reflection: The mismatch was a straightforward signature gap — BackendClient hadn't been updated when mcp_tools.py was extended with richer filters. The DB fix follows the principle of releasing resources (connections) before yielding to external calls of unknown duration.

## Evaluation notes (flywheel)

- Failure modes observed: TypeError on unexpected keyword argument; PostgreSQL connection killed with idle timeout error
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): Add integration test that calls list_tasks with all filter params end-to-end
