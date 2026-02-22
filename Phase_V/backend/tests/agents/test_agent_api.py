"""Integration tests for the agent chat API endpoint.

Tests POST /api/{user_id}/chat covering:
- Authentication (T023)
- Task CRUD via natural language (T011, T012, T014, T019, T021)
- Conversation context (T017)
- Message persistence (T024)
"""

import os
import pytest
from collections.abc import AsyncGenerator
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import ASGITransport, AsyncClient
import jwt
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

# Set test environment before importing app
os.environ.setdefault("NEON_DATABASE_URL", "postgresql://test:test@localhost:5432/test_db")

from src.api.deps import get_session
from src.main import app
from src.models.conversation import Conversation
from src.services.message_service import load_conversation_history

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

TEST_USER_ID = "test-user-agent-001"
OTHER_USER_ID = "other-user-agent-002"


def make_jwt(user_id: str) -> str:
    """Generate a test JWT token using PyJWT (same library as jwt_handler.py uses)."""
    from src.config import get_settings
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": f"{user_id}@test.com",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "iss": settings.better_auth_url,
    }
    secret_key = settings.better_auth_secret or "test-secret-for-agent-tests"
    return jwt.encode(payload, secret_key, algorithm="HS256")


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession]:
    """Create isolated in-memory DB session for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """Create test HTTP client with DB session override."""

    async def override_get_session() -> AsyncGenerator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers() -> dict:
    """Authorization headers for TEST_USER_ID."""
    token = make_jwt(TEST_USER_ID)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user_a() -> dict:
    """Authorization headers for TEST_USER_ID (user A)."""
    token = make_jwt(TEST_USER_ID)
    return {"Authorization": f"Bearer {token}"}


def mock_agent_run(response_text: str = "Done!", tool_calls: list = None):
    """Return a mock AgentRunResult for patching run_agent."""
    from src.agents.core.runner import AgentRunResult
    return AsyncMock(return_value=AgentRunResult(
        response_text=response_text,
        tool_calls=tool_calls or [],
    ))


# ── T023: Auth edge cases ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_requires_auth_header(client: AsyncClient):
    """T023 case 1: No Authorization header → 401."""
    resp = await client.post(
        f"/api/{TEST_USER_ID}/chat",
        json={"message": "hi"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_rejects_wrong_user_id_in_path(client: AsyncClient, auth_headers_user_a: dict):
    """T023 case 2: Valid JWT but path user_id != JWT sub → 403."""
    resp = await client.post(
        f"/api/{OTHER_USER_ID}/chat",
        json={"message": "hi"},
        headers=auth_headers_user_a,
    )
    assert resp.status_code == 403


# ── T011 [US1]: Task creation via natural language ────────────────────────────

@pytest.mark.asyncio
async def test_create_task_via_chat(client: AsyncClient, auth_headers: dict):
    """T011: POST with 'Add a task to buy groceries' returns 200 with tool_calls containing add_task."""
    add_task_tool_call = {
        "tool_name": "add_task",
        "arguments": {"title": "buy groceries"},
        "result": {"task_id": "uuid-abc", "title": "buy groceries"},
    }

    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(
            response_text="I've added 'buy groceries' to your task list.",
            tool_calls=[add_task_tool_call],
        ),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Add a task to buy groceries", "conversation_id": None},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body["conversation_id"], int)
    assert body["agent_response"] != ""
    assert isinstance(body["tool_calls"], list)
    tool_names = [tc["tool_name"] for tc in body["tool_calls"]]
    assert "add_task" in tool_names


# ── T012 [US2]: Task listing ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_tasks_via_chat(client: AsyncClient, auth_headers: dict):
    """T012: 'What tasks do I have?' returns 200 with list_tasks in tool_calls."""
    list_tasks_tool_call = {
        "tool_name": "list_tasks",
        "arguments": {},
        "result": {"tasks": []},
    }

    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(
            response_text="You have no tasks right now.",
            tool_calls=[list_tasks_tool_call],
        ),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "What tasks do I have?"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    tool_names = [tc["tool_name"] for tc in body["tool_calls"]]
    assert "list_tasks" in tool_names
    assert body["agent_response"] != ""


# ── T014 [US3]: Task completion ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_complete_task_via_chat(client: AsyncClient, auth_headers: dict):
    """T014: 'Mark buy groceries as done' returns 200 with complete_task in tool_calls."""
    complete_tool_call = {
        "tool_name": "complete_task",
        "arguments": {"task_id": "uuid-abc"},
        "result": {"task_id": "uuid-abc", "status": "completed"},
    }

    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(
            response_text="I've marked 'buy groceries' as done.",
            tool_calls=[complete_tool_call],
        ),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Mark buy groceries as done"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    tool_names = [tc["tool_name"] for tc in body["tool_calls"]]
    assert "complete_task" in tool_names


# ── T017 [US6]: Multi-turn with DB history ────────────────────────────────────

@pytest.mark.asyncio
async def test_second_turn_uses_db_history(
    client: AsyncClient,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """T017: Second message with same conversation_id returns 200 and DB has 4 rows."""
    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(response_text="Task created."),
    ):
        resp1 = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Create a task to call mom", "conversation_id": None},
            headers=auth_headers,
        )
    assert resp1.status_code == 200
    conv_id = resp1.json()["conversation_id"]
    first_user_msg_id = resp1.json()["user_message_id"]

    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(response_text="Updated to call dad."),
    ):
        resp2 = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Actually, make it call dad instead", "conversation_id": conv_id},
            headers=auth_headers,
        )
    assert resp2.status_code == 200
    body2 = resp2.json()
    assert body2["conversation_id"] == conv_id
    assert body2["user_message_id"] != first_user_msg_id

    # Verify DB has 4 rows (2 turns × 2 messages each)
    history = await load_conversation_history(db_session, conv_id, limit=100)
    assert len(history) == 4


# ── T019 [US4]: Task update ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_task_via_chat(client: AsyncClient, auth_headers: dict):
    """T019: 'Change buy milk to buy almond milk' returns 200 with update_task in tool_calls."""
    update_tool_call = {
        "tool_name": "update_task",
        "arguments": {"task_id": "uuid-milk", "title": "buy almond milk"},
        "result": {"task_id": "uuid-milk", "title": "buy almond milk"},
    }

    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(
            response_text="Updated 'buy milk' to 'buy almond milk'.",
            tool_calls=[update_tool_call],
        ),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Change buy milk to buy almond milk"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    tool_names = [tc["tool_name"] for tc in body["tool_calls"]]
    assert "update_task" in tool_names


# ── T021 [US5]: Task deletion ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_task_via_chat(client: AsyncClient, auth_headers: dict):
    """T021: 'Delete the buy milk task' returns 200 with delete_task in tool_calls."""
    delete_tool_call = {
        "tool_name": "delete_task",
        "arguments": {"task_id": "uuid-milk"},
        "result": {"task_id": "uuid-milk", "deleted": True},
    }

    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(
            response_text="I've deleted the 'buy milk' task.",
            tool_calls=[delete_tool_call],
        ),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Delete the buy milk task"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    tool_names = [tc["tool_name"] for tc in body["tool_calls"]]
    assert "delete_task" in tool_names


# ── T024: Message persistence ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_messages_persisted_after_turn(
    client: AsyncClient,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """T024: After one turn, DB has exactly 2 rows for the conversation (user + assistant)."""
    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(response_text="Hello there!"),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "hi", "conversation_id": None},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    conv_id = resp.json()["conversation_id"]

    history = await load_conversation_history(db_session, conv_id)
    assert len(history) == 2
    roles = [m["role"] for m in history]
    assert "user" in roles
    assert "assistant" in roles


# ── tool_calls always list (never null) ───────────────────────────────────────

@pytest.mark.asyncio
async def test_tool_calls_is_empty_list_for_chitchat(client: AsyncClient, auth_headers: dict):
    """When agent makes no tool calls, response has tool_calls == [] (not null)."""
    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(response_text="Hello! How can I help?", tool_calls=[]),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Hello!", "conversation_id": None},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    assert resp.json()["tool_calls"] == []


# ── Response shape ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_response_has_all_required_fields(client: AsyncClient, auth_headers: dict):
    """Response includes conversation_id, user_message_id, agent_message_id, agent_response, tool_calls."""
    with patch(
        "src.agents.api.agent_handler.run_agent",
        mock_agent_run(response_text="I can help with that."),
    ):
        resp = await client.post(
            f"/api/{TEST_USER_ID}/chat",
            json={"message": "Help me plan my day"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    body = resp.json()
    assert "conversation_id" in body
    assert "user_message_id" in body
    assert "agent_message_id" in body
    assert "agent_response" in body
    assert "tool_calls" in body
    assert isinstance(body["conversation_id"], int)
    assert isinstance(body["user_message_id"], int)
    assert isinstance(body["agent_message_id"], int)
