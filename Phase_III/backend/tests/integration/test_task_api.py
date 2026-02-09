"""Integration tests for Task API endpoints with path-based user context.

All endpoints use /api/{user_id}/tasks pattern instead of header-based auth.
"""

from uuid import uuid4

from httpx import AsyncClient

# ============================================================================
# User Story 1: Create Task (T020-T022)
# ============================================================================


class TestCreateTask:
    """Tests for POST /api/{user_id}/tasks endpoint."""

    async def test_create_task_success(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T020: Test successful task creation via path-based user context."""
        response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Test Task", "description": "Test description"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] == "Test description"
        assert data["is_completed"] is False
        assert "id" in data
        assert "created_at" in data
        assert data["user_id"] == user_id

    async def test_create_task_minimal(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Test task creation with only required fields."""
        response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Minimal Task"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal Task"
        assert data["description"] is None

    async def test_create_task_invalid_user_id_format(
        self,
        client: AsyncClient,
    ) -> None:
        """T021: Test invalid user_id format returns 400."""
        response = await client.post(
            "/api/not-a-valid-uuid/tasks",
            json={"title": "Test Task"},
        )
        assert response.status_code == 400
        data = response.json()
        assert "Invalid user ID format" in data.get("detail", "")

    async def test_create_task_empty_title_fails(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T022: Test validation error for empty title."""
        response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": ""},
        )
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    async def test_create_task_title_too_long_fails(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Test validation error for title exceeding 255 characters."""
        response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "x" * 256},
        )
        assert response.status_code == 422


# ============================================================================
# User Story 2: List Tasks (T025-T027)
# ============================================================================


class TestListTasks:
    """Tests for GET /api/{user_id}/tasks endpoint."""

    async def test_list_tasks_multiple(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T025: Test listing multiple tasks."""
        # Create multiple tasks
        for i in range(3):
            await client.post(
                f"/api/{user_id}/tasks",
                json={"title": f"Task {i}"},
            )

        response = await client.get(f"/api/{user_id}/tasks")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 3
        assert len(data["items"]) == 3

    async def test_list_tasks_empty(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T026: Test empty list response for new user."""
        response = await client.get(f"/api/{user_id}/tasks")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["items"] == []

    async def test_list_tasks_user_isolation(
        self,
        client: AsyncClient,
        user_id: str,
        another_user_id: str,
    ) -> None:
        """T027: Test user A cannot see user B's tasks."""
        # User A creates a task
        await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "User A's Task"},
        )

        # User B creates a task
        await client.post(
            f"/api/{another_user_id}/tasks",
            json={"title": "User B's Task"},
        )

        # User A lists tasks - should only see their own
        response = await client.get(f"/api/{user_id}/tasks")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["items"][0]["title"] == "User A's Task"

        # User B lists tasks - should only see their own
        response = await client.get(f"/api/{another_user_id}/tasks")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 1
        assert data["items"][0]["title"] == "User B's Task"


# ============================================================================
# User Story 3: Retrieve Single Task (T030-T032)
# ============================================================================


class TestGetTask:
    """Tests for GET /api/{user_id}/tasks/{id} endpoint."""

    async def test_get_task_success(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T030: Test successful task retrieval."""
        # Create a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Test Task", "description": "Test desc"},
        )
        task_id = create_response.json()["id"]

        # Retrieve it
        response = await client.get(f"/api/{user_id}/tasks/{task_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id
        assert data["title"] == "Test Task"
        assert data["description"] == "Test desc"

    async def test_get_task_not_found(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T031: Test 404 when task doesn't exist."""
        fake_id = str(uuid4())
        response = await client.get(f"/api/{user_id}/tasks/{fake_id}")
        assert response.status_code == 404

    async def test_get_task_user_isolation(
        self,
        client: AsyncClient,
        user_id: str,
        another_user_id: str,
    ) -> None:
        """T032: Test 404 when accessing another user's task (data isolation)."""
        # User A creates a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "User A's Task"},
        )
        task_id = create_response.json()["id"]

        # User B tries to access it via their path - should get 404 (not 403)
        response = await client.get(f"/api/{another_user_id}/tasks/{task_id}")
        assert response.status_code == 404

    async def test_get_task_invalid_uuid(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Test invalid UUID format returns 422."""
        response = await client.get(f"/api/{user_id}/tasks/not-a-uuid")
        assert response.status_code == 422


# ============================================================================
# User Story 4: Update Task via PUT (T038-T041) and Toggle Complete (T040)
# ============================================================================


class TestUpdateTask:
    """Tests for PUT /api/{user_id}/tasks/{id} endpoint."""

    async def test_update_task_full_replace(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T038: Test full task update with PUT."""
        # Create a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Original Title", "description": "Original desc"},
        )
        task_id = create_response.json()["id"]

        # Full update with PUT (all fields required)
        response = await client.put(
            f"/api/{user_id}/tasks/{task_id}",
            json={
                "title": "Updated Title",
                "description": "Updated desc",
                "is_completed": True,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated desc"
        assert data["is_completed"] is True

    async def test_update_task_missing_required_fields_fails(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T039: Test PUT with missing required fields returns 422."""
        # Create a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Test Task"},
        )
        task_id = create_response.json()["id"]

        # Try PUT without is_completed (required for PUT)
        response = await client.put(
            f"/api/{user_id}/tasks/{task_id}",
            json={"title": "Updated Title"},
        )
        assert response.status_code == 422

    async def test_update_task_user_isolation(
        self,
        client: AsyncClient,
        user_id: str,
        another_user_id: str,
    ) -> None:
        """T041: Test 404 when updating another user's task."""
        # User A creates a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "User A's Task"},
        )
        task_id = create_response.json()["id"]

        # User B tries to update it via their path - should get 404
        response = await client.put(
            f"/api/{another_user_id}/tasks/{task_id}",
            json={
                "title": "Hacked!",
                "description": None,
                "is_completed": True,
            },
        )
        assert response.status_code == 404

    async def test_update_task_empty_title_fails(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Test validation error for empty title on update."""
        # Create a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Test Task"},
        )
        task_id = create_response.json()["id"]

        # Try to update with empty title
        response = await client.put(
            f"/api/{user_id}/tasks/{task_id}",
            json={"title": "", "description": None, "is_completed": False},
        )
        assert response.status_code == 422


class TestToggleTaskComplete:
    """Tests for PATCH /api/{user_id}/tasks/{id}/complete endpoint."""

    async def test_toggle_task_complete(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T040: Test toggling task completion status."""
        # Create a task (starts as incomplete)
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Test Task"},
        )
        task_id = create_response.json()["id"]
        assert create_response.json()["is_completed"] is False

        # Toggle to complete (no body required)
        response = await client.patch(f"/api/{user_id}/tasks/{task_id}/complete")
        assert response.status_code == 200
        assert response.json()["is_completed"] is True

        # Toggle back to incomplete
        response = await client.patch(f"/api/{user_id}/tasks/{task_id}/complete")
        assert response.status_code == 200
        assert response.json()["is_completed"] is False

    async def test_toggle_task_complete_not_found(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Test 404 when toggling non-existent task."""
        fake_id = str(uuid4())
        response = await client.patch(f"/api/{user_id}/tasks/{fake_id}/complete")
        assert response.status_code == 404

    async def test_toggle_task_complete_user_isolation(
        self,
        client: AsyncClient,
        user_id: str,
        another_user_id: str,
    ) -> None:
        """Test 404 when toggling another user's task."""
        # User A creates a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "User A's Task"},
        )
        task_id = create_response.json()["id"]

        # User B tries to toggle it - should get 404
        response = await client.patch(f"/api/{another_user_id}/tasks/{task_id}/complete")
        assert response.status_code == 404


# ============================================================================
# User Story 5: Delete Task (T044-T046)
# ============================================================================


class TestDeleteTask:
    """Tests for DELETE /api/{user_id}/tasks/{id} endpoint."""

    async def test_delete_task_success(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T044: Test successful task deletion."""
        # Create a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "To Delete"},
        )
        task_id = create_response.json()["id"]

        # Delete it
        response = await client.delete(f"/api/{user_id}/tasks/{task_id}")
        assert response.status_code == 204

        # Verify it's gone
        get_response = await client.get(f"/api/{user_id}/tasks/{task_id}")
        assert get_response.status_code == 404

    async def test_delete_task_not_found(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """T045: Test 404 when deleting non-existent task."""
        fake_id = str(uuid4())
        response = await client.delete(f"/api/{user_id}/tasks/{fake_id}")
        assert response.status_code == 404

    async def test_delete_task_user_isolation(
        self,
        client: AsyncClient,
        user_id: str,
        another_user_id: str,
    ) -> None:
        """T046: Test 404 when deleting another user's task."""
        # User A creates a task
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "User A's Task"},
        )
        task_id = create_response.json()["id"]

        # User B tries to delete it via their path - should get 404
        response = await client.delete(f"/api/{another_user_id}/tasks/{task_id}")
        assert response.status_code == 404

        # Verify task still exists for User A
        get_response = await client.get(f"/api/{user_id}/tasks/{task_id}")
        assert get_response.status_code == 200
