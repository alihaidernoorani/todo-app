# Implementation Plan: AI Agent Integration

**Branch**: `003-ai-todo-chatbot` | **Date**: 2026-02-13 | **Spec**: [spec.md](./spec.md)
**Scope**: Hackathon — stateless endpoint, DB-backed conversation history, complete JSON response
**SDK Verified**: All patterns verified against OpenAI Agents SDK v0.x official documentation

## Summary

Wire the existing OpenAI Agents SDK scaffold to deliver a working chat endpoint:
1. Authenticate via JWT at `POST /api/v1/agent/{user_id}/chat`
2. Load conversation history from PostgreSQL on each request
3. Persist user and assistant messages to the database
4. Run the agent with MCP tools for all task operations
5. Return `agent_response` + `tool_calls` list as complete JSON

The MCP tools, BackendClient, agent config, and Conversation/Message DB models are **already implemented**. This plan closes the remaining gaps only.

## Technical Context

| Item | Value |
|------|-------|
| Language | Python 3.13+ |
| Agent Framework | OpenAI Agents SDK — `Runner.run(agent, input_list, context=dict)` |
| LLM Provider | OpenRouter (OpenAI-compatible) |
| Auth | Better Auth JWT — `get_current_user_with_path_validation` (already implemented) |
| Endpoint | `POST /api/v1/agent/{user_id}/chat` |
| Conversation History | List of dicts `[{"role": "user"|"assistant", "content": "..."}]` — confirmed SDK format |
| DB | Neon PostgreSQL; `Conversation` + `Message` SQLModel tables (already exist) |
| Response | Complete JSON (no streaming) |
| Testing | pytest + pytest-asyncio |

## SDK-Verified Patterns

The following SDK patterns are confirmed correct by official documentation:

```python
# 1. Run agent with conversation history (list of dicts is valid SDK input)
result = await Runner.run(
    agent,
    [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}],
    context={"mcp_client": client, "user_id": "abc"},
)
response_text = result.final_output  # str

# 2. Extract tool calls from result (confirmed SDK API)
from agents.items import ToolCallItem, ToolCallOutputItem

tool_calls = []
for item in result.new_items:
    if isinstance(item, ToolCallItem):
        tool_calls.append({
            "tool_name": item.raw_item.name,
            "arguments": item.raw_item.arguments or {},
            "result": {},
        })
    elif isinstance(item, ToolCallOutputItem) and tool_calls:
        import json
        output = item.output  # str
        try:
            tool_calls[-1]["result"] = json.loads(output)
        except Exception:
            tool_calls[-1]["result"] = {"output": str(output)}

# 3. @function_tool with context (confirmed SDK pattern)
@function_tool
async def my_tool(ctx: RunContextWrapper[Any], param: str) -> dict:
    value = ctx.context.get("my_key")  # access shared context
```

## Constitution Check

✅ **I. Multi-Tier Isolation**: Agent code in `/backend/src/agents/`
✅ **II. Persistence First**: Messages persisted to `conversations` / `messages` tables per request
✅ **III. Secure by Design**: JWT required; path `user_id` validated against JWT `sub`; propagated to all MCP tool calls
✅ **VI. API Contract Enforcement**: Agent calls backend via MCP tools only (no direct DB for task CRUD)
✅ **VII. Agent-First Architecture**: OpenAI Agents SDK + `Runner.run()`
✅ **VIII. MCP Tool-Based System Design**: 5 tools (add/list/complete/update/delete task)
✅ **IX. Stateless Backend**: No in-memory session; context reconstructed from DB per request
✅ **XIII. Tool Observability**: `tool_calls` list returned in every response

## Current Implementation State

### Implemented ✅ (do not re-implement)

| File | What exists |
|------|-------------|
| `src/agents/core/agent.py` | `create_task_agent()` — 5 tools configured |
| `src/agents/mcp/mcp_tools.py` | 5 `@function_tool` with `RunContextWrapper` — context access correct |
| `src/agents/core/runner.py` | `run_agent()` using `Runner.run()` — returns `(str, result)` |
| `src/agents/core/conversation_handler.py` | `build_conversation_history()` — DB dicts → SDK list format |
| `src/agents/config/agent_config.py` | System prompt, `MAX_HISTORY_MESSAGES=20` |
| `src/mcp/client/backend_client.py` | HTTP client wrapping all 5 REST task endpoints |
| `src/models/conversation.py` | `Conversation(id, user_id: str, created_at, updated_at)` |
| `src/models/message.py` | `Message(id, conversation_id, user_id: str, role, content, created_at)` |
| `src/auth/dependencies.py` | `get_current_user_with_path_validation` — validates JWT AND path `user_id` match |

### Gaps to Fix ❌

| # | Gap | File | Impact |
|---|-----|------|--------|
| 1 | No JWT auth on route; `user_id: int` | `agent_routes.py` | Unauthenticated access; type error |
| 2 | `_load_conversation_history()` stub | `agent_handler.py` | Always `[]` — no context |
| 3 | `_persist_messages()` stub | `agent_handler.py` | Mock IDs — nothing saved |
| 4 | No `tool_calls` extracted | `runner.py`, `agent_handler.py` | FR-024 violated |
| 5 | No new conversation created | `agent_handler.py` | FR-025 violated |
| 6 | `task_id: int` in MCP tools | `mcp_tools.py` | Runtime crash — needs UUID string |

---

## Conversation Flow

```
POST /api/v1/agent/{user_id}/chat
  Authorization: Bearer <jwt>
  Body: {"message": "...", "conversation_id": null | int}

  [1] JWT validation → verify token, check path user_id == JWT sub → 401/403 if fails
  [2] Parse + validate request body (message non-empty)
  [3] conversation_id == null  → INSERT Conversation(user_id) → get new conversation.id
      conversation_id == int   → SELECT Conversation, verify owner → 403/404 if wrong
  [4] SELECT last 20 Messages WHERE conversation_id=X ORDER BY created_at DESC
      → reverse → build [{"role": ..., "content": ...}, ...] list
  [5] INSERT Message(conversation_id, user_id, role="user", content=message) → user_msg_id
  [6] context = {"mcp_client": BackendClient(), "user_id": user_id}
      input = history + [{"role": "user", "content": message}]
  [7] result = await Runner.run(agent, input, context=context)
      → agent calls MCP tools as needed (add_task, list_tasks, etc.)
  [8] response_text = result.final_output
      tool_calls = extract from result.new_items (ToolCallItem, ToolCallOutputItem)
  [9] INSERT Message(conversation_id, user_id, role="assistant", content=response_text) → agent_msg_id
  [10] Return AgentChatResponse(conversation_id, user_msg_id, agent_msg_id, response_text, tool_calls)
```

---

## Implementation Steps

> Dependency-ordered. Each step has file targets, exact changes, and acceptance checks.

---

### Step 1 — Fix `task_id` type in MCP tools (`int` → `str`)

**Target**: `backend/src/agents/mcp/mcp_tools.py`

**Why first**: Blocks all integration tests — LLM passes UUID strings from `list_tasks` output but functions declare `int`.

**Change**:
```python
# Before
async def complete_task(ctx: RunContextWrapper[Any], task_id: int) -> dict:
async def update_task(ctx: RunContextWrapper[Any], task_id: int, ...) -> dict:
async def delete_task(ctx: RunContextWrapper[Any], task_id: int) -> dict:

# After
async def complete_task(ctx: RunContextWrapper[Any], task_id: str) -> dict:
    """...task_id: UUID string returned by list_tasks (e.g. '3f8a-...')"""
async def update_task(ctx: RunContextWrapper[Any], task_id: str, ...) -> dict:
async def delete_task(ctx: RunContextWrapper[Any], task_id: str) -> dict:
```

**Acceptance**: `complete_task(ctx, task_id="uuid-string")` calls `BackendClient.complete_task(user_id, "uuid-string")` without `TypeError`.

---

### Step 2 — Implement `conversation_service.py`

**Target**: `backend/src/services/conversation_service.py` (new)

```python
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from fastapi import HTTPException, status
from src.models.conversation import Conversation

async def get_or_create_conversation(
    db: AsyncSession,
    user_id: str,
    conversation_id: int | None,
) -> Conversation:
    if conversation_id is None:
        conversation = Conversation(user_id=user_id)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    result = await db.exec(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conversation.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied: conversation belongs to another user")

    return conversation
```

**Acceptance**:
- `conversation_id=None` → new row in `conversations` with non-null `id`
- Existing conversation with wrong owner → 403
- Non-existent `conversation_id` → 404

---

### Step 3 — Implement `message_service.py`

**Target**: `backend/src/services/message_service.py` (new)

```python
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.message import Message

async def load_conversation_history(
    db: AsyncSession,
    conversation_id: int,
    limit: int = 20,
) -> list[dict]:
    """Load last `limit` messages ordered oldest-first (correct order for agent history)."""
    result = await db.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.all()))
    return [
        {
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]


async def persist_message(
    db: AsyncSession,
    conversation_id: int,
    user_id: str,
    role: str,
    content: str,
) -> int:
    """Insert a message row and return its ID."""
    message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message.id
```

**Acceptance**:
- New conversation → `load_conversation_history()` returns `[]`
- 25 messages → returns 20, oldest-first order
- `persist_message()` returns integer `id`; row exists in DB after call

---

### Step 4 — Update `runner.py` to extract `tool_calls`

**Target**: `backend/src/agents/core/runner.py`

**SDK-confirmed pattern** (using `isinstance` checks with imported item types):

```python
import json
from dataclasses import dataclass, field
from agents.items import ToolCallItem, ToolCallOutputItem

@dataclass
class AgentRunResult:
    response_text: str
    tool_calls: list[dict] = field(default_factory=list)


async def run_agent(
    user_message: str,
    conversation_history: list[dict] | None = None,
    context: dict | None = None,
) -> AgentRunResult:
    if not context or "mcp_client" not in context or "user_id" not in context:
        raise ValueError("Context must contain mcp_client and user_id")

    agent = create_task_agent()
    history = conversation_history or []

    # Append current user message — confirmed SDK format
    messages = history + [{"role": "user", "content": user_message}]

    logger.info(f"Running agent: {len(history)} history messages + current message")

    result = await Runner.run(agent, messages, context=context)

    # Extract tool calls — confirmed SDK API (result.new_items, ToolCallItem, ToolCallOutputItem)
    tool_calls = []
    for item in result.new_items:
        if isinstance(item, ToolCallItem):
            tool_calls.append({
                "tool_name": item.raw_item.name,
                "arguments": item.raw_item.arguments or {},
                "result": {},
            })
        elif isinstance(item, ToolCallOutputItem) and tool_calls:
            # item.output is a str — parse JSON if possible
            output = item.output
            try:
                tool_calls[-1]["result"] = json.loads(output) if isinstance(output, str) else output
            except (json.JSONDecodeError, TypeError):
                tool_calls[-1]["result"] = {"output": str(output)}

    logger.info(f"Agent complete: response={result.final_output[:80]!r}, tool_calls={len(tool_calls)}")

    return AgentRunResult(
        response_text=result.final_output,
        tool_calls=tool_calls,
    )
```

**Acceptance**:
- "Add task to buy milk" → `tool_calls` has 1 entry: `{"tool_name": "add_task", "arguments": {"title": "buy milk"}, "result": {...}}`
- Greeting with no tool use → `tool_calls == []`
- `result.final_output` is non-empty string

---

### Step 5 — Wire DB services into `agent_handler.py`

**Target**: `backend/src/agents/api/agent_handler.py`

Replace both `TODO` stubs with real service calls:

```python
from sqlmodel.ext.asyncio.session import AsyncSession
from src.services.conversation_service import get_or_create_conversation
from src.services.message_service import load_conversation_history, persist_message
from src.agents.core.conversation_handler import build_conversation_history
from src.agents.core.runner import run_agent, AgentRunResult
from src.agents.api.schemas import AgentChatRequest, AgentChatResponse, ToolCallInfo


class AgentRequestHandler:

    def __init__(self, backend_base_url: str = None):
        self.backend_base_url = backend_base_url or os.getenv(
            "BACKEND_BASE_URL", "http://localhost:8000"
        )

    async def process_chat_request(
        self,
        user_id: str,
        request: AgentChatRequest,
        db: AsyncSession,
    ) -> AgentChatResponse:

        # [3] Get or create conversation
        conversation = await get_or_create_conversation(db, user_id, request.conversation_id)

        # [4] Load conversation history from DB
        raw_messages = await load_conversation_history(db, conversation.id)
        conversation_history = build_conversation_history(raw_messages)

        # [5] Persist user message BEFORE running agent
        user_msg_id = await persist_message(db, conversation.id, user_id, "user", request.message)

        # [6] + [7] Run agent with MCP tools
        async with BackendClient(self.backend_base_url) as mcp_client:
            context = {"mcp_client": mcp_client, "user_id": user_id}
            run_result: AgentRunResult = await run_agent(
                user_message=request.message,
                conversation_history=conversation_history,
                context=context,
            )

        # [9] Persist assistant response
        agent_msg_id = await persist_message(
            db, conversation.id, user_id, "assistant", run_result.response_text
        )

        # [10] Return response
        return AgentChatResponse(
            conversation_id=conversation.id,
            user_message_id=user_msg_id,
            agent_message_id=agent_msg_id,
            agent_response=run_result.response_text,
            tool_calls=[
                ToolCallInfo(
                    tool_name=tc["tool_name"],
                    arguments=tc["arguments"],
                    result=tc["result"],
                )
                for tc in run_result.tool_calls
            ],
        )
```

**Acceptance**:
- 2 new `messages` rows after each turn
- Second turn with same `conversation_id` has prior messages in history
- `conversation.id` consistent in response

---

### Step 6 — Add JWT auth + DB session to agent route

**Target**: `backend/src/agents/api/agent_routes.py`

```python
from typing import Annotated
from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.agents.api.schemas import AgentChatRequest, AgentChatResponse
from src.agents.api.agent_handler import AgentRequestHandler
from src.agents.api.serializers import format_error_response
from src.auth.dependencies import get_current_user_with_path_validation
from src.auth.models import AuthenticatedUser
from src.database import get_db  # existing session dependency

router = APIRouter(tags=["agent"])


@router.post("/{user_id}/chat", response_model=AgentChatResponse, status_code=200)
async def agent_chat(
    user_id: str,
    request: AgentChatRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AgentChatResponse:
    """POST /api/v1/agent/{user_id}/chat — process a natural language task management request."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    try:
        handler = AgentRequestHandler()
        return await handler.process_chat_request(user_id, request, db)

    except HTTPException:
        raise  # Re-raise 403/404 from conversation_service

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Agent chat failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=format_error_response(
                "Agent is currently unavailable. Please try again later.", 500
            )
        )


@router.get("/health", status_code=200)
async def health_check():
    return {"status": "healthy", "service": "agent-chat"}
```

**Why `get_current_user_with_path_validation`**: Existing dependency that (1) validates JWT signature, (2) extracts `user_id` from `sub` claim, (3) checks path `{user_id}` matches JWT `sub` — returns 403 if mismatch. This is exactly what's needed without duplicating auth logic.

**Acceptance**:
- No `Authorization` header → 401
- JWT `sub` ≠ path `{user_id}` → 403
- Valid JWT matching path → `process_chat_request` called with `user_id: str`

---

### Step 7 — Update `AgentChatResponse` schema

**Target**: `backend/src/agents/api/schemas.py`

Ensure `tool_calls` defaults to empty list (never `null`):

```python
class AgentChatResponse(BaseModel):
    conversation_id: int
    user_message_id: int
    agent_message_id: int
    agent_response: str = Field(..., min_length=1, max_length=5000)
    tool_calls: list[ToolCallInfo] = Field(
        default_factory=list,
        description="MCP tools invoked this turn (empty list if none)"
    )
```

**Acceptance**: Response always has `"tool_calls": [...]`, never `null`.

---

### Step 8 — Verify router prefix

**Target**: `backend/src/main.py` or `backend/src/api/v1/router.py`

Verify or add:
```python
from src.agents.api.agent_routes import router as agent_router
app.include_router(agent_router, prefix="/api/v1/agent")
# → POST /api/v1/agent/{user_id}/chat
```

**Acceptance**: `GET /api/v1/agent/health` → `{"status": "healthy"}`.

---

### Step 9 — Tests

**Target**: `backend/tests/agents/`

#### `test_mcp_tools.py`
```python
async def test_complete_task_accepts_uuid_string(mock_mcp_client):
    ctx = build_mock_context(mcp_client=mock_mcp_client, user_id="user-1")
    await complete_task(ctx, task_id="3f8a2b-uuid")
    mock_mcp_client.complete_task.assert_called_with(user_id="user-1", task_id="3f8a2b-uuid")

async def test_add_task_raises_on_client_error(mock_mcp_client):
    mock_mcp_client.create_task.side_effect = BackendClientError("Network error")
    with pytest.raises(BackendClientError):
        await add_task(build_mock_context(mcp_client=mock_mcp_client, user_id="u1"), title="test")
```

#### `test_conversation_service.py`
```python
async def test_creates_new_conversation(db):
    conv = await get_or_create_conversation(db, user_id="user-1", conversation_id=None)
    assert conv.id is not None and conv.user_id == "user-1"

async def test_returns_403_for_wrong_owner(db, existing_conv):
    with pytest.raises(HTTPException) as exc:
        await get_or_create_conversation(db, user_id="user-2", conversation_id=existing_conv.id)
    assert exc.value.status_code == 403

async def test_returns_404_for_missing(db):
    with pytest.raises(HTTPException) as exc:
        await get_or_create_conversation(db, user_id="user-1", conversation_id=99999)
    assert exc.value.status_code == 404
```

#### `test_message_service.py`
```python
async def test_load_empty_for_new_conversation(db, conversation):
    assert await load_conversation_history(db, conversation.id) == []

async def test_load_returns_last_20_of_25(db, conversation_with_25_messages):
    history = await load_conversation_history(db, conversation_with_25_messages.id)
    assert len(history) == 20
    assert history[0]["role"] in ("user", "assistant")  # oldest-first

async def test_persist_message_returns_id(db, conversation):
    msg_id = await persist_message(db, conversation.id, "user-1", "user", "Hello")
    assert isinstance(msg_id, int) and msg_id > 0
```

#### `test_agent_api.py`
```python
async def test_requires_auth(client):
    resp = await client.post("/api/v1/agent/user-1/chat", json={"message": "hi"})
    assert resp.status_code == 401

async def test_rejects_wrong_user_id_in_path(client, auth_headers_user_a):
    resp = await client.post("/api/v1/agent/user-B/chat",
                             json={"message": "hi"}, headers=auth_headers_user_a)
    assert resp.status_code == 403

async def test_creates_new_conversation_on_null_id(client, auth_headers):
    resp = await client.post("/api/v1/agent/user-1/chat",
                             json={"message": "Add task buy milk", "conversation_id": None},
                             headers=auth_headers)
    body = resp.json()
    assert resp.status_code == 200
    assert isinstance(body["conversation_id"], int)
    assert body["agent_response"] != ""
    assert isinstance(body["tool_calls"], list)

async def test_second_turn_uses_history(client, auth_headers, existing_conversation):
    resp = await client.post("/api/v1/agent/user-1/chat",
                             json={"message": "What tasks do I have?",
                                   "conversation_id": existing_conversation.id},
                             headers=auth_headers)
    assert resp.status_code == 200

async def test_tool_calls_empty_list_for_chitchat(client, auth_headers):
    resp = await client.post("/api/v1/agent/user-1/chat",
                             json={"message": "Hello!", "conversation_id": None},
                             headers=auth_headers)
    assert resp.json()["tool_calls"] == []

async def test_messages_persisted_after_turn(client, auth_headers, db):
    resp = await client.post("/api/v1/agent/user-1/chat",
                             json={"message": "hi", "conversation_id": None},
                             headers=auth_headers)
    conv_id = resp.json()["conversation_id"]
    history = await load_conversation_history(db, conv_id)
    assert len(history) == 2  # user + assistant
```

---

## API Contract

### `POST /api/v1/agent/{user_id}/chat`

**Auth**: `Authorization: Bearer <jwt>` — JWT `sub` must equal path `{user_id}`

**Request**:
```json
{ "message": "Add a task to buy groceries", "conversation_id": null }
```

**Response 200**:
```json
{
  "conversation_id": 42,
  "user_message_id": 101,
  "agent_message_id": 102,
  "agent_response": "I've added 'buy groceries' to your task list.",
  "tool_calls": [
    {
      "tool_name": "add_task",
      "arguments": { "title": "buy groceries" },
      "result": { "id": "uuid-...", "title": "buy groceries", "is_completed": false }
    }
  ]
}
```

**Error codes**:

| Code | Condition |
|------|-----------|
| 400 | Empty/missing message |
| 401 | Missing or invalid JWT |
| 403 | JWT sub ≠ path user_id, or conversation belongs to another user |
| 404 | conversation_id not found |
| 500 | Agent execution failure |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/conversation_service.py` | `get_or_create_conversation()` |
| `src/services/message_service.py` | `load_conversation_history()`, `persist_message()` |
| `tests/agents/test_mcp_tools.py` | MCP tool unit tests |
| `tests/agents/test_conversation_service.py` | Service tests |
| `tests/agents/test_message_service.py` | Service tests |
| `tests/agents/test_agent_api.py` | End-to-end API tests |

## Files to Modify

| File | Change |
|------|--------|
| `src/agents/mcp/mcp_tools.py` | `task_id: int` → `task_id: str` (Step 1) |
| `src/agents/core/runner.py` | Extract `tool_calls` from `result.new_items` (Step 4) |
| `src/agents/api/agent_handler.py` | Replace stubs with DB service calls (Step 5) |
| `src/agents/api/agent_routes.py` | Add JWT auth + DB session (Step 6) |
| `src/agents/api/schemas.py` | `tool_calls` defaults to `[]` (Step 7) |

---

**Plan Status**: ✅ Ready for `/sp.tasks`
**SDK Verification**: All patterns confirmed against official OpenAI Agents SDK documentation
**Endpoint**: `POST /api/v1/agent/{user_id}/chat`
