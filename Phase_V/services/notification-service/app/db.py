"""Database engine and session factory for notification-service.

T051: SQLModel engine using DATABASE_URL env var.
"""

import logging
import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

logger = logging.getLogger(__name__)

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/todo")

_db_url = DATABASE_URL
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    _db_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=3,
    max_overflow=5,
)


async def create_tables() -> None:
    """Create all SQLModel tables on startup."""
    from app.models.notification import Notification  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    logger.info("notification-service: database tables created/verified")


async def get_session() -> AsyncGenerator[AsyncSession]:
    """Get an async database session."""
    async with AsyncSession(engine) as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
