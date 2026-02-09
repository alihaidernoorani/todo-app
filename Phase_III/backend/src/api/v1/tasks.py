"""Task CRUD endpoints with path-based user context.

All endpoints receive user_id from the URL path parameter:
  /api/{user_id}/tasks
  /api/{user_id}/tasks/{id}
  /api/{user_id}/tasks/{id}/complete

Authentication is via Better Auth session cookies.
Authorization ensures user_id in path matches session user_id.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

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
) -> TaskList:
    """List all tasks for the user specified in the path.

    Returns tasks filtered by the user_id from the URL path parameter.
    """
    return await task_service.list_tasks(session, user.user_id)


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
