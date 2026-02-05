"""JWT token validation and claim extraction using RS256 with JWKS.

This module validates JWT tokens issued by Better Auth using:
- RS256 (RSA) signature algorithm
- JWKS (JSON Web Key Set) public key verification
- Expiration and issued-at time checks
"""

import logging
from typing import Any

import httpx
import jwt
from jwt import PyJWKClient
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from ..config import get_settings

logger = logging.getLogger(__name__)


def extract_bearer_token(authorization: str | None) -> str:
    """Extract JWT token from Authorization header.

    Args:
        authorization: Authorization header value (expected format: "Bearer <token>")

    Returns:
        str: Extracted JWT token

    Raises:
        ValueError: If authorization header is missing or malformed
    """
    if authorization is None:
        raise ValueError("Missing authentication token")

    if not authorization.startswith("Bearer "):
        raise ValueError("Invalid authorization header format")

    # Extract token after "Bearer " prefix
    token = authorization[7:]  # len("Bearer ") = 7
    return token


async def decode_jwt(token: str) -> dict[str, Any]:
    """Decode and validate JWT token using RS256 with JWKS public key.

    Validates:
    - Token signature using RS256 with public key from JWKS endpoint
    - Token expiration (exp claim)
    - Token issued-at time (iat claim)
    - Presence of required user_id claim (sub)

    Args:
        token: JWT token string

    Returns:
        Dict[str, Any]: Decoded JWT payload containing sub, exp, iat, and optional claims

    Raises:
        ExpiredSignatureError: If token has expired (exp < current time)
        InvalidTokenError: If token signature is invalid or token is malformed
        ValueError: If sub claim is missing or malformed, or JWKS fetch failed
    """
    settings = get_settings()

    # Create JWKS client to fetch and cache public keys
    jwks_client = PyJWKClient(settings.better_auth_jwks_url)

    try:
        # Get the signing key from JWKS that matches the token's kid header
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        # Decode and validate JWT token using RS256 with public key
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "require": ["exp", "iat"],
            },
        )

        # Validate required sub claim (standard JWT subject for user ID)
        # Better Auth uses 'sub' claim for user ID per OIDC standard
        user_id = payload.get("sub")
        if not user_id or not isinstance(user_id, str) or len(user_id) == 0:
            raise ValueError("Invalid token: missing or malformed user ID claim")

        return payload

    except httpx.RequestError as e:
        logger.error("Failed to fetch JWKS from %s: %s", settings.better_auth_jwks_url, str(e))
        raise ValueError(f"Unable to verify token: authentication service unavailable") from e
    except ExpiredSignatureError as e:
        logger.warning("JWT token expired: %s", str(e))
        raise
    except InvalidTokenError as e:
        logger.warning("JWT validation failed: %s", str(e))
        raise
