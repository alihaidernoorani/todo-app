"""Authentication test endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from src.auth import get_current_user
from src.auth.models import AuthenticatedUser

router = APIRouter()


@router.get("/me")
async def get_current_user_info(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
) -> dict[str, str]:
    """Test endpoint to verify JWT authentication.

    Returns the authenticated user's information extracted from JWT token claims.

    Args:
        user: Authenticated user from JWT token (injected)

    Returns:
        Dict containing user_id, email, and name from JWT claims

    Responses:
        200: Successfully authenticated, returns user information
        401: Missing, expired, or invalid JWT token
        503: JWKS endpoint unavailable
    """
    return {
        "user_id": user.user_id,
        "email": user.email,
        "name": user.name or "",
    }
