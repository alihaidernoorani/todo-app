"""Authentication test endpoints."""

from fastapi import APIRouter, Depends

from src.auth import get_current_user

router = APIRouter()


@router.get("/me")
async def get_current_user_info(current_user_id: str = Depends(get_current_user)) -> dict[str, str]:
    """Test endpoint to verify JWT authentication.

    Returns the authenticated user's ID extracted from the JWT token.

    Responses:
        200: Successfully authenticated, returns user_id
        401: Missing or invalid JWT token
    """
    return {"user_id": current_user_id}
