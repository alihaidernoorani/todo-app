"""Message service for loading and persisting conversation messages.

Provides functions to load conversation history from the DB (oldest-first,
limited to last N messages) and to persist individual messages.
"""

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.message import Message


async def load_conversation_history(
    db: AsyncSession,
    conversation_id: int,
    limit: int = 20,
) -> list[dict]:
    """Load the last `limit` messages for a conversation, ordered oldest-first.

    Fetches the most recent messages in descending order and reverses them
    so the returned list is in chronological (oldest-first) order — the
    correct format for the OpenAI Agents SDK conversation history.

    Args:
        db: Async database session
        conversation_id: ID of the conversation to load messages for
        limit: Maximum number of messages to return (default: 20)

    Returns:
        List of dicts with 'role', 'content', and 'created_at' keys,
        ordered oldest-first. Empty list if no messages exist.
    """
    result = await db.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.all()))
    return [
        {
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]


async def persist_message(
    db: AsyncSession,
    conversation_id: int,
    user_id: str,
    role: str,
    content: str,
) -> int:
    """Insert a message row and return its integer ID.

    Args:
        db: Async database session
        conversation_id: Parent conversation ID
        user_id: Owner user ID (from JWT sub)
        role: Message role — "user" or "assistant"
        content: Message text content

    Returns:
        Integer ID of the newly created message row
    """
    message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message.id
