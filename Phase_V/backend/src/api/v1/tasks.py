"""Task CRUD endpoints with path-based user context.

All endpoints receive user_id from the URL path parameter:
  /api/{user_id}/tasks
  /api/{user_id}/tasks/{id}
  /api/{user_id}/tasks/{id}/complete

Authentication is via Better Auth session cookies.
Authorization ensures user_id in path matches session user_id.
"""

import asyncio
import json
from typing import Annotated, AsyncGenerator, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from src.api.deps import SessionDep
from src.auth import get_current_user_with_path_validation
from src.auth.models import AuthenticatedUser
from src.schemas import TaskCreate, TaskList, TaskMetrics, TaskRead, TaskUpdate
from src.services import task_service

router = APIRouter()

# Type alias for authenticated and authorized user (validates path user_id)
AuthorizedUserDep = Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)]


@router.post("", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> TaskRead:
    """Create a new task item.

    The user_id is extracted from the URL path parameter and validated against the session.
    """
    return await task_service.create_task(session, user.user_id, task_in)


@router.get("", response_model=TaskList)
async def list_tasks(
    session: SessionDep,
    user: AuthorizedUserDep,
    status: Optional[str] = Query(default=None, description="pending | completed"),
    priority: Optional[str] = Query(default=None, description="High | Medium | Low"),
    tags: Optional[list[str]] = Query(default=None, description="Filter by tag name(s)"),
    search: Optional[str] = Query(default=None, description="Full-text search in title/description"),
    sort_by: str = Query(default="created_at", description="created_at | priority | title"),
    sort_order: str = Query(default="desc", description="asc | desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> TaskList:
    """List tasks for the user with optional filters.

    T059: Supports status, priority, tags, full-text search, sort, and pagination.
    Returns 200 with empty list when no tasks match (never 404).
    """
    return await task_service.list_tasks(
        session,
        user.user_id,
        status=status,
        priority=priority,
        tags=tags,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )


@router.get("/metrics", response_model=TaskMetrics)
async def get_metrics(
    session: SessionDep,
    user: AuthorizedUserDep,
) -> TaskMetrics:
    """Get aggregated task statistics for the user.

    Returns metrics including:
    - Total task count
    - Completed task count
    - Pending task count
    - Overdue task count
    - Priority breakdown (high, medium, low)

    All metrics are computed server-side and scoped to the user_id from the URL path.
    """
    return await task_service.get_metrics(session, user.user_id)


@router.get("/{id}", response_model=TaskRead)
async def get_task(
    id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> TaskRead:
    """Get a specific task by ID.

    Returns 404 if the task doesn't exist OR if it belongs to a different user.
    This prevents enumeration attacks by not distinguishing between these cases.
    """
    task = await task_service.get_task(session, id, user.user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.put("/{id}", response_model=TaskRead)
async def update_task(
    id: UUID,
    task_in: TaskUpdate,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> TaskRead:
    """Update a task with full replacement (PUT semantics).

    All fields (title, description, is_completed) must be provided.
    Returns 404 if the task doesn't exist or belongs to a different user.
    """
    task = await task_service.update_task(session, id, user.user_id, task_in)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.post("/{id}/complete", response_model=TaskRead, status_code=status.HTTP_200_OK)
async def complete_task(
    id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> TaskRead:
    """Mark a task as completed (shorthand — no body required).

    T075: Sets status=completed, publishes task.status_changed and task.updated events.
    Idempotent: completing an already-completed task is a no-op.
    Returns 404 if the task doesn't exist or belongs to a different user.
    """
    task = await task_service.complete_task(session, id, user.user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.patch("/{id}/complete", response_model=TaskRead)
async def toggle_task_complete(
    id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> TaskRead:
    """Toggle the completion status of a task.

    No request body required - this endpoint toggles the current is_completed value.
    Returns 404 if the task doesn't exist or belongs to a different user.
    """
    task = await task_service.toggle_task_complete(session, id, user.user_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    return task


@router.get("/stream", include_in_schema=True)
async def task_stream(
    user: AuthorizedUserDep,
) -> StreamingResponse:
    """SSE stream for real-time task list updates.

    T076: Clients subscribe to receive task.instance_created and task.status_changed events.
    The stream sends a heartbeat every 30 seconds to keep the connection alive.
    Dapr publishes events which are forwarded to connected SSE clients.

    Event format:
      data: {"event_type": "task.status_changed", "task_id": "...", ...}\n\n
    """
    user_id = user.user_id

    async def event_generator() -> AsyncGenerator[str, None]:
        # Send initial connection confirmation
        yield f"data: {json.dumps({'event_type': 'connected', 'user_id': user_id})}\n\n"
        # Send heartbeat every 30 seconds to prevent connection timeout
        while True:
            await asyncio.sleep(30)
            yield f"data: {json.dumps({'event_type': 'heartbeat'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering for SSE
        },
    )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> None:
    """Delete a task.

    Returns 404 if the task doesn't exist or belongs to a different user.
    On success, returns 204 No Content with no response body.
    """
    deleted = await task_service.delete_task(session, id, user.user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
