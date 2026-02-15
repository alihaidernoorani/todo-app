"""Unit tests for MCP function tools.

Tests that MCP tools pass correct arguments to BackendClient methods
and accept UUID strings for task_id parameters.

Uses on_invoke_tool(ctx, json.dumps(args)) which is how the SDK calls tools.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock
from agents.tool import ToolContext


def build_tool_context(mcp_client, user_id: str, tool_name: str = "test_tool", tool_arguments: str = "{}") -> ToolContext:
    """Build a ToolContext with mock context for testing."""
    ctx = ToolContext(
        context={"mcp_client": mcp_client, "user_id": user_id},
        tool_name=tool_name,
        tool_call_id="test-call-id",
        tool_arguments=tool_arguments,
    )
    return ctx


# ── T010 [US1] ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_add_task_calls_backend_client():
    """T010: add_task calls BackendClient.create_task with correct user_id and title."""
    from src.agents.mcp.mcp_tools import add_task

    mock_client = MagicMock()
    mock_client.create_task = AsyncMock(return_value={"task_id": "uuid-abc", "title": "buy groceries"})

    args = json.dumps({"title": "buy groceries"})
    ctx = build_tool_context(mock_client, "user-1", tool_name="add_task", tool_arguments=args)
    await add_task.on_invoke_tool(ctx, args)

    mock_client.create_task.assert_called_once_with(
        user_id="user-1",
        title="buy groceries",
        description=None,
    )


@pytest.mark.asyncio
async def test_add_task_with_description():
    """add_task passes description when provided."""
    from src.agents.mcp.mcp_tools import add_task

    mock_client = MagicMock()
    mock_client.create_task = AsyncMock(return_value={"task_id": "uuid-xyz"})

    args = json.dumps({"title": "buy milk", "description": "2 litres"})
    ctx = build_tool_context(mock_client, "user-2", tool_name="add_task", tool_arguments=args)
    await add_task.on_invoke_tool(ctx, args)

    mock_client.create_task.assert_called_once_with(
        user_id="user-2",
        title="buy milk",
        description="2 litres",
    )


# ── T013 [US3] ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_complete_task_accepts_uuid_string():
    """T013: complete_task accepts UUID string task_id and passes it to BackendClient."""
    from src.agents.mcp.mcp_tools import complete_task

    mock_client = MagicMock()
    mock_client.complete_task = AsyncMock(
        return_value={"task_id": "3f8a2b-uuid-string", "status": "completed"}
    )

    args = json.dumps({"task_id": "3f8a2b-uuid-string"})
    ctx = build_tool_context(mock_client, "user-1", tool_name="complete_task", tool_arguments=args)
    await complete_task.on_invoke_tool(ctx, args)

    mock_client.complete_task.assert_called_once_with(
        user_id="user-1",
        task_id="3f8a2b-uuid-string",
    )


# ── T018 [US4] ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_task_accepts_uuid_string():
    """T018: update_task accepts UUID string task_id and passes it to BackendClient."""
    from src.agents.mcp.mcp_tools import update_task

    mock_client = MagicMock()
    mock_client.update_task = AsyncMock(
        return_value={"task_id": "uuid-str", "title": "buy almond milk"}
    )

    args = json.dumps({"task_id": "uuid-str", "title": "buy almond milk"})
    ctx = build_tool_context(mock_client, "user-1", tool_name="update_task", tool_arguments=args)
    await update_task.on_invoke_tool(ctx, args)

    mock_client.update_task.assert_called_once_with(
        user_id="user-1",
        task_id="uuid-str",
        title="buy almond milk",
        description=None,
    )


# ── T020 [US5] ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_task_accepts_uuid_string():
    """T020: delete_task accepts UUID string task_id and passes it to BackendClient."""
    from src.agents.mcp.mcp_tools import delete_task

    mock_client = MagicMock()
    mock_client.delete_task = AsyncMock(
        return_value={"task_id": "uuid-str", "deleted": True}
    )

    args = json.dumps({"task_id": "uuid-str"})
    ctx = build_tool_context(mock_client, "user-1", tool_name="delete_task", tool_arguments=args)
    await delete_task.on_invoke_tool(ctx, args)

    mock_client.delete_task.assert_called_once_with(
        user_id="user-1",
        task_id="uuid-str",
    )
