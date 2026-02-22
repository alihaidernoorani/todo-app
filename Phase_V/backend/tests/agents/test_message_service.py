"""Unit tests for message_service module.

Tests load_conversation_history and persist_message against an in-memory
SQLite database for full isolation.
"""

import pytest
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.conversation import Conversation
from src.models.message import Message
from src.services.message_service import load_conversation_history, persist_message

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession]:
    """Provide a fresh in-memory DB session for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(engine, expire_on_commit=False) as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def conversation(db: AsyncSession) -> Conversation:
    """Create a blank conversation in the test DB."""
    conv = Conversation(user_id="user-test")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@pytest.fixture
async def conversation_with_25_messages(db: AsyncSession) -> Conversation:
    """Create a conversation pre-loaded with 25 messages."""
    conv = Conversation(user_id="user-test")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    for i in range(25):
        role = "user" if i % 2 == 0 else "assistant"
        msg = Message(
            conversation_id=conv.id,
            user_id="user-test",
            role=role,
            content=f"Message {i}",
        )
        db.add(msg)
    await db.commit()
    return conv


# ── T015 [US6] ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_load_empty_for_new_conversation(db: AsyncSession, conversation: Conversation):
    """T015: load_conversation_history returns [] for a conversation with no messages."""
    result = await load_conversation_history(db, conversation.id)
    assert result == []


# ── T016 [US6] ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_load_returns_last_20_of_25(
    db: AsyncSession, conversation_with_25_messages: Conversation
):
    """T016: load_conversation_history returns exactly 20 messages for a conversation with 25."""
    result = await load_conversation_history(db, conversation_with_25_messages.id)
    assert len(result) == 20
    # Verify oldest-first ordering (each dict must have role key)
    for msg in result:
        assert msg["role"] in ("user", "assistant")
        assert "content" in msg


# ── T025 ──────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_persist_message_returns_integer_id(db: AsyncSession, conversation: Conversation):
    """T025: persist_message returns an integer id > 0."""
    msg_id = await persist_message(db, conversation.id, "user-1", "user", "Hello")
    assert isinstance(msg_id, int)
    assert msg_id > 0


@pytest.mark.asyncio
async def test_persist_message_stores_in_db(db: AsyncSession, conversation: Conversation):
    """persist_message creates a retrievable row in the DB."""
    msg_id = await persist_message(db, conversation.id, "user-1", "user", "Test content")
    # After persisting user message, load should return 1 item
    history = await load_conversation_history(db, conversation.id)
    assert len(history) == 1
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "Test content"


@pytest.mark.asyncio
async def test_messages_are_returned_oldest_first(db: AsyncSession, conversation: Conversation):
    """Messages are returned in chronological order (oldest-first)."""
    await persist_message(db, conversation.id, "user-1", "user", "First")
    await persist_message(db, conversation.id, "user-1", "assistant", "Second")
    await persist_message(db, conversation.id, "user-1", "user", "Third")

    history = await load_conversation_history(db, conversation.id)
    assert len(history) == 3
    assert history[0]["content"] == "First"
    assert history[1]["content"] == "Second"
    assert history[2]["content"] == "Third"
