"""Pytest configuration and fixtures for task backend tests."""

import os
from collections.abc import AsyncGenerator
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

# Set test environment before importing app modules
os.environ["NEON_DATABASE_URL"] = "postgresql://test:test@localhost:5432/test_db"

from src.api.deps import get_session
from src.main import app

# Test database engine (SQLite for isolation)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


@pytest.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession]:
    """Create a test database session with fresh tables for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    async with AsyncSession(test_engine) as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            async with test_engine.begin() as conn:
                await conn.run_sync(SQLModel.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    """Create a test client with overridden database session."""

    async def override_get_session() -> AsyncGenerator[AsyncSession]:
        yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def user_id() -> str:
    """Generate a test user ID."""
    return str(uuid4())


@pytest.fixture
def another_user_id() -> str:
    """Generate a different test user ID for isolation tests."""
    return str(uuid4())
