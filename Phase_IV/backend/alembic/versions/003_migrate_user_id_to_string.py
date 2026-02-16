"""migrate user_id from UUID to TEXT

Revision ID: 003
Revises: 002
Create Date: 2026-02-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Convert tasks.user_id from UUID to TEXT to align with Better Auth string IDs."""
    # SQLite doesn't support ALTER COLUMN TYPE directly, so we need to:
    # 1. Create new column
    # 2. Copy data (converting UUID to string)
    # 3. Drop old column
    # 4. Rename new column

    # Check database dialect
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == 'sqlite':
        # SQLite approach: recreate table with new schema
        op.add_column('tasks', sa.Column('user_id_new', sa.String(), nullable=True))

        # Copy data: CAST UUID to TEXT
        op.execute("UPDATE tasks SET user_id_new = CAST(user_id AS TEXT)")

        # Make new column NOT NULL after data migration
        # Note: SQLite requires table recreation for NOT NULL constraint
        with op.batch_alter_table('tasks') as batch_op:
            batch_op.alter_column('user_id_new', nullable=False)

        # Drop old column and rename new column
        with op.batch_alter_table('tasks') as batch_op:
            batch_op.drop_column('user_id')

        with op.batch_alter_table('tasks') as batch_op:
            batch_op.alter_column('user_id_new', new_column_name='user_id')

        # Recreate index on user_id
        op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])

    elif dialect_name == 'postgresql':
        # PostgreSQL approach: ALTER COLUMN TYPE
        op.execute("ALTER TABLE tasks ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT")

    else:
        # Generic approach for other databases (MySQL, etc.)
        op.alter_column('tasks', 'user_id',
                       existing_type=postgresql.UUID(),
                       type_=sa.String(),
                       existing_nullable=False,
                       postgresql_using='user_id::TEXT')


def downgrade() -> None:
    """Rollback: Convert tasks.user_id from TEXT back to UUID."""
    bind = op.get_bind()
    dialect_name = bind.dialect.name

    if dialect_name == 'sqlite':
        # SQLite approach: recreate table
        op.add_column('tasks', sa.Column('user_id_new', sa.String(length=36), nullable=True))

        # Copy data: TEXT to UUID format (assuming valid UUID strings)
        op.execute("UPDATE tasks SET user_id_new = user_id")

        with op.batch_alter_table('tasks') as batch_op:
            batch_op.alter_column('user_id_new', nullable=False)

        with op.batch_alter_table('tasks') as batch_op:
            batch_op.drop_column('user_id')

        with op.batch_alter_table('tasks') as batch_op:
            batch_op.alter_column('user_id_new', new_column_name='user_id')

        op.create_index('ix_tasks_user_id', 'tasks', ['user_id'])

    elif dialect_name == 'postgresql':
        # PostgreSQL: TEXT to UUID
        op.execute("ALTER TABLE tasks ALTER COLUMN user_id TYPE UUID USING user_id::UUID")

    else:
        # Generic approach
        op.alter_column('tasks', 'user_id',
                       existing_type=sa.String(),
                       type_=postgresql.UUID(),
                       existing_nullable=False,
                       postgresql_using='user_id::UUID')
