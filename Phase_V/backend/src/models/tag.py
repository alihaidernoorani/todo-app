"""Tag and TaskTag SQLModel table definitions.

T037: Tag (per user, normalized lowercase) and TaskTag M2M junction.
"""

from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

class TaskTag(SQLModel, table=True):
    """Junction table for Task ↔ Tag M2M relationship."""

    __tablename__ = "task_tags"

    task_id: UUID = Field(
        foreign_key="tasks.id",
        primary_key=True,
        ondelete="CASCADE",
    )
    tag_id: UUID = Field(
        foreign_key="tags.id",
        primary_key=True,
        ondelete="CASCADE",
    )

class Tag(SQLModel, table=True):
    """Tag entity — scoped to a user, normalized to lowercase."""

    __tablename__ = "tags"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    name: str = Field(max_length=50, nullable=False)  # stored lowercase

    # M2M relationship to Task via TaskTag
    tasks: list["Task"] = Relationship(  # type: ignore[name-defined]
        back_populates="tags", link_model=TaskTag
    )
