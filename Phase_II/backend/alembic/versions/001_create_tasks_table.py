"""create tasks table

Revision ID: 001
Revises:
Create Date: 2026-01-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
    )

    op.create_index("idx_task_user_id", "tasks", ["user_id"])
    op.create_index("idx_task_user_created", "tasks", ["user_id", sa.text("created_at DESC")])


def downgrade() -> None:
    op.drop_index("idx_task_user_created", table_name="tasks")
    op.drop_index("idx_task_user_id", table_name="tasks")
    op.drop_table("tasks")
