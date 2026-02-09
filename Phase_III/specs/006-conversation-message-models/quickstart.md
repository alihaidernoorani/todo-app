# Quickstart: Conversation and Message Models

**Feature**: 006-conversation-message-models
**Date**: 2026-02-09

## Overview

This guide walks you through implementing and testing the Conversation and Message database models for Phase III's AI chatbot.

---

## Prerequisites

- Python 3.13+ installed
- PostgreSQL database (Neon or local) configured
- Existing Phase II backend setup complete
- Alembic migration tool configured
- Database connection string in `.env`

---

## Implementation Steps

### Step 1: Create Model Files

Create two new files in the models directory:

**File**: `backend/src/models/conversation.py`

```python
"""Conversation SQLModel table definition."""

from datetime import UTC, datetime
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """Database table model for conversation sessions."""

    __tablename__ = "conversations"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(nullable=False, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
```

**File**: `backend/src/models/message.py`

```python
"""Message SQLModel table definition."""

from datetime import UTC, datetime
from sqlalchemy import Text
from sqlmodel import Field, SQLModel


class Message(SQLModel, table=True):
    """Database table model for conversation messages."""

    __tablename__ = "messages"

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(
        foreign_key="conversations.id",
        nullable=False,
        index=True,
        sa_column_kwargs={"ondelete": "CASCADE"}
    )
    user_id: str = Field(nullable=False, index=True)
    role: str = Field(nullable=False)  # "user" or "assistant"
    content: str = Field(nullable=False, sa_column_kwargs={"type_": Text()})
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        nullable=False,
    )
```

---

### Step 2: Update Model Exports

**File**: `backend/src/models/__init__.py`

```python
"""Model exports."""

from .auth import SessionData
from .task import Task
from .conversation import Conversation  # NEW
from .message import Message  # NEW

__all__ = ["SessionData", "Task", "Conversation", "Message"]
```

---

### Step 3: Generate Alembic Migration

```bash
cd backend

# Generate migration (Alembic auto-detects new models)
alembic revision --autogenerate -m "Add conversation and message models"

# Output example:
# INFO  [alembic.autogenerate.compare] Detected added table 'conversations'
# INFO  [alembic.autogenerate.compare] Detected added table 'messages'
# INFO  [alembic.autogenerate.compare] Detected added index 'ix_conversations_user_id' on 'conversations'
# INFO  [alembic.autogenerate.compare] Detected added foreign key constraint on 'messages'
# Generating /path/to/alembic/versions/20260209_1234_add_conversation_and_message_models.py ...  done
```

---

### Step 4: Review Generated Migration

**Important**: Always review auto-generated migrations before running!

```bash
# Open the migration file
cat alembic/versions/*_add_conversation_and_message_models.py
```

**Check for**:
- ✅ `op.create_table('conversations', ...)` with all columns
- ✅ `op.create_table('messages', ...)` with all columns
- ✅ Foreign key constraint: `'conversation_id'` → `'conversations.id'`
- ✅ `ON DELETE CASCADE` in foreign key definition
- ✅ Indexes on `user_id` and `conversation_id`

**Example migration excerpt**:
```python
def upgrade():
    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_conversations_user_id', 'conversations', ['user_id'])

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('conversation_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ['conversation_id'],
            ['conversations.id'],
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_messages_conversation_id', 'messages', ['conversation_id'])
    op.create_index('ix_messages_user_id', 'messages', ['user_id'])
```

---

### Step 5: Run Migration

```bash
# Apply migration to database
alembic upgrade head

# Output example:
# INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
# INFO  [alembic.runtime.migration] Will assume transactional DDL.
# INFO  [alembic.runtime.migration] Running upgrade abc123 -> def456, Add conversation and message models
```

---

### Step 6: Verify Tables Created

**Using psql**:
```bash
# Connect to database
psql $DATABASE_URL

# List tables
\dt

# Output should include:
#  public | conversations | table | ...
#  public | messages      | table | ...
#  public | tasks         | table | ...

# Describe conversations table
\d conversations

# Output:
#                           Table "public.conversations"
#    Column    |            Type             | Collation | Nullable |      Default
# -------------+-----------------------------+-----------+----------+-------------------
#  id          | integer                     |           | not null | nextval('...')
#  user_id     | character varying           |           | not null |
#  created_at  | timestamp without time zone |           | not null |
#  updated_at  | timestamp without time zone |           | not null |
# Indexes:
#     "conversations_pkey" PRIMARY KEY, btree (id)
#     "ix_conversations_user_id" btree (user_id)

# Describe messages table
\d messages

# Output:
#                             Table "public.messages"
#       Column      |            Type             | Collation | Nullable |      Default
# ------------------+-----------------------------+-----------+----------+-------------------
#  id               | integer                     |           | not null | nextval('...')
#  conversation_id  | integer                     |           | not null |
#  user_id          | character varying           |           | not null |
#  role             | character varying           |           | not null |
#  content          | text                        |           | not null |
#  created_at       | timestamp without time zone |           | not null |
# Indexes:
#     "messages_pkey" PRIMARY KEY, btree (id)
#     "ix_messages_conversation_id" btree (conversation_id)
#     "ix_messages_user_id" btree (user_id)
# Foreign-key constraints:
#     "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
```

---

## Testing

### Manual Test (Python REPL)

```bash
cd backend
python
```

```python
# Import models and database
from src.models import Conversation, Message
from src.core.database import engine
from sqlmodel import Session, select

# Create database session
session = Session(engine)

# Test 1: Create a conversation
print("\n=== Test 1: Create Conversation ===")
conversation = Conversation(user_id="test_user_123")
session.add(conversation)
session.commit()
session.refresh(conversation)
print(f"✅ Created conversation ID: {conversation.id}")
print(f"   User: {conversation.user_id}")
print(f"   Created: {conversation.created_at}")

# Test 2: Add messages to conversation
print("\n=== Test 2: Add Messages ===")
message1 = Message(
    conversation_id=conversation.id,
    user_id="test_user_123",
    role="user",
    content="Hello, can you help me?"
)
message2 = Message(
    conversation_id=conversation.id,
    user_id="test_user_123",
    role="assistant",
    content="Of course! How can I assist you today?"
)
session.add(message1)
session.add(message2)
session.commit()
session.refresh(message1)
session.refresh(message2)
print(f"✅ Created message 1 ID: {message1.id}")
print(f"✅ Created message 2 ID: {message2.id}")

# Test 3: Query conversation history
print("\n=== Test 3: Query Conversation History ===")
stmt = select(Message).where(
    Message.conversation_id == conversation.id,
    Message.user_id == "test_user_123"
).order_by(Message.created_at)
messages = session.exec(stmt).all()
print(f"✅ Found {len(messages)} messages in conversation {conversation.id}")
for msg in messages:
    print(f"   [{msg.role}]: {msg.content}")

# Test 4: User-scoped query
print("\n=== Test 4: User-Scoped Conversations ===")
stmt = select(Conversation).where(
    Conversation.user_id == "test_user_123"
).order_by(Conversation.updated_at.desc())
user_conversations = session.exec(stmt).all()
print(f"✅ User has {len(user_conversations)} conversation(s)")

# Test 5: CASCADE DELETE (cleanup)
print("\n=== Test 5: Test CASCADE DELETE ===")
print(f"Before delete: {len(messages)} messages exist")
session.delete(conversation)
session.commit()
# Verify messages were cascade-deleted
stmt = select(Message).where(Message.conversation_id == conversation.id)
remaining_messages = session.exec(stmt).all()
print(f"After delete: {len(remaining_messages)} messages remain")
print(f"✅ CASCADE DELETE works correctly")

session.close()
print("\n✅ All tests passed!")
```

**Expected Output**:
```
=== Test 1: Create Conversation ===
✅ Created conversation ID: 1
   User: test_user_123
   Created: 2026-02-09 10:00:00+00:00

=== Test 2: Add Messages ===
✅ Created message 1 ID: 1
✅ Created message 2 ID: 2

=== Test 3: Query Conversation History ===
✅ Found 2 messages in conversation 1
   [user]: Hello, can you help me?
   [assistant]: Of course! How can I assist you today?

=== Test 4: User-Scoped Conversations ===
✅ User has 1 conversation(s)

=== Test 5: Test CASCADE DELETE ===
Before delete: 2 messages exist
After delete: 0 messages remain
✅ CASCADE DELETE works correctly

✅ All tests passed!
```

---

## Troubleshooting

### Issue: Migration fails with "table already exists"

**Cause**: Migration was partially applied

**Solution**:
```bash
# Rollback and retry
alembic downgrade -1
alembic upgrade head
```

---

### Issue: Foreign key constraint violation

**Cause**: Trying to create message for non-existent conversation

**Solution**: Always create conversation before adding messages

```python
# ✅ CORRECT
conversation = Conversation(user_id="user123")
session.add(conversation)
session.commit()
session.refresh(conversation)  # Get auto-generated ID

message = Message(conversation_id=conversation.id, ...)
session.add(message)
session.commit()
```

---

### Issue: No CASCADE DELETE

**Cause**: Foreign key missing `ondelete="CASCADE"` in migration

**Solution**: Manually edit migration or fix model and regenerate:

```python
# In message.py model:
conversation_id: int = Field(
    foreign_key="conversations.id",
    nullable=False,
    index=True,
    sa_column_kwargs={"ondelete": "CASCADE"}  # ← This is required
)
```

---

## Migration Rollback

If you need to undo the migration:

```bash
# Rollback one migration
alembic downgrade -1

# This will:
# - DROP table messages
# - DROP table conversations
```

**Warning**: This deletes all data in these tables!

---

## Next Steps

1. ✅ Models implemented and migrated
2. ⏭️ **Next Feature**: Add REST API endpoints for CRUD operations
3. ⏭️ **Future**: Add user_id validation middleware
4. ⏭️ **Future**: Integrate with AI chatbot agent

---

## Performance Validation

### Test Query Performance

```python
import time
from sqlmodel import Session, select
from src.models import Message
from src.core.database import engine

session = Session(engine)

# Create test conversation with 100 messages
conversation = Conversation(user_id="perf_test")
session.add(conversation)
session.commit()
session.refresh(conversation)

for i in range(100):
    msg = Message(
        conversation_id=conversation.id,
        user_id="perf_test",
        role="user" if i % 2 == 0 else "assistant",
        content=f"Test message {i}"
    )
    session.add(msg)
session.commit()

# Measure query time
start = time.time()
stmt = select(Message).where(
    Message.conversation_id == conversation.id,
    Message.user_id == "perf_test"
).order_by(Message.created_at)
messages = session.exec(stmt).all()
elapsed = (time.time() - start) * 1000  # Convert to ms

print(f"Queried {len(messages)} messages in {elapsed:.2f}ms")
assert elapsed < 100, f"Query too slow: {elapsed}ms"
print("✅ Performance test passed!")

# Cleanup
session.delete(conversation)
session.commit()
session.close()
```

**Expected**: Query should complete in <100ms for 100 messages

---

## References

- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- Phase II Documentation: `specs/002-backend-database/`
