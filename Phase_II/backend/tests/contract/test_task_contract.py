"""Contract tests verifying API shape matches expected schema.

All endpoints use /api/{user_id}/tasks pattern (path-based user context).
"""

from uuid import uuid4

from httpx import AsyncClient


class TestTaskApiContract:
    """Contract tests for Task API endpoints with path-based user context."""

    async def test_create_task_response_shape(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify POST /api/{user_id}/tasks response matches contract."""
        response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Contract Test", "description": "Test desc"},
        )
        assert response.status_code == 201
        data = response.json()

        # Verify required fields exist
        assert "id" in data
        assert "title" in data
        assert "description" in data
        assert "is_completed" in data
        assert "created_at" in data
        assert "user_id" in data

        # Verify field types
        assert isinstance(data["id"], str)
        assert isinstance(data["title"], str)
        assert data["description"] is None or isinstance(data["description"], str)
        assert isinstance(data["is_completed"], bool)
        assert isinstance(data["created_at"], str)
        assert isinstance(data["user_id"], str)

    async def test_list_tasks_response_shape(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify GET /api/{user_id}/tasks response matches contract."""
        # Create a task first
        await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "List Contract Test"},
        )

        response = await client.get(f"/api/{user_id}/tasks")
        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert "items" in data
        assert "count" in data
        assert isinstance(data["items"], list)
        assert isinstance(data["count"], int)
        assert data["count"] == len(data["items"])

        # Verify item shape
        if data["items"]:
            item = data["items"][0]
            assert "id" in item
            assert "title" in item
            assert "is_completed" in item

    async def test_get_task_response_shape(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify GET /api/{user_id}/tasks/{id} response matches contract."""
        # Create a task first
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Get Contract Test"},
        )
        task_id = create_response.json()["id"]

        response = await client.get(f"/api/{user_id}/tasks/{task_id}")
        assert response.status_code == 200
        data = response.json()

        # Verify all fields present
        assert "id" in data
        assert "title" in data
        assert "description" in data
        assert "is_completed" in data
        assert "created_at" in data
        assert "user_id" in data

    async def test_update_task_response_shape(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify PUT /api/{user_id}/tasks/{id} response matches contract (full replacement)."""
        # Create a task first
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Update Contract Test"},
        )
        task_id = create_response.json()["id"]

        # PUT requires all fields for full replacement
        response = await client.put(
            f"/api/{user_id}/tasks/{task_id}",
            json={
                "title": "Updated Title",
                "description": "Updated description",
                "is_completed": True,
            },
        )
        assert response.status_code == 200
        data = response.json()

        # Verify all fields present
        assert "id" in data
        assert "title" in data
        assert data["title"] == "Updated Title"
        assert data["description"] == "Updated description"
        assert data["is_completed"] is True

    async def test_toggle_complete_response_shape(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify PATCH /api/{user_id}/tasks/{id}/complete response matches contract."""
        # Create a task first
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Toggle Contract Test"},
        )
        task_id = create_response.json()["id"]

        # Toggle completion (no body required)
        response = await client.patch(f"/api/{user_id}/tasks/{task_id}/complete")
        assert response.status_code == 200
        data = response.json()

        # Verify all fields present
        assert "id" in data
        assert "title" in data
        assert "is_completed" in data
        assert data["is_completed"] is True  # Was False, now True

    async def test_delete_task_response(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify DELETE /api/{user_id}/tasks/{id} returns 204 with no content."""
        # Create a task first
        create_response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": "Delete Contract Test"},
        )
        task_id = create_response.json()["id"]

        response = await client.delete(f"/api/{user_id}/tasks/{task_id}")
        assert response.status_code == 204
        assert response.content == b""

    async def test_error_response_shape_404(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify 404 error response matches contract."""
        fake_id = str(uuid4())
        response = await client.get(f"/api/{user_id}/tasks/{fake_id}")
        assert response.status_code == 404
        data = response.json()

        # Verify error response shape
        assert "detail" in data

    async def test_error_response_shape_422(
        self,
        client: AsyncClient,
        user_id: str,
    ) -> None:
        """Verify 422 validation error response matches contract."""
        response = await client.post(
            f"/api/{user_id}/tasks",
            json={"title": ""},  # Empty title should fail validation
        )
        assert response.status_code == 422
        data = response.json()

        # Verify error response shape
        assert "detail" in data

    async def test_error_response_shape_400_invalid_user_id(
        self,
        client: AsyncClient,
    ) -> None:
        """Verify 400 error response for invalid user_id format."""
        response = await client.post(
            "/api/not-a-valid-uuid/tasks",
            json={"title": "Test"},
        )
        assert response.status_code == 400
        data = response.json()

        assert "detail" in data
        assert "Invalid user ID format" in data["detail"]


class TestHealthEndpointContract:
    """Contract tests for health endpoint."""

    async def test_health_response_shape(
        self,
        client: AsyncClient,
    ) -> None:
        """Verify /health response matches contract."""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert data["status"] == "healthy"
