"""
FastAPI Authentication Dependencies

Reusable dependencies for session validation and user ID scoping.
All authentication is delegated to Better Auth - no custom JWT parsing.
"""

from fastapi import Depends, HTTPException, Request, status
from typing import Annotated
from urllib.parse import unquote

from ..config import get_settings, Settings
from .session_validator import validate_session, ServiceUnavailableError, InvalidSessionError
from .models import AuthenticatedUser


async def get_current_user(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)]
) -> AuthenticatedUser:
    """
    FastAPI dependency to validate user session via Better Auth.

    Extracts cookies from the incoming request and forwards them to Better Auth's
    session endpoint for validation. No custom JWT parsing is performed.

    Args:
        request: FastAPI request containing cookies
        settings: Application settings (injected)

    Returns:
        AuthenticatedUser object with user_id, email, and name

    Raises:
        HTTPException(401): If session is invalid, expired, or missing
        HTTPException(503): If Better Auth is unreachable

    Example:
        @app.get("/protected")
        async def protected_route(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
            return {"user_id": user.user_id, "email": user.email}
    """

    # Extract cookies from request
    cookies = dict(request.cookies)

    if not cookies:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials"
        )

    try:
        # Call Better Auth session endpoint to validate session
        user = await validate_session(
            cookies=cookies,
            better_auth_url=settings.session_endpoint_url
        )

        if user is None:
            # Better Auth returned 401 - session is invalid
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )

        return user

    except ServiceUnavailableError as e:
        # Better Auth is unreachable or returned server error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Authentication service unavailable: {str(e)}"
        )

    except InvalidSessionError as e:
        # Session format is invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid session format: {str(e)}"
        )


async def get_current_user_with_path_validation(
    request: Request,
    settings: Annotated[Settings, Depends(get_settings)]
) -> AuthenticatedUser:
    """
    FastAPI dependency for user ID scoping with path parameter validation.

    Validates session via Better Auth and ensures authenticated user_id matches
    the {user_id} path parameter. This prevents horizontal privilege escalation.

    Args:
        request: FastAPI request containing cookies and path parameters
        settings: Application settings (injected)

    Returns:
        AuthenticatedUser object with user_id, email, and name

    Raises:
        HTTPException(401): If session is invalid, expired, or missing
        HTTPException(403): If authenticated user_id doesn't match path user_id
        HTTPException(503): If Better Auth is unreachable

    Example:
        # Router configured with: prefix="/{user_id}/tasks"
        @router.get("")
        async def list_tasks(
            user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)]
        ):
            # user.user_id is guaranteed to match path user_id
            return {"tasks": [...]}
    """

    # First authenticate the user
    user = await get_current_user(request, settings)

    # Extract user_id from path parameters
    path_user_id = request.path_params.get("user_id")

    if not path_user_id:
        # If no user_id in path, just return authenticated user
        return user

    # URL-decode the path parameter before comparison
    decoded_path_user_id = unquote(path_user_id)

    # Validate that session user matches path user
    if user.user_id != decoded_path_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: cannot access another user's resources"
        )

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
