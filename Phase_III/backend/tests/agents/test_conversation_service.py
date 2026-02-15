"""Unit tests for conversation_service module.

Tests get_or_create_conversation covering:
1. conversation_id=None → new Conversation row
2. Existing conversation with wrong user_id → HTTPException 403
3. Non-existent conversation_id → HTTPException 404
"""

import pytest
from collections.abc import AsyncGenerator
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.conversation import Conversation
from src.services.conversation_service import get_or_create_conversation

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
async def existing_conv(db: AsyncSession) -> Conversation:
    """Create a conversation owned by 'user-1'."""
    conv = Conversation(user_id="user-1")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


# ── T022 case 1 ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_creates_new_conversation_when_id_is_none(db: AsyncSession):
    """conversation_id=None → inserts new Conversation with non-null id."""
    conv = await get_or_create_conversation(db, user_id="user-1", conversation_id=None)
    assert conv.id is not None
    assert isinstance(conv.id, int)
    assert conv.user_id == "user-1"


# ── T022 case 2 ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_returns_403_for_wrong_owner(db: AsyncSession, existing_conv: Conversation):
    """Existing conversation accessed by wrong user raises HTTPException 403."""
    with pytest.raises(HTTPException) as exc_info:
        await get_or_create_conversation(db, user_id="user-2", conversation_id=existing_conv.id)
    assert exc_info.value.status_code == 403
    assert "another user" in exc_info.value.detail


# ── T022 case 3 ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_returns_404_for_missing_conversation(db: AsyncSession):
    """Non-existent conversation_id raises HTTPException 404."""
    with pytest.raises(HTTPException) as exc_info:
        await get_or_create_conversation(db, user_id="user-1", conversation_id=99999)
    assert exc_info.value.status_code == 404
    assert "not found" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_returns_existing_conversation_for_correct_owner(
    db: AsyncSession, existing_conv: Conversation
):
    """Correct owner accessing existing conversation returns the conversation."""
    conv = await get_or_create_conversation(
        db, user_id="user-1", conversation_id=existing_conv.id
    )
    assert conv.id == existing_conv.id
    assert conv.user_id == "user-1"
