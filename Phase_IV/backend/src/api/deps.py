"""FastAPI dependency injection functions."""

from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from src.auth import get_current_user, get_current_user_with_path_validation
from src.auth.models import AuthenticatedUser
from src.database import get_session as db_get_session


async def get_session() -> AsyncGenerator[AsyncSession]:
    """Get database session dependency."""
    async for session in db_get_session():
        yield session


# Type aliases for cleaner endpoint signatures
SessionDep = Annotated[AsyncSession, Depends(get_session)]

# For endpoints that need authentication but don't need user ID scoping
AuthUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]

# For user-scoped endpoints, use get_current_user_with_path_validation
# This automatically validates that the session user_id matches the {user_id} in the path
# Example:
#   # Router configured with: prefix="/{user_id}/tasks"
#   @router.get("")
#   async def list_tasks(
#       user: Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)],
#       session: SessionDep
#   ):
#       # user.user_id is guaranteed to match path user_id
#       return await task_service.list_tasks(session, user.user_id)
AuthorizedUserDep = Annotated[AuthenticatedUser, Depends(get_current_user_with_path_validation)]
