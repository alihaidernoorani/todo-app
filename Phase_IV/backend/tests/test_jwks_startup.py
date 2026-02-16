"""
JWKS Startup Validation Tests

Test suite for JWKS endpoint validation during application startup including:
- Successful JWKS validation
- Unreachable JWKS endpoint handling
- Empty JWKS response handling
- Startup failure scenarios
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwk
from cryptography.hazmat.primitives.asymmetric.rsa import generate_private_key
from cryptography.hazmat.primitives import serialization

from src.main import lifespan
from src.config import get_settings


def generate_test_jwks():
    """Generate a test JWKS with RSA key pair."""
    # Generate an RSA private key
    private_key = generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    # Serialize the private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    # Get the public key
    public_key = private_key.public_key()

    # Serialize the public key in PEM format
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

    # Convert to JWK
    jwk_obj = jwk.RSA.construct(public_key=public_key)
    jwk_dict = jwk_obj.to_dict()
    jwk_dict['kid'] = 'test-kid'

    jwks = {
        "keys": [jwk_dict]
    }

    return jwks, private_pem


@pytest.mark.asyncio
async def test_lifespan_successful_jwks_validation():
    """Test that lifespan successfully validates JWKS endpoint with valid keys."""
    jwks_data, _ = generate_test_jwks()

    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock successful JWKS retrieval
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.return_value = jwks_data
        mock_jwks_client.return_value = mock_instance

        # Test the lifespan context manager
        async with lifespan(app):
            # Verify that the JWKS client was stored in app.state
            assert hasattr(app.state, 'jwks_client')
            assert app.state.jwks_client == mock_instance


@pytest.mark.asyncio
async def test_lifespan_fails_with_unreachable_jwks():
    """Test that lifespan raises RuntimeError when JWKS endpoint is unreachable."""
    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock an exception when trying to get JWKS
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.side_effect = Exception("Connection refused")
        mock_jwks_client.return_value = mock_instance

        # Expect RuntimeError during lifespan startup
        with pytest.raises(RuntimeError, match="JWKS endpoint returned no keys"):
            async with lifespan(app):
                pass  # This should not execute due to the exception


@pytest.mark.asyncio
async def test_lifespan_fails_with_empty_jwks_keys():
    """Test that lifespan raises RuntimeError when JWKS returns no keys."""
    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock JWKS with empty keys
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.return_value = {"keys": []}
        mock_jwks_client.return_value = mock_instance

        # Expect RuntimeError during lifespan startup
        with pytest.raises(RuntimeError, match="JWKS endpoint returned no keys"):
            async with lifespan(app):
                pass  # This should not execute due to the exception


@pytest.mark.asyncio
async def test_lifespan_fails_with_no_keys_field():
    """Test that lifespan raises RuntimeError when JWKS response has no 'keys' field."""
    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock JWKS with no keys field
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.return_value = {}
        mock_jwks_client.return_value = mock_instance

        # Expect RuntimeError during lifespan startup
        with pytest.raises(RuntimeError, match="JWKS endpoint returned no keys"):
            async with lifespan(app):
                pass  # This should not execute due to the exception


@pytest.mark.asyncio
async def test_lifespan_fails_with_none_jwks_response():
    """Test that lifespan raises RuntimeError when JWKS returns None."""
    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock JWKS returning None
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.return_value = None
        mock_jwks_client.return_value = mock_instance

        # Expect RuntimeError during lifespan startup
        with pytest.raises(RuntimeError, match="JWKS endpoint returned no keys"):
            async with lifespan(app):
                pass  # This should not execute due to the exception


@pytest.mark.asyncio
async def test_lifespan_successful_with_single_key():
    """Test that lifespan works with a single valid key in JWKS."""
    jwks_data = {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "single-key-test",
                "alg": "RS256",
                "n": "some_base64_encoded_n_value",
                "e": "AQAB"
            }
        ]
    }

    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock successful JWKS retrieval with single key
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.return_value = jwks_data
        mock_jwks_client.return_value = mock_instance

        # Test the lifespan context manager
        async with lifespan(app):
            # Verify that the JWKS client was stored in app.state
            assert hasattr(app.state, 'jwks_client')
            assert app.state.jwks_client == mock_instance


@pytest.mark.asyncio
async def test_lifespan_multiple_keys():
    """Test that lifespan works with multiple keys in JWKS."""
    jwks_data = {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "key-1",
                "alg": "RS256",
                "n": "first_base64_encoded_n_value",
                "e": "AQAB"
            },
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "key-2",
                "alg": "RS256",
                "n": "second_base64_encoded_n_value",
                "e": "AQAB"
            }
        ]
    }

    app = FastAPI()

    with patch('src.main.PyJWKClient') as mock_jwks_client:
        # Mock successful JWKS retrieval with multiple keys
        mock_instance = MagicMock()
        mock_instance.get_jwk_set.return_value = jwks_data
        mock_jwks_client.return_value = mock_instance

        # Test the lifespan context manager
        async with lifespan(app):
            # Verify that the JWKS client was stored in app.state
            assert hasattr(app.state, 'jwks_client')
            assert app.state.jwks_client == mock_instance