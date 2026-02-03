"""JWT token validation and claim extraction."""

import logging
from typing import Any

from jose import ExpiredSignatureError, JWTError, jwt

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


def decode_jwt(token: str) -> dict[str, Any]:
    """Decode and validate JWT token using HS256 algorithm.

    Validates:
    - Token signature using BETTER_AUTH_SECRET
    - Token expiration (exp claim)
    - Token issued-at time (iat claim)
    - Presence of required user_id claim

    Args:
        token: JWT token string

    Returns:
        Dict[str, Any]: Decoded JWT payload containing user_id, exp, iat, and optional claims

    Raises:
        ExpiredSignatureError: If token has expired (exp < current time)
        JWTError: If token signature is invalid or token is malformed
        ValueError: If user_id claim is missing or malformed
    """
    settings = get_settings()

    try:
        # Decode and validate JWT token
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
            options={
                "verify_signature": True,  # Verify HMAC signature
                "verify_exp": True,  # Check expiration
                "verify_iat": True,  # Validate issued-at
                "require_exp": True,  # Require exp claim
                "require_iat": True,  # Require iat claim
            },
        )

        # Validate required user_id claim
        user_id = payload.get("user_id")
        if not user_id or not isinstance(user_id, str) or len(user_id) == 0:
            raise ValueError("Invalid token: missing or malformed user ID claim")

        return payload

    except ExpiredSignatureError as e:
        logger.warning("JWT token expired: %s", str(e))
        raise
    except JWTError as e:
        logger.warning("JWT validation failed: %s", str(e))
        raise
