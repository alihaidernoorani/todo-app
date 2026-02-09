"""Async HTTP client for backend API communication.

This module provides a stateless HTTP client that MCP tools use to interact
with the FastAPI backend REST endpoints. All task operations are delegated
to the backend, maintaining zero in-memory state in the MCP server.
"""

import logging
from typing import Any
from uuid import UUID

import httpx
from pydantic import ValidationError

logger = logging.getLogger(__name__)


class BackendClientError(Exception):
    """Base exception for backend client errors."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class BackendClient:
    """Async HTTP client for communicating with FastAPI backend.

    This client is stateless and uses connection pooling for performance.
    All methods accept user_id for proper request scoping.
    """

    def __init__(self, base_url: str, timeout: float = 30.0):
        """Initialize backend client.

        Args:
            base_url: Base URL of FastAPI backend (e.g., http://localhost:8000)
            timeout: Request timeout in seconds (default: 30)
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "BackendClient":
        """Async context manager entry."""
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(self.timeout),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
        )
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _get_client(self) -> httpx.AsyncClient:
        """Get the HTTP client instance."""
        if not self._client:
            raise RuntimeError("Client not initialized. Use 'async with' context manager.")
        return self._client

    def _handle_error(self, response: httpx.Response, operation: str) -> None:
        """Handle HTTP error responses.

        Args:
            response: HTTP response object
            operation: Description of the operation (for error messages)

        Raises:
            BackendClientError: With user-friendly error message
        """
        try:
            error_detail = response.json().get("detail", "Unknown error")
        except Exception:
            error_detail = response.text or "Unknown error"

        if response.status_code == 404:
            raise BackendClientError(f"Task not found or access denied", 404)
        elif response.status_code == 403:
            raise BackendClientError(f"Unauthorized: {error_detail}", 403)
        elif response.status_code == 400:
            raise BackendClientError(f"Invalid request: {error_detail}", 400)
        elif response.status_code >= 500:
            raise BackendClientError(f"Backend server error: {error_detail}", 500)
        else:
            raise BackendClientError(
                f"{operation} failed: {error_detail}",
                response.status_code,
            )

    async def create_task(
        self,
        user_id: str,
        title: str,
        description: str | None = None,
    ) -> dict[str, Any]:
        """Create a new task via POST /api/{user_id}/tasks.

        Args:
            user_id: User identifier for task scoping
            title: Task title (max 255 chars)
            description: Optional task description (max 2000 chars)

        Returns:
            dict: Task object with id, title, status, created_at, etc.

        Raises:
            BackendClientError: If request fails
        """
        client = self._get_client()
        url = f"/api/{user_id}/tasks"
        payload = {"title": title, "description": description}

        logger.info(f"Creating task for user {user_id}: {title}")

        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            self._handle_error(e.response, "Create task")
        except httpx.RequestError as e:
            raise BackendClientError(f"Network error: {e}")

    async def list_tasks(
        self,
        user_id: str,
        status: str = "all",
    ) -> dict[str, Any]:
        """List tasks via GET /api/{user_id}/tasks.

        Args:
            user_id: User identifier for task scoping
            status: Filter by status ('all', 'pending', 'completed')

        Returns:
            dict: Object with 'items' (list of tasks) and 'count' fields

        Raises:
            BackendClientError: If request fails
        """
        client = self._get_client()
        url = f"/api/{user_id}/tasks"
        params = {}

        # Backend API expects status as query param only for filtering
        # If status is 'all', we omit the param (backend returns all)
        if status != "all":
            params["status"] = status

        logger.info(f"Listing tasks for user {user_id} with status filter: {status}")

        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            self._handle_error(e.response, "List tasks")
        except httpx.RequestError as e:
            raise BackendClientError(f"Network error: {e}")

    async def complete_task(
        self,
        user_id: str,
        task_id: UUID,
    ) -> dict[str, Any]:
        """Mark task as complete via PATCH /api/{user_id}/tasks/{id}/complete.

        Args:
            user_id: User identifier for task scoping
            task_id: UUID of task to complete

        Returns:
            dict: Updated task object

        Raises:
            BackendClientError: If request fails or task not found
        """
        client = self._get_client()
        url = f"/api/{user_id}/tasks/{task_id}/complete"

        logger.info(f"Completing task {task_id} for user {user_id}")

        try:
            response = await client.patch(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            self._handle_error(e.response, "Complete task")
        except httpx.RequestError as e:
            raise BackendClientError(f"Network error: {e}")

    async def update_task(
        self,
        user_id: str,
        task_id: UUID,
        title: str | None = None,
        description: str | None = None,
    ) -> dict[str, Any]:
        """Update task via PUT /api/{user_id}/tasks/{id}.

        Note: Backend PUT endpoint requires full replacement. We fetch current
        task data first, then merge with provided updates.

        Args:
            user_id: User identifier for task scoping
            task_id: UUID of task to update
            title: New title (optional)
            description: New description (optional)

        Returns:
            dict: Updated task object

        Raises:
            BackendClientError: If request fails or task not found
            ValidationError: If no fields provided for update
        """
        if title is None and description is None:
            raise ValidationError("At least one field (title or description) must be provided")

        client = self._get_client()

        # Fetch current task to get existing values
        get_url = f"/api/{user_id}/tasks/{task_id}"
        try:
            get_response = await client.get(get_url)
            get_response.raise_for_status()
            current_task = get_response.json()
        except httpx.HTTPStatusError as e:
            self._handle_error(e.response, "Fetch task for update")
        except httpx.RequestError as e:
            raise BackendClientError(f"Network error: {e}")

        # Merge updates with current values
        payload = {
            "title": title if title is not None else current_task["title"],
            "description": description if description is not None else current_task.get("description"),
            "is_completed": current_task["is_completed"],
            "priority": current_task["priority"],
        }

        # Perform PUT update
        put_url = f"/api/{user_id}/tasks/{task_id}"
        logger.info(f"Updating task {task_id} for user {user_id}")

        try:
            response = await client.put(put_url, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            self._handle_error(e.response, "Update task")
        except httpx.RequestError as e:
            raise BackendClientError(f"Network error: {e}")

    async def delete_task(
        self,
        user_id: str,
        task_id: UUID,
    ) -> dict[str, Any]:
        """Delete task via DELETE /api/{user_id}/tasks/{id}.

        Args:
            user_id: User identifier for task scoping
            task_id: UUID of task to delete

        Returns:
            dict: Success confirmation with message

        Raises:
            BackendClientError: If request fails or task not found
        """
        client = self._get_client()
        url = f"/api/{user_id}/tasks/{task_id}"

        logger.info(f"Deleting task {task_id} for user {user_id}")

        try:
            response = await client.delete(url)
            response.raise_for_status()
            # Backend returns 204 No Content on success
            return {"success": True, "message": "Task deleted successfully"}
        except httpx.HTTPStatusError as e:
            self._handle_error(e.response, "Delete task")
        except httpx.RequestError as e:
            raise BackendClientError(f"Network error: {e}")
