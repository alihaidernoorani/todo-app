"""Integration tests for JWT authentication with FastAPI endpoints.

These tests verify authentication and authorization work correctly with real HTTP requests.
"""

import time
import asyncio
from jose import jwt
import pytest
from httpx import AsyncClient, ASGITransport

from src.main import app
from src.config import get_settings


# Test fixtures
@pytest.fixture
def secret():
    """Get the shared secret for JWT signing."""
    settings = get_settings()
    return settings.better_auth_secret


@pytest.fixture
def user_a_id():
    """User A ID for testing."""
    return "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


@pytest.fixture
def user_b_id():
    """User B ID for testing."""
    return "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


@pytest.fixture
def create_token(secret):
    """Factory function to create JWT tokens."""

    def _create_token(user_id: str, expired: bool = False):
        if expired:
            payload = {
                "user_id": user_id,
                "exp": int(time.time()) - 3600,  # Expired 1 hour ago
                "iat": int(time.time()) - 7200,  # Issued 2 hours ago
            }
        else:
            payload = {
                "user_id": user_id,
                "exp": int(time.time()) + 3600,  # Expires in 1 hour
                "iat": int(time.time()),
            }
        return jwt.encode(payload, secret, algorithm="HS256")

    return _create_token


# T016: Integration test for protected endpoint authentication
class TestProtectedEndpointAuthentication:
    """Test authentication works correctly for protected endpoints."""

    @pytest.mark.asyncio
    async def test_authenticated_request_to_me_endpoint(
        self, client, create_token, user_a_id
    ):
        """Authenticated request to /api/me should return user ID."""
        token = create_token(user_a_id)
        response = await client.get(
            "/api/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_a_id

    @pytest.mark.asyncio
    async def test_unauthenticated_request_returns_401(self, client):
        """Request without Authorization header should return 401."""
        response = await client.get("/api/me")
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Missing authentication token"

    @pytest.mark.asyncio
    async def test_expired_token_returns_401(self, client, create_token, user_a_id):
        """Request with expired token should return 401."""
        token = create_token(user_a_id, expired=True)
        response = await client.get(
            "/api/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Token expired"

    @pytest.mark.asyncio
    async def test_invalid_token_signature_returns_401(self, client):
        """Request with invalid signature should return 401."""
        invalid_token = jwt.encode(
            {"uid": "test", "exp": int(time.time()) + 3600, "iat": int(time.time())},
            "wrong-secret",
            algorithm="HS256",
        )
        response = await client.get(
            "/api/me", headers={"Authorization": f"Bearer {invalid_token}"}
        )
        assert response.status_code == 401
        data = response.json()
        assert data["detail"] == "Invalid token signature"


# T017: Integration test for concurrent requests with same token
class TestConcurrentRequestsStateless:
    """Test stateless validation allows concurrent requests."""

    @pytest.mark.asyncio
    async def test_concurrent_requests_with_same_token_succeed(
        self, client, create_token, user_a_id
    ):
        """Multiple concurrent requests with same token should all succeed (stateless)."""
        token = create_token(user_a_id)
        headers = {"Authorization": f"Bearer {token}"}

        # Make 10 concurrent requests
        tasks = [client.get("/api/me", headers=headers) for _ in range(10)]
        responses = await asyncio.gather(*tasks)

        # All requests should succeed
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["user_id"] == user_a_id


# T030: Integration test for user-scoped endpoint authorization
class TestUserScopedAuthorization:
    """Test user-scoped endpoints enforce authorization correctly."""

    @pytest.mark.asyncio
    async def test_user_can_access_own_tasks(
        self, client, create_token, user_a_id
    ):
        """User A with valid token should access their own tasks."""
        token = create_token(user_a_id)
        response = await client.get(
            f"/api/{user_a_id}/tasks", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "count" in data

    @pytest.mark.asyncio
    async def test_authenticated_user_can_create_own_task(
        self, client, create_token, user_a_id
    ):
        """User A should be able to create tasks under their own ID."""
        token = create_token(user_a_id)
        task_data = {
            "title": "Test Task",
            "description": "Integration test task",
            "is_completed": False,
        }
        response = await client.post(
            f"/api/{user_a_id}/tasks",
            headers={"Authorization": f"Bearer {token}"},
            json=task_data,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["user_id"] == user_a_id


# T031: Integration test for cross-user access prevention
class TestCrossUserAccessPrevention:
    """Test that users cannot access each other's resources."""

    @pytest.mark.asyncio
    async def test_user_cannot_access_other_users_tasks(
        self, client, create_token, user_a_id, user_b_id
    ):
        """User A with valid token should NOT access User B's tasks (403)."""
        token = create_token(user_a_id)
        response = await client.get(
            f"/api/{user_b_id}/tasks", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        data = response.json()
        assert data["detail"] == "Access denied: cannot access another user's resources"

    @pytest.mark.asyncio
    async def test_user_cannot_create_task_for_other_user(
        self, client, create_token, user_a_id, user_b_id
    ):
        """User A should NOT be able to create tasks under User B's ID (403)."""
        token = create_token(user_a_id)
        task_data = {
            "title": "Unauthorized Task",
            "description": "This should fail",
            "is_completed": False,
        }
        response = await client.post(
            f"/api/{user_b_id}/tasks",
            headers={"Authorization": f"Bearer {token}"},
            json=task_data,
        )
        assert response.status_code == 403
        data = response.json()
        assert data["detail"] == "Access denied: cannot access another user's resources"

    @pytest.mark.asyncio
    async def test_multiple_users_isolated(
        self, client, create_token, user_a_id, user_b_id
    ):
        """Verify User A and User B can each access their own resources but not each other's."""
        token_a = create_token(user_a_id)
        token_b = create_token(user_b_id)

        # User A accesses their own tasks - should succeed
        response_a = await client.get(
            f"/api/{user_a_id}/tasks", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert response_a.status_code == 200

        # User B accesses their own tasks - should succeed
        response_b = await client.get(
            f"/api/{user_b_id}/tasks", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert response_b.status_code == 200

        # User A tries to access User B's tasks - should fail
        response_a_to_b = await client.get(
            f"/api/{user_b_id}/tasks", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert response_a_to_b.status_code == 403

        # User B tries to access User A's tasks - should fail
        response_b_to_a = await client.get(
            f"/api/{user_a_id}/tasks", headers={"Authorization": f"Bearer {token_b}"}
        )
        assert response_b_to_a.status_code == 403


# T039: Multiple endpoints using get_current_user() dependency
class TestMultipleEndpointsWithAuthentication:
    """Test that authentication dependency works consistently across endpoints."""

    @pytest.mark.asyncio
    async def test_me_endpoint_requires_auth(self, client):
        """GET /api/me without auth should return 401."""
        response = await client.get("/api/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_endpoint_with_auth_succeeds(
        self, client, create_token, user_a_id
    ):
        """GET /api/me with valid token should return user info."""
        token = create_token(user_a_id)
        response = await client.get(
            "/api/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["user_id"] == user_a_id


# T040: Multiple endpoints using verify_user_access() dependency
class TestMultipleEndpointsWithAuthorization:
    """Test that authorization dependency works consistently across all user-scoped endpoints."""

    @pytest.mark.asyncio
    async def test_all_task_endpoints_require_matching_user_id(
        self, client, create_token, user_a_id, user_b_id
    ):
        """All task endpoints should enforce user_id matching."""
        token_a = create_token(user_a_id)

        # Test GET /api/{user_id}/tasks
        response = await client.get(
            f"/api/{user_b_id}/tasks", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert response.status_code == 403

        # Test POST /api/{user_id}/tasks
        response = await client.post(
            f"/api/{user_b_id}/tasks",
            headers={"Authorization": f"Bearer {token_a}"},
            json={"title": "Test", "description": "Test", "is_completed": False},
        )
        assert response.status_code == 403


# T041: Consistent error response format
class TestConsistentErrorFormat:
    """Verify all authentication and authorization errors return consistent format."""

    @pytest.mark.asyncio
    async def test_401_errors_have_consistent_format(self, client):
        """All 401 errors should have detail field and WWW-Authenticate header."""
        # Missing token
        response = await client.get("/api/me")
        assert response.status_code == 401
        assert "detail" in response.json()
        assert "WWW-Authenticate" in response.headers

    @pytest.mark.asyncio
    async def test_403_errors_have_consistent_format(
        self, client, create_token, user_a_id, user_b_id
    ):
        """All 403 errors should have detail field."""
        token_a = create_token(user_a_id)
        response = await client.get(
            f"/api/{user_b_id}/tasks", headers={"Authorization": f"Bearer {token_a}"}
        )
        assert response.status_code == 403
        data = response.json()
        assert "detail" in data
        assert "access" in data["detail"].lower()


# T042: Endpoint with no {user_id} uses get_current_user()
class TestNonUserScopedEndpoint:
    """Test endpoints without user_id parameter use get_current_user() correctly."""

    @pytest.mark.asyncio
    async def test_me_endpoint_without_user_id_param(
        self, client, create_token, user_a_id
    ):
        """The /api/me endpoint has no {user_id} but still requires authentication."""
        # Without token - should fail
        response = await client.get("/api/me")
        assert response.status_code == 401

        # With token - should succeed
        token = create_token(user_a_id)
        response = await client.get(
            "/api/me", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["user_id"] == user_a_id
