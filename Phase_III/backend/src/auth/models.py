"""
Authentication Data Models

Pydantic models for Better Auth session responses and authenticated user data.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserData(BaseModel):
    """User data from Better Auth session response"""
    id: str = Field(..., description="User ID from Better Auth (sub claim)")
    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User display name")


class SessionData(BaseModel):
    """Session data from Better Auth session response"""
    expiresAt: datetime = Field(..., description="Session expiration timestamp")


class BetterAuthSessionResponse(BaseModel):
    """
    Complete response from Better Auth's `/api/auth/session` endpoint.

    Better Auth returns this structure when a session is valid.
    """
    user: UserData = Field(..., description="User identity data")
    session: SessionData = Field(..., description="Session metadata")


class AuthenticatedUser(BaseModel):
    """
    Authenticated user data used in FastAPI dependencies.

    This is the simplified user context passed to route handlers.
    """
    user_id: str = Field(..., description="User ID from Better Auth session")
    email: str = Field(..., description="User email address")
    name: Optional[str] = Field(None, description="User display name")
