"""Tags CRUD endpoints.

T041: Exposes GET /api/{user_id}/tags and DELETE /api/{user_id}/tags/{tag_id}.
"""

from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlmodel import col, select

from src.api.deps import AuthorizedUserDep, SessionDep
from src.models.tag import Tag
from src.schemas.task import TagRead

router = APIRouter()


@router.get("", response_model=list[TagRead])
async def list_tags(
    session: SessionDep,
    user: AuthorizedUserDep,
) -> list[TagRead]:
    """List all tags for the current user."""
    stmt = select(Tag).where(Tag.user_id == user.user_id).order_by(col(Tag.name))
    result = await session.exec(stmt)
    tags = result.all()
    return [TagRead(id=t.id, user_id=t.user_id, name=t.name) for t in tags]


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: UUID,
    session: SessionDep,
    user: AuthorizedUserDep,
) -> None:
    """Remove a tag and its associations from all tasks for this user."""
    stmt = select(Tag).where(Tag.id == tag_id, Tag.user_id == user.user_id)
    result = await session.exec(stmt)
    tag = result.first()
    if tag is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await session.delete(tag)
    await session.flush()
