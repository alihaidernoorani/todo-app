"""FastAPI dependency injection functions."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends, Path
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
) -> str:
    """
    Verify JWT authentication and authorization for user-scoped resources.

    This dependency combines:
    1. JWT authentication and authorization (via verify_user_access)
    2. User ID validation (string format from Better Auth)

    Args:
        user_id: User ID from path parameter (Better Auth string ID)
        authenticated_user: Authenticated user ID from JWT (validated by verify_user_access)

    Returns:
        Validated string user ID of the authenticated user

    Raises:
        HTTPException: 401 if JWT is missing/invalid/expired
        HTTPException: 403 if authenticated user doesn't match user_id
    """
    # verify_user_access already checks authenticated_user == user_id
    # and raises 403 if they don't match, so we can just return the string user_id
    return authenticated_user


# Type aliases for cleaner endpoint signatures
SessionDep = Annotated[AsyncSession, Depends(get_session)]
UserIdDep = Annotated[str, Depends(validate_and_authorize_user)]
