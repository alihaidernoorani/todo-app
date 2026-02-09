# Data Model: Backend and Database for Phase 2

**Feature Branch**: `002-backend-database`
**Date**: 2026-01-24
**Status**: Complete (Revised v2.0)
**Revision**: Updated to use `tasks` table naming

## Entity Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          Task                                │
├─────────────────────────────────────────────────────────────┤
│ id: UUID (PK)                                               │
│ title: VARCHAR(255) NOT NULL                                │
│ description: VARCHAR(2000) NULL                             │
│ is_completed: BOOLEAN NOT NULL DEFAULT FALSE                │
│ created_at: TIMESTAMP WITH TIME ZONE NOT NULL               │
│ user_id: UUID NOT NULL (FK → external users table)          │
├─────────────────────────────────────────────────────────────┤
│ INDEXES:                                                     │
│   - idx_task_user_id ON (user_id)                           │
│   - idx_task_user_created ON (user_id, created_at DESC)     │
└─────────────────────────────────────────────────────────────┘
```

## Entity: Task

### Description
Represents a task item owned by a user. The Task entity is the primary data object for the todo application, storing task information with strict user ownership for data isolation.

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, auto-generated | Unique identifier for the task item |
| `title` | VARCHAR(255) | NOT NULL, min 1 char | The title/name of the task |
| `description` | VARCHAR(2000) | NULLABLE | Optional detailed description of the task |
| `is_completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether the task has been completed |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, auto-generated | When the task was created |
| `user_id` | UUID | NOT NULL, INDEXED | Reference to the owning user |

### Validation Rules

| Field | Rule | Source |
|-------|------|--------|
| `title` | Required, non-empty, max 255 characters | FR-016, FR-017 |
| `description` | Optional, max 2000 characters when provided | FR-018 |
| `id` | Must be valid UUID format | FR-019 |
| `user_id` | Required for all operations | FR-015 |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `pk_task` | `id` | Primary key lookup |
| `idx_task_user_id` | `user_id` | Fast filtering by user (data isolation) |
| `idx_task_user_created` | `user_id`, `created_at DESC` | Efficient user task listing with default sort |

### State Transitions

```
┌──────────────┐
│   Created    │ ───── is_completed: false (default)
└──────┬───────┘
       │
       │ PATCH /complete (toggle)
       ▼
┌──────────────┐
│  Completed   │ ───── is_completed: true
└──────┬───────┘
       │
       │ PATCH /complete (toggle)
       ▼
┌──────────────┐
│ Reopened     │ ───── is_completed: false
└──────────────┘
```

Note: Tasks can freely transition between completed and incomplete states via the dedicated toggle endpoint. There is no "archived" or "deleted" soft-state; deletion is permanent.

## SQLModel Class Definition

```python
from datetime import datetime, UTC
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field

class TaskBase(SQLModel):
    """Base model with shared fields for create/update operations."""
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)

class Task(TaskBase, table=True):
    """Database table model for Task entity."""
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    user_id: UUID = Field(index=True, nullable=False)

class TaskCreate(TaskBase):
    """Schema for creating a new task (request body)."""
    pass  # Inherits title (required) and description (optional)

class TaskUpdate(SQLModel):
    """Schema for PUT update - all fields required."""
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool

class TaskRead(TaskBase):
    """Schema for reading a task (response body)."""
    id: UUID
    is_completed: bool
    created_at: datetime
    user_id: UUID

class TaskList(SQLModel):
    """Schema for listing tasks."""
    items: list[TaskRead]
    count: int
```

## Database Schema (SQL)

```sql
-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_task_user_id
    ON tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_task_user_created
    ON tasks(user_id, created_at DESC);

-- Add check constraint for title length
ALTER TABLE tasks
    ADD CONSTRAINT chk_title_not_empty
    CHECK (length(trim(title)) > 0);
```

## Alembic Migration Template

```python
"""create tasks table

Revision ID: 001
Revises:
Create Date: 2026-01-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'tasks',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.String(2000), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=False,
                  server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
    )

    op.create_index('idx_task_user_id', 'tasks', ['user_id'])
    op.create_index('idx_task_user_created', 'tasks',
                    ['user_id', sa.text('created_at DESC')])

def downgrade() -> None:
    op.drop_index('idx_task_user_created')
    op.drop_index('idx_task_user_id')
    op.drop_table('tasks')
```

## Relationships

### Current Feature
- **Task → User**: Many-to-one relationship via `user_id` foreign key
  - Note: The User table is defined in a separate authentication feature
  - No explicit FK constraint until auth feature is implemented
  - user_id is treated as an opaque UUID reference

### Future Considerations (Out of Scope)
- Task categories/tags (many-to-many)
- Task subtasks (self-referential)
- Task sharing between users

## Data Isolation Pattern

All queries MUST include user_id filtering to ensure data isolation:

```python
# CORRECT: Always filter by user_id
select(Task).where(Task.user_id == user_id)

# INCORRECT: Never query without user_id
select(Task)  # ❌ Exposes all users' data

# CORRECT: Combined filters for single-item operations
select(Task).where(Task.id == task_id, Task.user_id == user_id)

# INCORRECT: Fetch first, then check ownership
task = select(Task).where(Task.id == task_id)  # ❌ Information leakage risk
```
