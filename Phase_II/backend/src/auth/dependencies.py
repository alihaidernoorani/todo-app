"""FastAPI dependencies for authentication and authorization."""

import logging

from fastapi import Depends, Header, HTTPException, status
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from .jwt_handler import decode_jwt, extract_bearer_token

logger = logging.getLogger(__name__)


async def get_current_user(authorization: str | None = Header(None)) -> str:
    """Extract and validate JWT token from Authorization header.

    This is the base authentication dependency. Use this for endpoints
    that require authentication but not user-scoped authorization.

    Args:
        authorization: Authorization header value (format: "Bearer <token>")

    Returns:
        str: User ID extracted from JWT user_id claim

    Raises:
        HTTPException (401): Authentication failed

    Example:
        @router.get("/api/me")
        async def get_my_profile(current_user_id: str = Depends(get_current_user)):
            return {"user_id": current_user_id}
    """
    try:
        # Extract token from Authorization header
        token = extract_bearer_token(authorization)

        # Decode and validate JWT using JWKS
        payload = await decode_jwt(token)

        # Extract user ID from sub claim (standard JWT subject)
        # Better Auth uses 'sub' per OIDC standard
        user_id = payload["sub"]

        return user_id

    except ValueError as e:
        # Handle missing token or invalid header format
        error_message = str(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error_message,
            headers={"WWW-Authenticate": "Bearer"},
        )

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature",
            headers={"WWW-Authenticate": "Bearer"},
        )

    except Exception as e:
        # Catch-all for unexpected errors (including JWKS fetch failures)
        logger.error("Unexpected error during authentication: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def verify_user_access(
    user_id: str,
    current_user_id: str = Depends(get_current_user),
) -> str:
    """Verify authenticated user can access requested user's resources.

    This dependency combines authentication + authorization. Use this for
    user-scoped endpoints (e.g., /users/{user_id}/tasks).

    Args:
        user_id: User ID from path parameter {user_id}
        current_user_id: Will be populated by get_current_user dependency

    Returns:
        str: Authenticated user ID (guaranteed to match user_id)

    Raises:
        HTTPException (401): Authentication failed (from get_current_user)
        HTTPException (403): User attempting to access another user's resources

    Example:
        @router.get("/api/users/{user_id}/tasks")
        async def get_user_tasks(
            user_id: str,
            authenticated_user: str = Depends(verify_user_access)
        ):
            # authenticated_user is guaranteed to equal user_id
            return {"user_id": authenticated_user, "tasks": []}
    """
    # Check if authenticated user matches the requested user_id
    if current_user_id != user_id:
        logger.warning(
            "Authorization failed: user %s attempted to access user %s's resources",
            current_user_id,
            user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: cannot access another user's resources",
        )

    return current_user_id
