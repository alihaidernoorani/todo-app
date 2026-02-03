"""Unit tests for task_service functions."""

from uuid import uuid4

from sqlmodel.ext.asyncio.session import AsyncSession

from src.schemas import TaskCreate, TaskUpdate
from src.services import task_service


class TestCreateTask:
    """Unit tests for create_task function."""

    async def test_create_task_returns_taskread(
        self,
        session: AsyncSession,
    ) -> None:
        """Test that create_task returns a TaskRead instance."""
        user_id = uuid4()
        task_in = TaskCreate(title="Test", description="Test desc")

        result = await task_service.create_task(session, user_id, task_in)

        assert result.title == "Test"
        assert result.description == "Test desc"
        assert result.user_id == user_id
        assert result.is_completed is False
        assert result.id is not None

    async def test_create_task_without_description(
        self,
        session: AsyncSession,
    ) -> None:
        """Test creating task without description."""
        user_id = uuid4()
        task_in = TaskCreate(title="No Description")

        result = await task_service.create_task(session, user_id, task_in)

        assert result.title == "No Description"
        assert result.description is None


class TestListTasks:
    """Unit tests for list_tasks function."""

    async def test_list_tasks_returns_user_tasks_only(
        self,
        session: AsyncSession,
    ) -> None:
        """Test that list_tasks only returns tasks for the specified user."""
        user_a = uuid4()
        user_b = uuid4()

        # Create tasks for both users
        await task_service.create_task(session, user_a, TaskCreate(title="User A Task"))
        await task_service.create_task(session, user_b, TaskCreate(title="User B Task"))

        result = await task_service.list_tasks(session, user_a)

        assert result.count == 1
        assert result.items[0].title == "User A Task"

    async def test_list_tasks_empty(
        self,
        session: AsyncSession,
    ) -> None:
        """Test list_tasks returns empty list for user with no tasks."""
        user_id = uuid4()

        result = await task_service.list_tasks(session, user_id)

        assert result.count == 0
        assert result.items == []


class TestGetTask:
    """Unit tests for get_task function."""

    async def test_get_task_success(
        self,
        session: AsyncSession,
    ) -> None:
        """Test getting an existing task."""
        user_id = uuid4()
        created = await task_service.create_task(session, user_id, TaskCreate(title="Get Me"))

        result = await task_service.get_task(session, created.id, user_id)

        assert result is not None
        assert result.id == created.id
        assert result.title == "Get Me"

    async def test_get_task_not_found(
        self,
        session: AsyncSession,
    ) -> None:
        """Test getting a non-existent task returns None."""
        user_id = uuid4()
        fake_id = uuid4()

        result = await task_service.get_task(session, fake_id, user_id)

        assert result is None

    async def test_get_task_wrong_user(
        self,
        session: AsyncSession,
    ) -> None:
        """Test getting another user's task returns None."""
        user_a = uuid4()
        user_b = uuid4()
        created = await task_service.create_task(session, user_a, TaskCreate(title="User A's Task"))

        result = await task_service.get_task(session, created.id, user_b)

        assert result is None


class TestUpdateTask:
    """Unit tests for update_task function (PUT semantics - full replacement)."""

    async def test_update_task_full_replacement(
        self,
        session: AsyncSession,
    ) -> None:
        """Test updating task with all fields (PUT semantics)."""
        user_id = uuid4()
        created = await task_service.create_task(
            session, user_id, TaskCreate(title="Original", description="Original desc")
        )

        result = await task_service.update_task(
            session,
            created.id,
            user_id,
            TaskUpdate(title="Updated", description="Updated desc", is_completed=True),
        )

        assert result is not None
        assert result.title == "Updated"
        assert result.description == "Updated desc"
        assert result.is_completed is True

    async def test_update_task_clear_description(
        self,
        session: AsyncSession,
    ) -> None:
        """Test clearing description via PUT update."""
        user_id = uuid4()
        created = await task_service.create_task(
            session, user_id, TaskCreate(title="With Desc", description="Has description")
        )

        result = await task_service.update_task(
            session,
            created.id,
            user_id,
            TaskUpdate(title="With Desc", description=None, is_completed=False),
        )

        assert result is not None
        assert result.description is None

    async def test_update_task_not_found(
        self,
        session: AsyncSession,
    ) -> None:
        """Test updating non-existent task returns None."""
        user_id = uuid4()
        fake_id = uuid4()

        result = await task_service.update_task(
            session,
            fake_id,
            user_id,
            TaskUpdate(title="Updated", description=None, is_completed=False),
        )

        assert result is None

    async def test_update_task_wrong_user(
        self,
        session: AsyncSession,
    ) -> None:
        """Test updating another user's task returns None."""
        user_a = uuid4()
        user_b = uuid4()
        created = await task_service.create_task(session, user_a, TaskCreate(title="User A's Task"))

        result = await task_service.update_task(
            session,
            created.id,
            user_b,
            TaskUpdate(title="Hacked", description=None, is_completed=False),
        )

        assert result is None


class TestToggleTaskComplete:
    """Unit tests for toggle_task_complete function."""

    async def test_toggle_task_complete_to_true(
        self,
        session: AsyncSession,
    ) -> None:
        """Test toggling task from incomplete to complete."""
        user_id = uuid4()
        created = await task_service.create_task(session, user_id, TaskCreate(title="Toggle Me"))
        assert created.is_completed is False

        result = await task_service.toggle_task_complete(session, created.id, user_id)

        assert result is not None
        assert result.is_completed is True

    async def test_toggle_task_complete_to_false(
        self,
        session: AsyncSession,
    ) -> None:
        """Test toggling task from complete to incomplete."""
        user_id = uuid4()
        created = await task_service.create_task(session, user_id, TaskCreate(title="Toggle Me"))
        # First toggle to complete
        await task_service.toggle_task_complete(session, created.id, user_id)

        # Toggle back to incomplete
        result = await task_service.toggle_task_complete(session, created.id, user_id)

        assert result is not None
        assert result.is_completed is False

    async def test_toggle_task_complete_not_found(
        self,
        session: AsyncSession,
    ) -> None:
        """Test toggling non-existent task returns None."""
        user_id = uuid4()
        fake_id = uuid4()

        result = await task_service.toggle_task_complete(session, fake_id, user_id)

        assert result is None

    async def test_toggle_task_complete_wrong_user(
        self,
        session: AsyncSession,
    ) -> None:
        """Test toggling another user's task returns None."""
        user_a = uuid4()
        user_b = uuid4()
        created = await task_service.create_task(session, user_a, TaskCreate(title="User A's Task"))

        result = await task_service.toggle_task_complete(session, created.id, user_b)

        assert result is None


class TestDeleteTask:
    """Unit tests for delete_task function."""

    async def test_delete_task_success(
        self,
        session: AsyncSession,
    ) -> None:
        """Test deleting an existing task."""
        user_id = uuid4()
        created = await task_service.create_task(session, user_id, TaskCreate(title="Delete Me"))

        result = await task_service.delete_task(session, created.id, user_id)

        assert result is True

        # Verify it's deleted
        get_result = await task_service.get_task(session, created.id, user_id)
        assert get_result is None

    async def test_delete_task_not_found(
        self,
        session: AsyncSession,
    ) -> None:
        """Test deleting non-existent task returns False."""
        user_id = uuid4()
        fake_id = uuid4()

        result = await task_service.delete_task(session, fake_id, user_id)

        assert result is False

    async def test_delete_task_wrong_user(
        self,
        session: AsyncSession,
    ) -> None:
        """Test deleting another user's task returns False."""
        user_a = uuid4()
        user_b = uuid4()
        created = await task_service.create_task(session, user_a, TaskCreate(title="User A's Task"))

        result = await task_service.delete_task(session, created.id, user_b)

        assert result is False

        # Verify it still exists for user A
        get_result = await task_service.get_task(session, created.id, user_a)
        assert get_result is not None
