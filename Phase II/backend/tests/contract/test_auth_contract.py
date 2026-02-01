"""Contract tests for JWT authentication and authorization.

These tests verify the authentication contract without requiring a running server.
They test the core authentication logic in isolation.
"""

import time
from jose import jwt
import pytest
from fastapi import HTTPException

from src.auth.jwt_handler import extract_bearer_token, decode_jwt
from src.auth.dependencies import get_current_user, verify_user_access
from src.config import get_settings


# Test fixtures
@pytest.fixture
def secret():
    """Get the shared secret for JWT signing."""
    settings = get_settings()
    return settings.better_auth_secret


@pytest.fixture
def valid_user_id():
    """Standard test user ID."""
    return "9075f5e4-f0b6-4692-b460-9514eb1f56a3"


@pytest.fixture
def valid_token(secret, valid_user_id):
    """Create a valid JWT token for testing."""
    payload = {
        "uid": valid_user_id,
        "exp": int(time.time()) + 3600,  # Expires in 1 hour
        "iat": int(time.time()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def expired_token(secret, valid_user_id):
    """Create an expired JWT token for testing."""
    payload = {
        "uid": valid_user_id,
        "exp": int(time.time()) - 3600,  # Expired 1 hour ago
        "iat": int(time.time()) - 7200,  # Issued 2 hours ago
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def invalid_signature_token(valid_user_id):
    """Create a token with invalid signature."""
    payload = {
        "uid": valid_user_id,
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    return jwt.encode(payload, "wrong-secret-key-for-testing", algorithm="HS256")


# T014: Contract test for valid token authentication
class TestValidTokenAuthentication:
    """Test successful JWT authentication with valid tokens."""

    @pytest.mark.asyncio
    async def test_valid_token_extracts_user_id(self, valid_token, valid_user_id):
        """Valid token should extract user ID successfully."""
        authorization_header = f"Bearer {valid_token}"
        user_id = await get_current_user(authorization_header)
        assert user_id == valid_user_id

    def test_extract_bearer_token_success(self, valid_token):
        """Should extract token from Bearer header."""
        authorization_header = f"Bearer {valid_token}"
        token = extract_bearer_token(authorization_header)
        assert token == valid_token

    def test_decode_jwt_success(self, valid_token, secret, valid_user_id):
        """Should decode valid JWT and extract claims."""
        payload = decode_jwt(valid_token)
        assert payload["uid"] == valid_user_id
        assert "exp" in payload
        assert "iat" in payload


# T015: Contract test scenarios for error cases
class TestAuthenticationErrorScenarios:
    """Test authentication failure scenarios return correct 401 errors."""

    @pytest.mark.asyncio
    async def test_expired_token_returns_401(self, expired_token):
        """Expired token should raise HTTPException with 401."""
        authorization_header = f"Bearer {expired_token}"
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization_header)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Token expired"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_invalid_signature_returns_401(self, invalid_signature_token):
        """Token with invalid signature should raise HTTPException with 401."""
        authorization_header = f"Bearer {invalid_signature_token}"
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization_header)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid token signature"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_missing_token_returns_401(self):
        """Missing Authorization header should raise HTTPException with 401."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(None)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Missing authentication token"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_malformed_header_returns_401(self, valid_token):
        """Malformed Authorization header should raise HTTPException with 401."""
        # Test without "Bearer " prefix
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(valid_token)
        assert exc_info.value.status_code == 401
        assert exc_info.value.detail == "Invalid authorization header format"
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    @pytest.mark.asyncio
    async def test_malformed_token_returns_401(self):
        """Malformed JWT should raise HTTPException with 401."""
        authorization_header = "Bearer not.a.valid.jwt.token.here"
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization_header)
        assert exc_info.value.status_code == 401
        # Should be either "Invalid token signature" or "Malformed token"
        assert exc_info.value.status_code == 401
        assert exc_info.value.headers == {"WWW-Authenticate": "Bearer"}

    def test_extract_bearer_token_missing_header(self):
        """Missing header should raise ValueError."""
        with pytest.raises(ValueError) as exc_info:
            extract_bearer_token(None)
        assert str(exc_info.value) == "Missing authentication token"

    def test_extract_bearer_token_invalid_format(self):
        """Invalid header format should raise ValueError."""
        with pytest.raises(ValueError) as exc_info:
            extract_bearer_token("InvalidFormat token")
        assert str(exc_info.value) == "Invalid authorization header format"


# T028: Contract test for user ID matching (uid == user_id returns success)
class TestUserIDMatching:
    """Test user-scoped authorization with matching user IDs."""

    @pytest.mark.asyncio
    async def test_matching_user_id_succeeds(self, valid_token, valid_user_id):
        """When JWT uid matches path user_id, authorization should succeed."""
        authorization_header = f"Bearer {valid_token}"
        result = await verify_user_access(valid_user_id, authorization_header)
        assert result == valid_user_id


# T029: Contract test for user ID mismatch (uid != user_id returns 403)
class TestUserIDMismatch:
    """Test user-scoped authorization blocks cross-user access."""

    @pytest.mark.asyncio
    async def test_mismatched_user_id_returns_403(self, valid_token, valid_user_id):
        """When JWT uid doesn't match path user_id, should raise HTTPException with 403."""
        different_user_id = "00000000-0000-0000-0000-000000000000"
        authorization_header = f"Bearer {valid_token}"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(different_user_id, authorization_header)

        assert exc_info.value.status_code == 403
        assert exc_info.value.detail == "Access denied: cannot access another user's resources"

    @pytest.mark.asyncio
    async def test_mismatch_with_valid_token_returns_403(self, valid_token):
        """Even with valid token, accessing different user's resources should fail."""
        authorization_header = f"Bearer {valid_token}"
        random_user_id = "11111111-1111-1111-1111-111111111111"

        with pytest.raises(HTTPException) as exc_info:
            await verify_user_access(random_user_id, authorization_header)

        assert exc_info.value.status_code == 403
