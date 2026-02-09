"""
JWT Authentication Tests

Test suite for JWT-based authentication functionality including:
- Valid token verification
- Expired token handling
- Invalid signature rejection
- Missing token handling
"""

import os
import time
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from jose import jwt

from src.auth.jwt_handler import decode_jwt
from src.auth.exceptions import JWTExpiredError, JWTInvalidSignatureError, JWTMissingClaimError
from src.config import get_settings


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


@pytest.fixture
def invalid_signature_token():
    """Create a JWT token with invalid signature for testing."""
    settings = get_settings()

    # Create a token with a different secret
    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "exp": int((datetime.utcnow() + timedelta(minutes=15)).timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "iss": settings.better_auth_url,
    }

    # Encode with different secret to create invalid signature
    token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
    return token


@pytest.fixture
def token_missing_claims():
    """Create a JWT token missing required claims for testing."""
    settings = get_settings()
    secret = settings.better_auth_secret or "test-secret-key-for-testing"

    # Create a token without required claims
    payload = {
        "sub": "test-user-id",
        # Missing exp, iat, iss
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


@pytest.mark.asyncio
async def test_decode_valid_jwt_success(valid_jwt_token):
    """Test that valid JWT tokens are decoded successfully."""
    settings = get_settings()

    with patch('src.auth.jwt_handler.PyJWKClient') as mock_jwks_client:
        # Mock successful JWKS client for RS256
        mock_jwks_client.return_value.get_signing_key_from_jwt.return_value.key = settings.better_auth_secret

        result = await decode_jwt(valid_jwt_token, verify_issuer=True)

        assert result["sub"] == "test-user-id"
        assert result["email"] == "test@example.com"
        assert result["name"] == "Test User"


@pytest.mark.asyncio
async def test_decode_expired_jwt_raises_exception(expired_jwt_token):
    """Test that expired JWT tokens raise JWTExpiredError."""
    with patch('src.auth.jwt_handler.PyJWKClient') as mock_jwks_client:
        mock_jwks_client.return_value.get_signing_key_from_jwt.return_value.key = "test-secret"

        with pytest.raises(JWTExpiredError):
            await decode_jwt(expired_jwt_token)


@pytest.mark.asyncio
async def test_decode_invalid_signature_jwt_raises_exception(invalid_signature_token):
    """Test that JWT tokens with invalid signatures raise JWTInvalidSignatureError."""
    settings = get_settings()

    with patch('src.auth.jwt_handler.PyJWKClient') as mock_jwks_client:
        mock_jwks_client.return_value.get_signing_key_from_jwt.return_value.key = settings.better_auth_secret

        with pytest.raises(JWTInvalidSignatureError):
            await decode_jwt(invalid_signature_token)


@pytest.mark.asyncio
async def test_decode_token_missing_claims_raises_exception(token_missing_claims):
    """Test that JWT tokens missing required claims raise JWTMissingClaimError."""
    settings = get_settings()

    with patch('src.auth.jwt_handler.PyJWKClient') as mock_jwks_client:
        mock_jwks_client.return_value.get_signing_key_from_jwt.return_value.key = settings.better_auth_secret

        with pytest.raises(JWTMissingClaimError):
            await decode_jwt(token_missing_claims)


@pytest.mark.asyncio
async def test_decode_jwt_without_token_raises_exception():
    """Test that decoding an empty token raises JWTInvalidSignatureError."""
    with pytest.raises(JWTInvalidSignatureError):
        await decode_jwt("")


@pytest.mark.asyncio
async def test_decode_jwt_with_malformed_token_raises_exception():
    """Test that decoding a malformed token raises JWTInvalidSignatureError."""
    with pytest.raises(JWTInvalidSignatureError):
        await decode_jwt("invalid.token.format")