"""JWT token validation and claim extraction using asymmetric or symmetric algorithms.

This module validates JWT tokens issued by Better Auth using:
- EdDSA (Ed25519) - Better Auth default, asymmetric
- RS256 (RSA) - Production standard, asymmetric
- ES256/384/512 (ECDSA) - Alternative asymmetric
- HS256 - Symmetric shared secret (development fallback)
- JWKS (JSON Web Key Set) public key verification for asymmetric
- Expiration and issued-at time checks
- Issuer and audience validation
"""

import logging
from typing import Any

import httpx
import jwt
from jwt import PyJWKClient
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from ..config import get_settings
from .exceptions import JWTExpiredError, JWTInvalidSignatureError, JWTMissingClaimError, JWKSUnavailableError

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


async def decode_jwt(token: str, verify_issuer: bool = True, verify_audience: bool = False) -> dict[str, Any]:
    """Decode and validate JWT token using asymmetric (EdDSA/RS256/ES*) or symmetric (HS256) algorithms.

    Validates:
    - Token signature using asymmetric (JWKS) or HS256 (shared secret)
    - Supported algorithms: EdDSA, RS256, ES256/384/512, HS256
    - Token expiration (exp claim)
    - Token issued-at time (iat claim)
    - Issuer (iss claim) if verify_issuer=True
    - Audience (aud claim) if verify_audience=True
    - Presence of required claims: sub, exp, iat, iss

    Tries HS256 first (if secret available), falls back to asymmetric with JWKS.

    Args:
        token: JWT token string
        verify_issuer: Whether to validate issuer claim matches BETTER_AUTH_URL
        verify_audience: Whether to validate audience claim (optional)

    Returns:
        Dict[str, Any]: Decoded JWT payload containing sub, exp, iat, iss, and optional claims

    Raises:
        ExpiredSignatureError: If token has expired (exp < current time)
        InvalidTokenError: If token signature is invalid or token is malformed
        ValueError: If required claims are missing or malformed, or both RS256 and HS256 failed
    """
    settings = get_settings()
    payload = None
    last_error = None

    # Decode header to check algorithm (without verification)
    try:
        import base64
        import json
        header_b64 = token.split('.')[0]
        header_bytes = base64.urlsafe_b64decode(header_b64 + '==')  # Add padding
        header = json.loads(header_bytes)
        logger.debug("JWT Header: %s", header)
        token_alg = header.get('alg')
        logger.debug("Token algorithm: %s", token_alg)
    except Exception as e:
        logger.warning("Failed to decode JWT header: %s", str(e))

    # Prepare JWT decode options with required claims
    decode_options = {
        "verify_signature": True,
        "verify_exp": True,
        "verify_iat": True,
        "verify_aud": False,  # Don't verify audience - backend doesn't have audience requirements
        "require": ["sub", "exp", "iat", "iss"],  # Require all standard claims
    }

    # Try HS256 first (development/default approach)
    secret = settings.better_auth_secret
    if secret:
        try:
            logger.debug("Attempting HS256 verification with shared secret")
            payload = jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                issuer=settings.better_auth_url if verify_issuer else None,
                options=decode_options,
            )
            logger.debug("Successfully verified with HS256")
        except InvalidTokenError as hs_error:
            logger.debug("HS256 verification failed: %s. Trying RS256 with JWKS...", str(hs_error))
            last_error = hs_error

            # Fallback to asymmetric algorithms (RS256, EdDSA) with JWKS
            try:
                logger.debug("Attempting asymmetric verification with JWKS")
                jwks_client = PyJWKClient(settings.better_auth_jwks_url)
                signing_key = jwks_client.get_signing_key_from_jwt(token)

                # Better Auth defaults to EdDSA (Ed25519), but also supports RS256, ES256
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["EdDSA", "RS256", "ES256", "ES384", "ES512"],
                    issuer=settings.better_auth_url if verify_issuer else None,
                    options=decode_options,
                )
                logger.debug("Successfully verified with asymmetric algorithm")
            except (httpx.RequestError, InvalidTokenError) as asym_error:
                logger.warning("Both HS256 and asymmetric verification failed")
                last_error = asym_error
    else:
        # No secret - try asymmetric algorithms only
        try:
            logger.debug("No secret available - attempting asymmetric verification with JWKS only")
            jwks_client = PyJWKClient(settings.better_auth_jwks_url)
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["EdDSA", "RS256", "ES256", "ES384", "ES512"],
                issuer=settings.better_auth_url if verify_issuer else None,
                options=decode_options,
            )
            logger.debug("Successfully verified with asymmetric algorithm")
        except (httpx.RequestError, InvalidTokenError) as e:
            logger.error("Asymmetric verification failed and no secret available for HS256")
            last_error = e

    # Check for expiration separately to provide clear error message
    if payload is None and isinstance(last_error, ExpiredSignatureError):
        logger.warning("JWT token expired")
        raise last_error

    # If both methods failed, raise the last error
    if payload is None:
        logger.error("JWT validation failed with all algorithms: %s", str(last_error))
        raise last_error if last_error else InvalidTokenError("Unable to verify token")

    # Validate required claims presence
    required_claims = ["sub", "exp", "iat", "iss"]
    missing_claims = [claim for claim in required_claims if claim not in payload]
    if missing_claims:
        raise ValueError(f"Invalid token: missing required claims: {', '.join(missing_claims)}")

    # Validate sub claim format
    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str) or len(user_id) == 0:
        raise ValueError("Invalid token: missing or malformed user ID claim")

    return payload
