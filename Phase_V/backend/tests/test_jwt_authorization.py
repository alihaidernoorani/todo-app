"""
JWT Authorization Tests

Test suite for JWT-based authorization functionality including:
- Cross-user access prevention
- User ID path validation
- Proper error responses for unauthorized access
"""

import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock, MagicMock, patch

from src.auth.dependencies import get_current_user_with_path_validation
from src.auth.exceptions import JWTExpiredError


class MockAuthenticatedUser:
    def __init__(self, user_id):
        self.user_id = user_id


@pytest.mark.asyncio
async def test_valid_user_id_match():
    """Test that access is granted when JWT user_id matches path user_id."""
    mock_user = MockAuthenticatedUser(user_id="user-123")

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = "user-123"

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        result = await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert result.user_id == "user-123"


@pytest.mark.asyncio
async def test_cross_user_access_blocked():
    """Test that access is denied when JWT user_id doesn't match path user_id."""
    mock_user = MockAuthenticatedUser(user_id="user-123")

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = "user-456"  # Different from JWT user_id

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert exc_info.value.status_code == 403
        assert "does not match path parameter" in exc_info.value.detail


@pytest.mark.asyncio
async def test_cross_user_access_error_message_contains_user_ids():
    """Test that the error message contains both user IDs for debugging."""
    mock_user = MockAuthenticatedUser(user_id="jwt-user-123")

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = "path-user-456"

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert exc_info.value.status_code == 403
        assert "jwt-user-123" in exc_info.value.detail
        assert "path-user-456" in exc_info.value.detail


@pytest.mark.asyncio
async def test_valid_uuid_user_id_match():
    """Test that access is granted when JWT user_id matches UUID path user_id."""
    jwt_user_id = "550e8400-e29b-41d4-a716-446655440000"
    mock_user = MockAuthenticatedUser(user_id=jwt_user_id)

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = "550e8400-e29b-41d4-a716-446655440000"

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        result = await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert result.user_id == jwt_user_id


@pytest.mark.asyncio
async def test_cross_user_access_with_uuid_blocked():
    """Test that access is denied when JWT UUID doesn't match path UUID."""
    jwt_user_id = "550e8400-e29b-41d4-a716-446655440000"
    mock_user = MockAuthenticatedUser(user_id=jwt_user_id)

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = "f47ac10b-58cc-4372-a567-0e02b2c3d479"  # Different UUID

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_empty_user_id_handling():
    """Test handling of empty user IDs."""
    mock_user = MockAuthenticatedUser(user_id="")

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = ""

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        result = await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert result.user_id == ""


@pytest.mark.asyncio
async def test_special_characters_in_user_id():
    """Test user ID validation with special characters."""
    special_user_id = "user@domain.com"
    mock_user = MockAuthenticatedUser(user_id=special_user_id)

    # Mock the get_current_user dependency
    mock_get_current_user = AsyncMock(return_value=mock_user)

    path_user_id = "user@domain.com"

    with patch('src.auth.dependencies.get_current_user', mock_get_current_user):
        result = await get_current_user_with_path_validation(mock_get_current_user, path_user_id)

        assert result.user_id == special_user_id