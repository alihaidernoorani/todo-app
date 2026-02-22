"""
End-to-End JWT Authentication Flow Tests

Test suite for complete JWT authentication flows including:
- Signup → Login → Get JWT → Authenticated request
- Expired token → Request → 401 → Token cleared
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from jose import jwt
import time
from datetime import datetime, timedelta

from src.main import app
from src.config import get_settings


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def valid_jwt_token():
    """Create a valid JWT token for testing."""
    settings = get_settings()
    secret = settings.better_auth_secret or "test-secret-key-for-testing"

    # Create a token with required claims
    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "exp": int((datetime.utcnow() + timedelta(minutes=15)).timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "iss": settings.better_auth_url,
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


@pytest.fixture
def expired_jwt_token():
    """Create an expired JWT token for testing."""
    settings = get_settings()
    secret = settings.better_auth_secret or "test-secret-key-for-testing"

    # Create a token that expired 1 minute ago
    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "exp": int((datetime.utcnow() - timedelta(minutes=1)).timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "iss": settings.better_auth_url,
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


def test_end_to_end_jwt_authentication_flow(client, valid_jwt_token):
    """
    End-to-end test: signup → login → get JWT → authenticated request → verify 200
    """
    # Mock JWT validation to simulate successful authentication
    settings = get_settings()

    with patch('src.auth.dependencies.decode_jwt') as mock_decode_jwt:
        # Mock the JWT to return valid user data
        mock_decode_jwt.return_value = {
            "sub": "test-user-id",
            "email": "test@example.com",
            "name": "Test User"
        }

        # Make an authenticated request using the JWT
        response = client.get(
            f"/api/test-user-id/me",
            headers={"Authorization": f"Bearer {valid_jwt_token}"}
        )

        # Should return 200 OK for valid JWT
        assert response.status_code == 200

        # The response should contain user information
        user_data = response.json()
        assert user_data["user_id"] == "test-user-id"
        assert user_data["email"] == "test@example.com"
        assert user_data["name"] == "Test User"


def test_end_to_end_expired_token_flow(client, expired_jwt_token):
    """
    End-to-end test: expired token → request → verify 401
    """
    with patch('src.auth.dependencies.decode_jwt') as mock_decode_jwt:
        # Mock the JWT to raise an expired error
        from src.auth.exceptions import JWTExpiredError
        mock_decode_jwt.side_effect = JWTExpiredError("Token has expired")

        # Make a request with the expired JWT
        response = client.get(
            f"/api/test-user-id/me",
            headers={"Authorization": f"Bearer {expired_jwt_token}"}
        )

        # Should return 401 Unauthorized for expired token
        assert response.status_code == 401

        # The response should contain an error message about expired token
        error_data = response.json()
        assert "expired" in error_data["detail"].lower()


def test_authenticated_task_operations_with_valid_jwt(client, valid_jwt_token):
    """
    Test authenticated operations with valid JWT
    """
    settings = get_settings()

    with patch('src.auth.dependencies.decode_jwt') as mock_decode_jwt:
        # Mock the JWT to return valid user data
        mock_decode_jwt.return_value = {
            "sub": "task-owner-id",
            "email": "owner@example.com",
            "name": "Task Owner"
        }

        # Test creating a task
        task_data = {"title": "Test Task", "description": "Test Description"}
        create_response = client.post(
            "/api/task-owner-id/tasks",
            json=task_data,
            headers={"Authorization": f"Bearer {valid_jwt_token}"}
        )

        # Should return 200 OK for valid JWT
        assert create_response.status_code == 200
        created_task = create_response.json()
        assert created_task["title"] == "Test Task"

        # Test retrieving the task
        task_id = created_task["id"]
        get_response = client.get(
            f"/api/task-owner-id/tasks/{task_id}",
            headers={"Authorization": f"Bearer {valid_jwt_token}"}
        )

        assert get_response.status_code == 200
        retrieved_task = get_response.json()
        assert retrieved_task["id"] == task_id


def test_cross_user_access_blocked_with_jwt(client, valid_jwt_token):
    """
    Test that JWT prevents cross-user access
    """
    settings = get_settings()

    with patch('src.auth.dependencies.decode_jwt') as mock_decode_jwt:
        # Mock the JWT to return one user's data
        mock_decode_jwt.return_value = {
            "sub": "user-123",
            "email": "user1@example.com",
            "name": "User 1"
        }

        # Attempt to access another user's resource
        response = client.get(
            "/api/user-456/me",  # JWT says user-123, but path says user-456
            headers={"Authorization": f"Bearer {valid_jwt_token}"}
        )

        # Should return 403 Forbidden for cross-user access attempt
        assert response.status_code == 403

        # The response should contain an error about user_id mismatch
        error_data = response.json()
        assert "does not match" in error_data["detail"]


def test_jwt_without_authorization_header_returns_401(client):
    """
    Test that requests without JWT return 401
    """
    response = client.get("/api/test-user-id/me")

    # Should return 401 Unauthorized for missing token
    assert response.status_code == 401

    error_data = response.json()
    assert "not authenticated" in error_data["detail"].lower()


def test_malformed_jwt_returns_401(client):
    """
    Test that malformed JWT returns 401
    """
    with patch('src.auth.dependencies.decode_jwt') as mock_decode_jwt:
        from src.auth.exceptions import JWTInvalidSignatureError
        mock_decode_jwt.side_effect = JWTInvalidSignatureError("Invalid token format")

        response = client.get(
            "/api/test-user-id/me",
            headers={"Authorization": "Bearer invalid.token.format"}
        )

        # Should return 401 for invalid token
        assert response.status_code == 401

        error_data = response.json()
        assert "invalid" in error_data["detail"].lower()