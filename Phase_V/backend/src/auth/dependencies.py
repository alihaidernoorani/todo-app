"""
FastAPI Authentication Dependencies

Reusable dependencies for JWT token validation and user ID scoping.
Uses RS256 signature verification with JWKS public keys.
"""

import logging
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated
from urllib.parse import unquote
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from ..config import get_settings, Settings
from .jwt_handler import decode_jwt, extract_bearer_token
from .models import AuthenticatedUser
from .exceptions import JWTExpiredError, JWKSUnavailableError

logger = logging.getLogger(__name__)

# HTTPBearer security scheme for extracting Authorization header
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    settings: Annotated[Settings, Depends(get_settings)]
) -> AuthenticatedUser:
    """
    FastAPI dependency to validate JWT tokens from Authorization header.

    Extracts JWT from Authorization: Bearer header and verifies signature
    using RS256 with JWKS public keys. No session endpoint calls.

    Args:
        credentials: HTTP Bearer credentials from Authorization header
        settings: Application settings (injected)

    Returns:
        AuthenticatedUser object with user_id, email, and name

    Raises:
        HTTPException(401): If JWT is invalid, expired, or missing
        HTTPException(503): If JWKS endpoint is unreachable

    Example:
        @app.get("/protected")
        async def protected_route(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
            return {"user_id": user.user_id, "email": user.email}
    """

    try:
        # Extract token from credentials
        token = credentials.credentials

        # Decode and validate JWT token
        # Note: verify_issuer=False because frontend issues with localhost:3000
        # but backend uses frontend:3000 for JWKS. Signature is still verified.
        payload = await decode_jwt(token, verify_issuer=False)

        # Extract user information from JWT claims
        user = AuthenticatedUser(
            user_id=payload["sub"],
            email=payload.get("email", ""),
            name=payload.get("name")
        )

        return user

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )

    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

    except JWKSUnavailableError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}"
        )

    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def get_current_user_with_path_validation(
    request: Request,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
) -> AuthenticatedUser:
    """
    FastAPI dependency for user ID scoping with path parameter validation.

    Validates JWT token and ensures authenticated user_id (from sub claim) matches
    the {user_id} path parameter. This prevents horizontal privilege escalation.

    Args:
        request: FastAPI request containing path parameters
        user: Authenticated user from JWT token (injected)

    Returns:
        AuthenticatedUser object with user_id, email, and name

    Raises:
        HTTPException(401): If JWT is invalid, expired, or missing
        HTTPException(403): If authenticated user_id doesn't match path user_id
        HTTPException(503): If JWKS endpoint is unreachable

    Example:
        # Router configured with: prefix="/{user_id}/tasks"
        @router.get("")
        async def list_tasks(
            user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)]
        ):
            # user.user_id is guaranteed to match path user_id
            return {"tasks": [...]}
    """

    # Extract user_id from path parameters
    path_user_id = request.path_params.get("user_id")

    if not path_user_id:
        # If no user_id in path, just return authenticated user
        return user

    # URL-decode the path parameter before comparison
    decoded_path_user_id = unquote(path_user_id)

    # Validate that JWT user matches path user (JWT-based validation)
    if user.user_id != decoded_path_user_id:
        logger.warning(
            "User ID mismatch detected: JWT sub=%s, path user_id=%s",
            user.user_id,
            decoded_path_user_id
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: JWT user_id does not match path parameter. "
                   "You cannot access another user's resources."
        )

    logger.debug("User ID validation passed: %s", user.user_id)
    return user


def require_user_id_match(user_id: str):
    """
    DEPRECATED: Use get_current_user_with_path_validation instead.

    This factory function cannot be used with path parameters in FastAPI
    due to parameter evaluation order issues.
    """
    raise NotImplementedError(
        "Use get_current_user_with_path_validation dependency instead. "
        "It automatically validates path user_id against session user_id."
    )
