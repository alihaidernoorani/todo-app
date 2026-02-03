"""FastAPI dependency injection functions."""

from collections.abc import AsyncGenerator
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Path, status
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth import verify_user_access
from src.database import get_session as db_get_session


async def get_session() -> AsyncGenerator[AsyncSession]:
    """Get database session dependency."""
    async for session in db_get_session():
        yield session


async def validate_and_authorize_user(
    user_id: Annotated[str, Path(description="User ID who owns the tasks")],
    authenticated_user: Annotated[str, Depends(verify_user_access)],
) -> UUID:
    """
    Validate user_id format and verify JWT authentication.

    This dependency combines:
    1. JWT authentication and authorization (via verify_user_access)
    2. User ID validation (UUID format)

    Args:
        user_id: User ID from path parameter
        authenticated_user: Authenticated user ID (validated by verify_user_access)

    Returns:
        Validated UUID of the authenticated user

    Raises:
        HTTPException: 400 if user_id is not a valid UUID format
        HTTPException: 401 if JWT is missing/invalid/expired
        HTTPException: 403 if authenticated user doesn't match user_id
    """
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format",
        )

    # verify_user_access already checks authenticated_user == user_id
    # and raises 403 if they don't match, so we can just return the UUID
    return user_uuid


# Type aliases for cleaner endpoint signatures
SessionDep = Annotated[AsyncSession, Depends(get_session)]
UserIdDep = Annotated[UUID, Depends(validate_and_authorize_user)]
