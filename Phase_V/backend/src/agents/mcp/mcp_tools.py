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

        logger.info(f"add_task raw result: {result} success: id={result.get('id')}")
        return result

    except Exception as e:
        logger.error(f"add_task failed: {str(e)}", exc_info=True)
        raise


@function_tool
async def list_tasks(
    ctx: RunContextWrapper[Any],
    status: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[list[str]] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 50,
) -> dict:
    """Retrieve tasks with rich filtering.

    T060: Supports all filter parameters. When results are empty, the agent
    should respond conversationally (e.g. "No high-priority tasks found. Want to see all tasks?").

    Args:
        status: "pending" | "completed" | None (all)
        priority: "High" | "Medium" | "Low" | None
        tags: List of tag names (AND semantics — task must have all listed tags)
        search: Full-text search in title and description
        sort_by: "created_at" | "priority" | "title" (default: created_at)
        sort_order: "asc" | "desc" (default: desc)
        page: 1-based page number (default: 1)
        page_size: Results per page, 1–200 (default: 50)

    Returns:
        dict: {items: [...], count: int} with task details

    Examples:
        User: "Show me my pending tasks"
        Tool call: list_tasks(status="pending")

        User: "Show me high-priority work tasks"
        Tool call: list_tasks(priority="High", tags=["work"])

        User: "Find tasks about groceries"
        Tool call: list_tasks(search="groceries")
    """
    try:
        mcp_client = ctx.context.get("mcp_client")
        user_id = ctx.context.get("user_id")

        if not mcp_client:
            raise ValueError("MCP client not found in context")
        if user_id is None:
            raise ValueError("user_id not found in context")

        logger.info(
            "list_tasks: status=%s priority=%s tags=%s search=%s user_id=%s",
            status, priority, tags, search, user_id,
        )

        result = await mcp_client.list_tasks(
            user_id=str(user_id),
            status=status or "all",
            priority=priority,
            tags=tags,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size,
        )

        task_count = len(result.get("items", result.get("tasks", [])))
        logger.info("list_tasks success: found %d tasks", task_count)
        return result

    except Exception as e:
        logger.error("list_tasks failed: %s", str(e), exc_info=True)
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
        logger.error(f"complete_task failed: {str(e)}", exc_info=True)
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
        logger.error(f"update_task failed: {str(e)}", exc_info=True)
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
        logger.error(f"delete_task failed: {str(e)}", exc_info=True)
        raise


@function_tool
async def add_recurring_task(
    ctx: RunContextWrapper[Any],
    title: str,
    rrule: str,
    timezone_iana: str = "UTC",
    description: Optional[str] = None,
    priority: str = "Medium",
    tags: Optional[list[str]] = None,
) -> dict:
    """Create a recurring task with an RRULE schedule.

    T029/T042: Parses RRULE and creates a recurring task series.
    Ask for clarification if recurrence cannot be unambiguously parsed.

    Args:
        title: Task title (required)
        rrule: RFC 5545 RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO;BYHOUR=9"
               Common examples:
               - Every Monday at 9 AM: FREQ=WEEKLY;BYDAY=MO;BYHOUR=9
               - Daily at 8 AM: FREQ=DAILY;BYHOUR=8
               - Every Friday at 2 PM: FREQ=WEEKLY;BYDAY=FR;BYHOUR=14
               - Every weekday: FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
        timezone_iana: IANA timezone name (e.g. "America/New_York", "UTC")
        description: Optional description
        priority: "High" | "Medium" | "Low" (default: "Medium")
        tags: Optional list of tags (e.g. ["work", "weekly"])

    Returns:
        dict: Created recurring task with id, rrule, next_occurrence_at, series_id

    Example:
        User: "Remind me to do stand-up every weekday at 9 AM"
        Tool call: add_recurring_task(
            title="Daily stand-up",
            rrule="FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR=9",
            timezone_iana="UTC"
        )
    """
    import httpx

    mcp_client = ctx.context.get("mcp_client")
    user_id = ctx.context.get("user_id")

    if not user_id:
        raise ValueError("user_id not found in context")

    logger.info("add_recurring_task: title=%s rrule=%s user_id=%s", title, rrule, user_id)

    # Call backend REST API directly for recurring tasks
    backend_url = ctx.context.get("backend_base_url", "http://localhost:8000")
    token = ctx.context.get("auth_token", "")

    payload = {
        "title": title,
        "rrule": rrule,
        "timezone_iana": timezone_iana,
        "priority": priority,
        "tags": tags or [],
    }
    if description:
        payload["description"] = description

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{backend_url}/api/{user_id}/recurring",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()


@function_tool
async def set_reminder(
    ctx: RunContextWrapper[Any],
    task_id: str,
    scheduled_for: str,
    reminder_type: str = "in_app",
) -> dict:
    """Set a one-time reminder for a task.

    T050: Parses the scheduled_for datetime and registers a Dapr Job.
    Parse relative times to absolute ISO-8601 UTC before calling.

    Args:
        task_id: Task UUID string
        scheduled_for: ISO-8601 UTC datetime string (e.g. "2026-02-22T09:00:00Z")
                       Parse "tomorrow at 9 AM" → absolute UTC datetime first.
        reminder_type: "in_app" (default) | "email"

    Returns:
        dict: Created reminder with id and scheduled_for_utc

    Example:
        User: "Remind me about task abc123 tomorrow at 9 AM"
        Tool call: set_reminder(
            task_id="abc123-uuid",
            scheduled_for="2026-02-23T09:00:00Z"
        )
    """
    import httpx

    user_id = ctx.context.get("user_id")
    if not user_id:
        raise ValueError("user_id not found in context")

    backend_url = ctx.context.get("backend_base_url", "http://localhost:8000")
    token = ctx.context.get("auth_token", "")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{backend_url}/api/{user_id}/reminders",
            json={
                "task_id": task_id,
                "scheduled_for": scheduled_for,
                "reminder_type": reminder_type,
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
        response.raise_for_status()
        return response.json()


@function_tool
async def cancel_reminder(
    ctx: RunContextWrapper[Any],
    reminder_id: str,
) -> dict:
    """Cancel an existing reminder.

    Args:
        reminder_id: Reminder UUID string

    Returns:
        dict: Cancellation confirmation
    """
    import httpx

    user_id = ctx.context.get("user_id")
    if not user_id:
        raise ValueError("user_id not found in context")

    backend_url = ctx.context.get("backend_base_url", "http://localhost:8000")
    token = ctx.context.get("auth_token", "")

    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{backend_url}/api/{user_id}/reminders/{reminder_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
        response.raise_for_status()
        return {"success": True, "reminder_id": reminder_id}


# Export all tools for easy import
__all__ = [
    "add_task",
    "add_recurring_task",
    "cancel_reminder",
    "complete_task",
    "delete_task",
    "list_tasks",
    "set_reminder",
    "update_task",
]
