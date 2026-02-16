"""Message SQLModel table definition."""

from datetime import UTC, datetime

from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlmodel import Field, SQLModel


class Message(SQLModel, table=True):
    """Database table model for conversation messages.

    Represents a single message in a conversation, sent by either the user or the AI assistant.
    Messages are ordered chronologically to reconstruct conversation history.

    Relationships:
        - Each message belongs to exactly one conversation (many-to-one)
        - Foreign key constraint ensures messages cannot exist without a conversation
        - CASCADE DELETE: messages are auto-deleted when parent conversation is deleted

    Security:
        - Always filter by user_id to prevent cross-user data access
        - Verify message.user_id matches conversation.user_id at application layer
    """

    __tablename__ = "messages"

    # Auto-incrementing integer primary key
    id: int | None = Field(default=None, primary_key=True)

    # Parent conversation reference
    # ON DELETE CASCADE ensures messages are removed when conversation is deleted
    # Indexed for efficient conversation history queries
    conversation_id: int = Field(
        sa_column=Column(
            Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
        )
    )

    # Message owner (should match parent conversation.user_id)
    # Indexed for efficient user-scoped queries
    user_id: str = Field(sa_column=Column(String, nullable=False, index=True))

    # Sender role: "user" or "assistant"
    # Validated at application layer via Pydantic models
    role: str = Field(nullable=False)

    # Message text content (PostgreSQL TEXT type, no length limit)
    # Consider 100KB max limit at API layer
    content: str = Field(sa_column=Column(Text, nullable=False))

    # Auto-populated on creation with current UTC timestamp
    # Used for chronological ordering of messages
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
