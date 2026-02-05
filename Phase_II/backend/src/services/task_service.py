"""Task service layer for CRUD business logic."""

from uuid import UUID

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models import Task
from src.schemas import TaskCreate, TaskList, TaskMetrics, TaskRead, TaskUpdate


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
) -> TaskList:
    """List all tasks for a specific user.

    Args:
        session: Database session
        user_id: Owner's user ID (data isolation filter from path parameter)

    Returns:
        TaskList with items and count
    """
    statement = select(Task).where(Task.user_id == user_id).order_by(col(Task.created_at).desc())
    result = await session.exec(statement)
    tasks = result.all()
    return TaskList(
        items=[TaskRead.model_validate(task) for task in tasks],
        count=len(tasks),
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
