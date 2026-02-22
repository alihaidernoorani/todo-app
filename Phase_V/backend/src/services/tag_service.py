"""Tag service — normalize, upsert, and manage task tags.

T038: TagService provides tag normalization and M2M management
between Task and Tag entities.
"""

import logging
from uuid import UUID, uuid4

from sqlalchemy import delete
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from src.models.tag import Tag, TaskTag

logger = logging.getLogger(__name__)


class TagService:
    """Manage Tag entities and Task ↔ Tag M2M associations."""

    def normalize_tag(self, name: str) -> str:
        """Normalize a tag name to lowercase stripped form."""
        return name.strip().lower()

    async def get_or_create_tag(
        self, user_id: str, name: str, session: AsyncSession
    ) -> Tag:
        """Return an existing Tag or create a new one.

        Args:
            user_id: Owning user's ID
            name: Raw tag name (will be normalized)
            session: Async DB session

        Returns:
            Tag instance (existing or newly created)
        """
        normalized = self.normalize_tag(name)
        stmt = select(Tag).where(Tag.user_id == user_id, Tag.name == normalized)
        result = await session.exec(stmt)
        tag = result.first()
        if tag is None:
            tag = Tag(id=uuid4(), user_id=user_id, name=normalized)
            session.add(tag)
            await session.flush()
            await session.refresh(tag)
        return tag

    async def set_task_tags(
        self,
        task_id: UUID,
        user_id: str,
        tag_names: list[str],
        session: AsyncSession,
    ) -> list[Tag]:
        """Replace all tags on a task with the provided list.

        Normalizes all names, upserts Tags, removes old TaskTag entries,
        and inserts new ones.

        Args:
            task_id: Task UUID
            user_id: Owning user's ID
            tag_names: Raw tag names
            session: Async DB session

        Returns:
            List of Tag instances now associated with the task
        """
        # Remove existing tags for this task
        del_stmt = delete(TaskTag).where(TaskTag.task_id == task_id)
        await session.exec(del_stmt)  # type: ignore[arg-type]

        if not tag_names:
            return []

        tags: list[Tag] = []
        for name in tag_names:
            if not name.strip():
                continue
            tag = await self.get_or_create_tag(user_id, name, session)
            junction = TaskTag(task_id=task_id, tag_id=tag.id)
            session.add(junction)
            tags.append(tag)

        await session.flush()
        return tags

    async def get_task_tags(
        self, task_id: UUID, session: AsyncSession
    ) -> list[Tag]:
        """Return all tags currently associated with a task.

        Args:
            task_id: Task UUID
            session: Async DB session

        Returns:
            List of Tag instances
        """
        stmt = (
            select(Tag)
            .join(TaskTag, TaskTag.tag_id == Tag.id)
            .where(TaskTag.task_id == task_id)
        )
        result = await session.exec(stmt)
        return list(result.all())

    async def remove_tag_from_task(
        self,
        task_id: UUID,
        tag_id: UUID,
        session: AsyncSession,
    ) -> None:
        """Remove a specific tag from a task.

        Args:
            task_id: Task UUID
            tag_id: Tag UUID to remove
            session: Async DB session
        """
        del_stmt = delete(TaskTag).where(
            TaskTag.task_id == task_id, TaskTag.tag_id == tag_id
        )
        await session.exec(del_stmt)  # type: ignore[arg-type]
        await session.flush()


# Module-level singleton
tag_service = TagService()
