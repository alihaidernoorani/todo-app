"""Task service layer for CRUD business logic."""

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func
from sqlmodel import col, or_, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models import Task
from src.schemas import TaskCreate, TaskList, TaskMetrics, TaskRead, TaskUpdate

logger = logging.getLogger(__name__)


async def create_task(
    session: AsyncSession,
    user_id: str,
    task_in: TaskCreate,
) -> TaskRead:
    """Create a new task item for a user.

    Args:
        session: Database session
        user_id: Owner's user ID (from path parameter)
        task_in: Task creation data

    Returns:
        Created task as TaskRead schema
    """
    task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority.value,  # Convert enum to string
        user_id=user_id,
    )
    session.add(task)
    await session.flush()
    await session.refresh(task)
    return TaskRead.model_validate(task)


async def list_tasks(
    session: AsyncSession,
    user_id: str,
    status: str | None = None,
    priority: str | None = None,
    tags: list[str] | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 50,
) -> TaskList:
    """List tasks for a user with optional filters.

    T058: Supports status, priority, tags, full-text search, sort, and pagination.

    Args:
        session: Database session
        user_id: Owner's user ID (data isolation)
        status: "pending" | "completed" | None (all)
        priority: "High" | "Medium" | "Low" | None
        tags: List of tag names to filter by (AND semantics)
        search: Full-text search string (title or description)
        sort_by: Column name to sort by (created_at, priority, title)
        sort_order: "asc" | "desc"
        page: 1-based page number
        page_size: Number of results per page

    Returns:
        TaskList with items and total count
    """
    statement = select(Task).where(Task.user_id == user_id)

    # Status filter
    if status == "completed":
        statement = statement.where(Task.is_completed.is_(True))
    elif status == "pending":
        statement = statement.where(Task.is_completed.is_(False))

    # Priority filter
    if priority:
        statement = statement.where(Task.priority == priority)

    # Tag filter (JOIN on task_tags) — skip if tags model not yet available
    if tags:
        from src.models.tag import Tag, TaskTag
        for tag_name in tags:
            normalized = tag_name.strip().lower()
            tag_subquery = (
                select(TaskTag.task_id)
                .join(Tag, Tag.id == TaskTag.tag_id)
                .where(Tag.user_id == user_id, Tag.name == normalized)
                .scalar_subquery()
            )
            statement = statement.where(Task.id.in_(tag_subquery))  # type: ignore[attr-defined]

    # Full-text search (PostgreSQL GIN index)
    if search:
        search_term = search.strip()
        if search_term:
            statement = statement.where(
                or_(
                    func.lower(Task.title).contains(func.lower(search_term)),
                    func.lower(Task.description).contains(func.lower(search_term)),
                )
            )

    # Sorting
    sort_col = getattr(Task, sort_by, Task.created_at)
    if sort_order == "asc":
        statement = statement.order_by(col(sort_col).asc())
    else:
        statement = statement.order_by(col(sort_col).desc())

    # Count total before pagination
    count_result = await session.exec(select(func.count()).select_from(statement.subquery()))
    total = count_result.one()

    # Pagination
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)

    result = await session.exec(statement)
    tasks = result.all()
    return TaskList(
        items=[TaskRead.model_validate(task) for task in tasks],
        count=total,
    )


async def get_task(
    session: AsyncSession,
    task_id: UUID,
    user_id: str,
) -> TaskRead | None:
    """Get a single task by ID with user isolation.

    Args:
        session: Database session
        task_id: Task ID to retrieve
        user_id: Owner's user ID (data isolation filter from path parameter)

    Returns:
        TaskRead if found and owned by user, None otherwise
    """
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.exec(statement)
    task = result.first()
    if task is None:
        return None
    return TaskRead.model_validate(task)


async def update_task(
    session: AsyncSession,
    task_id: UUID,
    user_id: str,
    task_in: TaskUpdate,
) -> TaskRead | None:
    """Update a task item with full replacement (PUT semantics).

    Args:
        session: Database session
        task_id: Task ID to update
        user_id: Owner's user ID (data isolation filter from path parameter)
        task_in: Update data (all fields applied for full replacement)

    Returns:
        Updated TaskRead if found and owned by user, None otherwise
    """
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.exec(statement)
    task = result.first()
    if task is None:
        return None

    # Full replacement - apply all fields
    task.title = task_in.title
    task.description = task_in.description
    task.is_completed = task_in.is_completed
    task.priority = task_in.priority.value  # Convert enum to string

    session.add(task)
    await session.flush()
    await session.refresh(task)
    return TaskRead.model_validate(task)


async def toggle_task_complete(
    session: AsyncSession,
    task_id: UUID,
    user_id: str,
) -> TaskRead | None:
    """Toggle the is_completed status of a task.

    Args:
        session: Database session
        task_id: Task ID to toggle
        user_id: Owner's user ID (data isolation filter from path parameter)

    Returns:
        Updated TaskRead if found and owned by user, None otherwise
    """
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.exec(statement)
    task = result.first()
    if task is None:
        return None

    # Toggle completion status
    task.is_completed = not task.is_completed

    session.add(task)
    await session.flush()
    await session.refresh(task)
    return TaskRead.model_validate(task)


async def delete_task(
    session: AsyncSession,
    task_id: UUID,
    user_id: str,
) -> bool:
    """Delete a task item with user isolation.

    Args:
        session: Database session
        task_id: Task ID to delete
        user_id: Owner's user ID (data isolation filter from path parameter)

    Returns:
        True if deleted, False if not found or not owned by user
    """
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.exec(statement)
    task = result.first()
    if task is None:
        return False

    await session.delete(task)
    await session.flush()
    return True


async def complete_task(
    session: AsyncSession,
    task_id: UUID,
    user_id: str,
) -> TaskRead | None:
    """Mark a task as completed and publish status change events.

    T075: Sets is_completed=True, publishes task.status_changed to task-updates
    and task.updated to task-events via Dapr PubSub.

    Args:
        session: Database session
        task_id: Task ID to complete
        user_id: Owner's user ID (data isolation)

    Returns:
        Updated TaskRead if found, None otherwise
    """
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await session.exec(statement)
    task = result.first()
    if task is None:
        return None

    task.is_completed = True
    session.add(task)
    await session.flush()
    await session.refresh(task)

    task_read = TaskRead.model_validate(task)

    # Publish events via Dapr PubSub (best-effort — log errors but don't fail request)
    try:
        from src.services.dapr_pubsub import dapr_pubsub  # noqa: PLC0415

        event_payload = {
            "task_id": str(task_id),
            "user_id": user_id,
            "status": "completed",
            "title": task.title,
            "priority": task.priority,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await dapr_pubsub.publish("task-updates", {
            "event_type": "task.status_changed",
            **event_payload,
        })
        await dapr_pubsub.publish("task-events", {
            "event_type": "task.updated",
            **event_payload,
        })
    except Exception as exc:
        logger.warning("Failed to publish task completion events for %s: %s", task_id, exc)

    return task_read


async def get_metrics(
    session: AsyncSession,
    user_id: str,
) -> TaskMetrics:
    """Get aggregated task statistics for a user.

    Args:
        session: Database session
        user_id: Owner's user ID (data isolation filter from path parameter)

    Returns:
        TaskMetrics with counts for total, completed, pending, overdue, and priority breakdown
    """
    # Fetch all tasks for the user
    statement = select(Task).where(Task.user_id == user_id)
    result = await session.exec(statement)
    tasks = result.all()

    # Compute metrics
    total = len(tasks)
    completed = sum(1 for task in tasks if task.is_completed)
    pending = total - completed
    overdue = 0  # Note: overdue calculation requires due_date field which doesn't exist yet
    high_priority = sum(1 for task in tasks if task.priority == "High")
    medium_priority = sum(1 for task in tasks if task.priority == "Medium")
    low_priority = sum(1 for task in tasks if task.priority == "Low")

    return TaskMetrics(
        total=total,
        completed=completed,
        pending=pending,
        overdue=overdue,
        high_priority=high_priority,
        medium_priority=medium_priority,
        low_priority=low_priority,
    )
