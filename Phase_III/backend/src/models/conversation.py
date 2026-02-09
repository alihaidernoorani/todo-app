"""Conversation SQLModel table definition."""

from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """Database table model for conversation sessions.

    Represents a chat session between a user and the AI assistant.
    A user can have multiple conversations to organize different topics or chat sessions.

    Relationships:
        - One conversation has many messages (one-to-many)
        - Messages are automatically deleted when conversation is deleted (CASCADE)
    """

    __tablename__ = "conversations"

    # Auto-incrementing integer primary key
    id: int | None = Field(default=None, primary_key=True)

    # Owner of the conversation (from JWT auth)
    # Indexed for efficient user-scoped queries
    user_id: str = Field(nullable=False, index=True)

    # Auto-populated on creation with current UTC timestamp
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Last activity timestamp
    # Should be updated by application layer when messages are added
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
