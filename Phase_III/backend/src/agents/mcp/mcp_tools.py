"""MCP function tools for OpenAI Agents SDK.

This module defines @function_tool decorated async functions that wrap MCP tool calls.
Per OpenAI Agents SDK patterns, tools receive context via RunContextWrapper to access
the MCP client and user_id.
"""

from typing import Any, Optional
from agents import function_tool, RunContextWrapper
import logging

logger = logging.getLogger(__name__)


@function_tool
async def add_task(
    ctx: RunContextWrapper[Any],
    title: str,
    description: Optional[str] = None,
) -> dict:
    """Create a new task with title and optional description.

    Args:
        title: The task title (required)
        description: Optional task description

    Returns:
        dict: Created task with id (UUID), title, description, is_completed, priority, created_at, user_id

    Example:
        User: "Add a task to buy groceries"
        Tool call: add_task(title="buy groceries")
    """
    try:
        # Get MCP client and user_id from context
        mcp_client = ctx.context.get("mcp_client")
        user_id = ctx.context.get("user_id")

        if not mcp_client:
            raise ValueError("MCP client not found in context")
        if user_id is None:
            raise ValueError("user_id not found in context")

        logger.info(f"add_task: title={title}, user_id={user_id}")

        # Call BackendClient method
        result = await mcp_client.create_task(
            user_id=str(user_id),
            title=title,
            description=description,
        )

        logger.info(f"add_task success: id={result.get('id')}")
        return result

    except Exception as e:
        logger.error(f"add_task failed: {str(e)}")
        raise


@function_tool
async def list_tasks(
    ctx: RunContextWrapper[Any],
    status: Optional[str] = None,
) -> dict:
    """Retrieve tasks with optional status filtering.

    Args:
        status: Optional filter - "all", "pending", or "completed" (default: all)

    Returns:
        dict: List of tasks with their details

    Example:
        User: "Show me my pending tasks"
        Tool call: list_tasks(status="pending")
    """
    try:
        # Get MCP client and user_id from context
        mcp_client = ctx.context.get("mcp_client")
        user_id = ctx.context.get("user_id")

        if not mcp_client:
            raise ValueError("MCP client not found in context")
        if user_id is None:
            raise ValueError("user_id not found in context")

        logger.info(f"list_tasks: status={status}, user_id={user_id}")

        # Call BackendClient method
        result = await mcp_client.list_tasks(
            user_id=str(user_id),
            status=status or "all",
        )

        task_count = len(result.get('items', result.get('tasks', [])))
        logger.info(f"list_tasks success: found {task_count} tasks")
        return result

    except Exception as e:
        logger.error(f"list_tasks failed: {str(e)}")
        raise


@function_tool
async def complete_task(
    ctx: RunContextWrapper[Any],
    task_id: str,
) -> dict:
    """Mark a task as complete by ID.

    Args:
        task_id: The task UUID string returned by list_tasks (e.g. '3f8a2b-uuid-string')

    Returns:
        dict: Updated task with id (UUID), title, is_completed=True, priority, updated_at

    Example:
        User: "Mark task 123 as done"
        Tool call: complete_task(task_id="3f8a2b-uuid-string")
    """
    try:
        # Get MCP client and user_id from context
        mcp_client = ctx.context.get("mcp_client")
        user_id = ctx.context.get("user_id")

        if not mcp_client:
            raise ValueError("MCP client not found in context")
        if user_id is None:
            raise ValueError("user_id not found in context")

        logger.info(f"complete_task: task_id={task_id}, user_id={user_id}")

        # Call BackendClient method
        result = await mcp_client.complete_task(
            user_id=str(user_id),
            task_id=task_id,
        )

        logger.info(f"complete_task success: id={result.get('id')}")
        return result

    except Exception as e:
        logger.error(f"complete_task failed: {str(e)}")
        raise


@function_tool
async def update_task(
    ctx: RunContextWrapper[Any],
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> dict:
    """Update task title and/or description by ID.

    Args:
        task_id: The task UUID string returned by list_tasks (e.g. '3f8a2b-uuid-string')
        title: Optional new title
        description: Optional new description

    Returns:
        dict: Updated task with id (UUID), title, description, is_completed, priority

    Example:
        User: "Change task 123 title to 'Buy almond milk'"
        Tool call: update_task(task_id=123, title="Buy almond milk")
    """
    try:
        # Get MCP client and user_id from context
        mcp_client = ctx.context.get("mcp_client")
        user_id = ctx.context.get("user_id")

        if not mcp_client:
            raise ValueError("MCP client not found in context")
        if user_id is None:
            raise ValueError("user_id not found in context")

        logger.info(f"update_task: task_id={task_id}, user_id={user_id}")

        # Call BackendClient method
        result = await mcp_client.update_task(
            user_id=str(user_id),
            task_id=task_id,
            title=title,
            description=description,
        )

        logger.info(f"update_task success: id={result.get('id')}")
        return result

    except Exception as e:
        logger.error(f"update_task failed: {str(e)}")
        raise


@function_tool
async def delete_task(
    ctx: RunContextWrapper[Any],
    task_id: str,
) -> dict:
    """Delete a task by ID.

    Args:
        task_id: The task UUID string returned by list_tasks (e.g. '3f8a2b-uuid-string')

    Returns:
        dict: Deletion confirmation with success=True and message

    Example:
        User: "Delete task 123"
        Tool call: delete_task(task_id=123)
    """
    try:
        # Get MCP client and user_id from context
        mcp_client = ctx.context.get("mcp_client")
        user_id = ctx.context.get("user_id")

        if not mcp_client:
            raise ValueError("MCP client not found in context")
        if user_id is None:
            raise ValueError("user_id not found in context")

        logger.info(f"delete_task: task_id={task_id}, user_id={user_id}")

        # Call BackendClient method
        result = await mcp_client.delete_task(
            user_id=str(user_id),
            task_id=task_id,
        )

        logger.info(f"delete_task success: {result.get('message')}")
        return result

    except Exception as e:
        logger.error(f"delete_task failed: {str(e)}")
        raise


# Export all tools for easy import
__all__ = [
    "add_task",
    "list_tasks",
    "complete_task",
    "update_task",
    "delete_task",
]
