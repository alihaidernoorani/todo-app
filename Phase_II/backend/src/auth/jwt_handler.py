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
    """Decode and validate JWT token using RS256 with JWKS or HS256 with shared secret.

    Validates:
    - Token signature using RS256 (JWKS) or HS256 (shared secret)
    - Token expiration (exp claim)
    - Token issued-at time (iat claim)
    - Presence of required user_id claim (sub)

    Tries RS256 first (production), falls back to HS256 (development).

    Args:
        token: JWT token string

    Returns:
        Dict[str, Any]: Decoded JWT payload containing sub, exp, iat, and optional claims

    Raises:
        ExpiredSignatureError: If token has expired (exp < current time)
        InvalidTokenError: If token signature is invalid or token is malformed
        ValueError: If sub claim is missing or malformed, or both RS256 and HS256 failed
    """
    settings = get_settings()
    payload = None
    last_error = None

    # Try RS256 with JWKS first (production approach)
    try:
        logger.debug("Attempting RS256 verification with JWKS")
        jwks_client = PyJWKClient(settings.better_auth_jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)

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
        logger.debug("Successfully verified with RS256")

    except (httpx.RequestError, InvalidTokenError) as e:
        logger.debug("RS256 verification failed: %s. Trying HS256 fallback...", str(e))
        last_error = e

        # Fallback to HS256 with shared secret (development approach)
        # This works around WSL2/environment issues where JWKS fetching fails
        secret = settings.better_auth_secret
        if secret:
            try:
                logger.debug("Attempting HS256 verification with shared secret")
                payload = jwt.decode(
                    token,
                    secret,
                    algorithms=["HS256"],
                    options={
                        "verify_signature": True,
                        "verify_exp": True,
                        "verify_iat": True,
                        "require": ["exp", "iat"],
                    },
                )
                logger.debug("Successfully verified with HS256")
            except InvalidTokenError as hs_error:
                logger.warning("Both RS256 and HS256 verification failed")
                last_error = hs_error

    # Check for expiration separately to provide clear error message
    if payload is None and isinstance(last_error, ExpiredSignatureError):
        logger.warning("JWT token expired")
        raise last_error

    # If both methods failed, raise the last error
    if payload is None:
        logger.error("JWT validation failed with both RS256 and HS256: %s", str(last_error))
        raise last_error if last_error else InvalidTokenError("Unable to verify token")

    # Validate required sub claim
    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str) or len(user_id) == 0:
        raise ValueError("Invalid token: missing or malformed user ID claim")

    return payload
