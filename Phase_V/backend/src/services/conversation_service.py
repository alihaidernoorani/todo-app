"""Conversation service for managing conversation lifecycle.

Provides functions to get or create conversations with ownership validation.
"""

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.conversation import Conversation


async def get_or_create_conversation(
    db: AsyncSession,
    user_id: str,
    conversation_id: int | None,
) -> Conversation:
    """Get an existing conversation or create a new one.

    If conversation_id is None, inserts a new Conversation row for the user.
    If conversation_id is provided, fetches it and verifies ownership.

    Args:
        db: Async database session
        user_id: Authenticated user's ID (from JWT sub)
        conversation_id: Existing conversation ID, or None to create new

    Returns:
        Conversation model instance

    Raises:
        HTTPException(404): If conversation_id not found
        HTTPException(403): If conversation belongs to a different user
    """
    if conversation_id is None:
        conversation = Conversation(user_id=user_id)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    result = await db.exec(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    if conversation.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: conversation belongs to another user",
        )

    return conversation
