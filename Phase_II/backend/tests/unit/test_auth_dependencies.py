"""Unit tests for authentication and authorization dependencies.

These tests verify the FastAPI dependencies work correctly in isolation.
"""

import time
from jose import jwt
import pytest
from fastapi import HTTPException

from src.auth.dependencies import get_current_user, verify_user_access
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
    return "aaaa-aaaa-aaaa-aaaa"


@pytest.fixture
def user_b_id():
    """User B ID for testing."""
    return "bbbb-bbbb-bbbb-bbbb"


@pytest.fixture
def create_token(secret):
    """Factory to create JWT tokens."""

    def _create_token(user_id: str, expired: bool = False):
        if expired:
            payload = {
                "uid": user_id,
                "exp": int(time.time()) - 3600,
                "iat": int(time.time()) - 7200,
            }
        else:
            payload = {
                "uid": user_id,
                "exp": int(time.time()) + 3600,
                "iat": int(time.time()),
            }
        return jwt.encode(payload, secret, algorithm="HS256")

    return _create_token


# T037: Unit tests for verify_user_access() dependency
class TestVerifyUserAccess:
    """Test user-scoped authorization dependency."""

    @pytest.mark.asyncio
    async def test_matching_user_ids_succeeds(self, create_token, user_a_id):
        """When JWT uid matches path user_id, should return user_id."""
        token = create_token(user_a_id)
        authorization_header = f"Bearer {token}"

        result = await verify_user_access(user_a_id, authorization_header)
        assert result == user_a_id

    @pytest.mark.asyncio
    async def test_mismatched_user_ids_raises_403(
        self, create_token, user_a_id, user_b_id
    ):
        """When JWT uid doesn't match path user_id, should raise 403."""
        token = create_token(user_a_id)
        authorization_header = f"Bearer {token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_b_id, authorization_header)

        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Access denied: cannot access another user's resources"

    @pytest.mark.asyncio
    async def test_calls_get_current_user_internally(self, create_token, user_a_id):
        """verify_user_access should call get_current_user for authentication."""
        token = create_token(user_a_id)
        authorization_header = f"Bearer {token}"

        # If this succeeds, it means get_current_user was called successfully
        result = await verify_user_access(user_a_id, authorization_header)
        assert result == user_a_id

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self, user_a_id):
        """Invalid token should raise 401 from get_current_user."""
        invalid_token = "invalid.jwt.token"
        authorization_header = f"Bearer {invalid_token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_a_id, authorization_header)

        # Should get 401 from authentication failure, not 403
        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_missing_token_raises_401(self, user_a_id):
        """Missing token should raise 401 from get_current_user."""
        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_a_id, None)

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Missing authentication token"

    @pytest.mark.asyncio
    async def test_expired_token_raises_401(self, create_token, user_a_id):
        """Expired token should raise 401, not 403."""
        token = create_token(user_a_id, expired=True)
        authorization_header = f"Bearer {token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_a_id, authorization_header)

        # Authentication fails before authorization check
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Token expired"


# T038: Unit tests for user ID mismatch scenarios
class TestUserIDMismatchScenarios:
    """Test various scenarios where user IDs don't match."""

    @pytest.mark.asyncio
    async def test_different_user_id_returns_403(
        self, create_token, user_a_id, user_b_id
    ):
        """User A trying to access User B's resources should get 403."""
        token_a = create_token(user_a_id)
        authorization_header = f"Bearer {token_a}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_b_id, authorization_header)

        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_case_sensitive_user_id_comparison(self, create_token):
        """User ID comparison should be case-sensitive."""
        user_id_lower = "test-user-id"
        user_id_upper = "TEST-USER-ID"

        token = create_token(user_id_lower)
        authorization_header = f"Bearer {token}"

        # Should fail because case doesn't match
        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_id_upper, authorization_header)

        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_similar_but_different_user_ids(self, create_token):
        """Even similar user IDs should be treated as different."""
        user_id_1 = "user-123"
        user_id_2 = "user-1234"  # One extra character

        token = create_token(user_id_1)
        authorization_header = f"Bearer {token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_id_2, authorization_header)

        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_empty_path_user_id_raises_403(self, create_token, user_a_id):
        """Empty path user_id should not match any JWT uid."""
        token = create_token(user_a_id)
        authorization_header = f"Bearer {token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access("", authorization_header)

        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_whitespace_user_id_raises_403(self, create_token):
        """Whitespace in user_id should not match."""
        user_id = "test-user"
        user_id_with_space = "test-user "  # Trailing space

        token = create_token(user_id)
        authorization_header = f"Bearer {token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(user_id_with_space, authorization_header)

        assert exc_info.value.status_code == 403


# T049: Unit tests for dependency reusability
class TestDependencyReusability:
    """Test that dependencies can be reused across multiple endpoints."""

    @pytest.mark.asyncio
    async def test_get_current_user_is_reusable(self, create_token, user_a_id):
        """get_current_user should work when called multiple times."""
        token = create_token(user_a_id)
        authorization_header = f"Bearer {token}"

        # Call multiple times
        result1 = await get_current_user(authorization_header)
        result2 = await get_current_user(authorization_header)
        result3 = await get_current_user(authorization_header)

        assert result1 == user_a_id
        assert result2 == user_a_id
        assert result3 == user_a_id

    @pytest.mark.asyncio
    async def test_verify_user_access_is_reusable(self, create_token, user_a_id):
        """verify_user_access should work when called multiple times."""
        token = create_token(user_a_id)
        authorization_header = f"Bearer {token}"

        # Call multiple times with same user_id
        result1 = await verify_user_access(user_a_id, authorization_header)
        result2 = await verify_user_access(user_a_id, authorization_header)
        result3 = await verify_user_access(user_a_id, authorization_header)

        assert result1 == user_a_id
        assert result2 == user_a_id
        assert result3 == user_a_id

    @pytest.mark.asyncio
    async def test_dependencies_are_stateless(
        self, create_token, user_a_id, user_b_id
    ):
        """Dependencies should not maintain state between calls."""
        token_a = create_token(user_a_id)
        token_b = create_token(user_b_id)

        # First call with user A
        result_a = await get_current_user(f"Bearer {token_a}")
        assert result_a == user_a_id

        # Second call with user B should work independently
        result_b = await get_current_user(f"Bearer {token_b}")
        assert result_b == user_b_id

        # Third call with user A again should still work
        result_a_again = await get_current_user(f"Bearer {token_a}")
        assert result_a_again == user_a_id

    @pytest.mark.asyncio
    async def test_different_tokens_for_same_user(self, secret, user_a_id):
        """Multiple tokens for the same user should all work."""
        # Create two different tokens for the same user
        token1 = jwt.encode(
            {"uid": user_a_id, "exp": int(time.time()) + 3600, "iat": int(time.time())},
            secret,
            algorithm="HS256",
        )
        token2 = jwt.encode(
            {
                "uid": user_a_id,
                "exp": int(time.time()) + 7200,
                "iat": int(time.time()) + 1,
            },
            secret,
            algorithm="HS256",
        )

        # Both tokens should work
        result1 = await get_current_user(f"Bearer {token1}")
        result2 = await get_current_user(f"Bearer {token2}")

        assert result1 == user_a_id
        assert result2 == user_a_id
