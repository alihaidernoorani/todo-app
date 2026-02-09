# Data Model: Conversation and Message Models

**Feature**: 006-conversation-message-models
**Date**: 2026-02-09
**Status**: Final

## Overview

This document defines the database schema for storing conversation sessions and messages to support Phase III's stateless AI chatbot. The model consists of two entities with a one-to-many relationship.

---

## Entity Relationship Diagram

```
┌────────────────────────────────┐
│       Conversation             │
├────────────────────────────────┤
│ id                  PK, INT     │
│ user_id             STR, IDX    │
│ created_at          TIMESTAMP   │
│ updated_at          TIMESTAMP   │
└────────────────────────────────┘
                 │
                 │ 1
                 │
                 │ N
                 ▼
┌────────────────────────────────┐
│         Message                │
├────────────────────────────────┤
│ id                  PK, INT     │
│ conversation_id     FK, INT     │◄── CASCADE DELETE
│ user_id             STR, IDX    │
│ role                STR         │
│ content             TEXT        │
│ created_at          TIMESTAMP   │
└────────────────────────────────┘
```

---

## Entity: Conversation

### Purpose
Represents a chat session between a user and the AI assistant. A user can have multiple conversations to organize different topics or chat sessions.

### Fields

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | `int` | No | Auto-increment | Primary Key | Unique conversation identifier |
| `user_id` | `str` | No | - | Indexed | Owner of the conversation |
| `created_at` | `datetime` | No | `datetime.now(UTC)` | - | When conversation was created |
| `updated_at` | `datetime` | No | `datetime.now(UTC)` | - | Last activity timestamp |

### Indexes

- **Primary**: `id` (automatic)
- **Secondary**: `user_id` (for user-scoped queries)
- **Composite**: `(user_id, updated_at DESC)` (for recent conversations list)

### SQLModel Definition

```python
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

### Example Data

```json
{
  "id": 1,
  "user_id": "user_abc123",
  "created_at": "2026-02-09T10:00:00Z",
  "updated_at": "2026-02-09T10:05:30Z"
}
```

---

## Entity: Message

### Purpose
Represents a single message in a conversation, sent by either the user or the AI assistant. Messages are ordered chronologically to reconstruct conversation history.

### Fields

| Field | Type | Nullable | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | `int` | No | Auto-increment | Primary Key | Unique message identifier |
| `conversation_id` | `int` | No | - | Foreign Key (conversations.id), Indexed, CASCADE DELETE | Parent conversation |
| `user_id` | `str` | No | - | Indexed | Message owner (should match conversation owner) |
| `role` | `str` | No | - | Validated: "user" or "assistant" | Sender role |
| `content` | `str` | No | - | TEXT column type | Message text content |
| `created_at` | `datetime` | No | `datetime.now(UTC)` | - | When message was created |

### Indexes

- **Primary**: `id` (automatic)
- **Secondary**: `conversation_id` (foreign key index)
- **Secondary**: `user_id` (for user-scoped queries)
- **Composite**: `(conversation_id, created_at ASC)` (for chronological ordering)

### Foreign Keys

- `conversation_id` → `conversations.id` with `ON DELETE CASCADE`
  - When a conversation is deleted, all its messages are automatically deleted

### SQLModel Definition

```python
from datetime import UTC, datetime
from sqlmodel import Field, SQLModel
from sqlalchemy import Text


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

### Example Data

```json
[
  {
    "id": 1,
    "conversation_id": 1,
    "user_id": "user_abc123",
    "role": "user",
    "content": "Hello, can you help me create a task?",
    "created_at": "2026-02-09T10:00:05Z"
  },
  {
    "id": 2,
    "conversation_id": 1,
    "user_id": "user_abc123",
    "role": "assistant",
    "content": "Of course! I'd be happy to help you create a task. What would you like the task to be?",
    "created_at": "2026-02-09T10:00:06Z"
  }
]
```

---

## Relationships

### Conversation → Messages (One-to-Many)

- One conversation can have zero or more messages
- Each message belongs to exactly one conversation
- Foreign key constraint enforces referential integrity
- CASCADE DELETE ensures messages are removed when conversation is deleted

### User Ownership

- Both Conversation and Message have `user_id` field
- Message.user_id SHOULD match Conversation.user_id (validated at application layer)
- All queries MUST filter by user_id to enforce user isolation
- Prevents cross-user data access

---

## State Transitions

### Conversation Lifecycle

```
[Created] ─────────────────► [Active] ─────────────────► [Deleted]
   │                             │                             │
   │ created_at set              │ updated_at refreshed       │ CASCADE deletes
   │ updated_at = created_at     │ on new messages            │ all messages
```

### Message Lifecycle

```
[Created] ─────────────────────────────────────────────► [Deleted]
   │                                                           │
   │ created_at set                                            │ Only via
   │ conversation.updated_at refreshed                         │ CASCADE or
   │                                                           │ direct delete
```

**Note**: Messages are immutable after creation (no editing in this phase). Future phases may add `edited_at` field.

---

## Validation Rules

### Application-Layer Validation (enforced in API)

1. **Message Role**: Must be exactly "user" or "assistant"
   ```python
   role: Literal["user", "assistant"]
   ```

2. **User ID Consistency**: Message.user_id must match Conversation.user_id
   ```python
   if message.user_id != conversation.user_id:
       raise ValueError("Message user_id must match conversation user_id")
   ```

3. **Content Length**: Consider max 100KB limit in API layer
   ```python
   if len(content) > 100_000:
       raise ValueError("Message content exceeds 100KB limit")
   ```

### Database-Layer Validation (enforced by PostgreSQL)

1. **NOT NULL**: All non-nullable fields enforced
2. **Foreign Key**: conversation_id must exist in conversations table
3. **Primary Key**: Unique id for each record
4. **Cascade Delete**: Orphaned messages impossible

---

## Query Patterns

### Get Recent Conversations for User

```sql
SELECT * FROM conversations
WHERE user_id = 'user_abc123'
ORDER BY updated_at DESC
LIMIT 10;
```

**Performance**: Uses `(user_id, updated_at DESC)` composite index

---

### Get Conversation History (Chronological)

```sql
SELECT * FROM messages
WHERE conversation_id = 1
  AND user_id = 'user_abc123'
ORDER BY created_at ASC;
```

**Performance**: Uses `(conversation_id, created_at ASC)` composite index

---

### Create New Conversation with First Message

```sql
-- Step 1: Create conversation
INSERT INTO conversations (user_id, created_at, updated_at)
VALUES ('user_abc123', NOW(), NOW())
RETURNING id;

-- Step 2: Create first message
INSERT INTO messages (conversation_id, user_id, role, content, created_at)
VALUES (1, 'user_abc123', 'user', 'Hello!', NOW());

-- Step 3: Update conversation timestamp
UPDATE conversations
SET updated_at = (SELECT created_at FROM messages WHERE id = LAST_INSERT_ID())
WHERE id = 1;
```

---

### Delete Conversation (CASCADE deletes messages)

```sql
DELETE FROM conversations
WHERE id = 1 AND user_id = 'user_abc123';

-- PostgreSQL automatically deletes all messages with conversation_id = 1
```

---

## Migration SQL (Reference)

**Note**: Alembic will auto-generate this. Provided here for reference.

```sql
-- Create conversations table
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_conversations_user_id ON conversations(user_id);
CREATE INDEX ix_conversations_user_updated ON conversations(user_id, updated_at DESC);

-- Create messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_messages_conversation_id ON messages(conversation_id);
CREATE INDEX ix_messages_user_id ON messages(user_id);
CREATE INDEX ix_messages_conversation_created ON messages(conversation_id, created_at ASC);
```

---

## Compatibility

### Phase II Models

- **Task**: No changes required. Task model is independent.
- **Auth**: Uses same `user_id` format (string)
- **Database**: Shares same PostgreSQL connection and Alembic migrations

### Future Extensions

- **Conversation Metadata**: Can add `title`, `archived`, `tags` fields
- **Message Metadata**: Can add `edited_at`, `token_count`, `tool_calls` fields
- **Agent Runs**: Can add separate `agent_runs` table for tool invocation tracking

---

## Security Considerations

### User Data Isolation

- All queries MUST filter by `user_id`
- API middleware MUST extract user_id from JWT
- Database indexes optimize user-scoped queries
- No cross-user access possible with proper filtering

### Example Safe Query

```python
# ✅ SAFE: Filtered by authenticated user
messages = session.exec(
    select(Message)
    .where(Message.conversation_id == conv_id)
    .where(Message.user_id == current_user.id)
    .order_by(Message.created_at)
).all()

# ❌ UNSAFE: No user_id filter (would leak data)
messages = session.exec(
    select(Message)
    .where(Message.conversation_id == conv_id)
    .order_by(Message.created_at)
).all()
```

---

## Performance Considerations

### Expected Scale

- 10-100 conversations per user
- 10-1000 messages per conversation
- 100ms target for conversation history queries

### Optimization Strategies

1. **Indexes**: Composite indexes support common query patterns without sorting
2. **Pagination**: Future API can add LIMIT/OFFSET for large conversations
3. **Connection Pooling**: Use SQLModel/FastAPI connection pooling
4. **Cascade Delete**: Database handles deletion efficiently

### Monitoring

- Track query execution time for message retrieval
- Monitor index usage with PostgreSQL EXPLAIN
- Alert if queries exceed 100ms threshold

---

## References

- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- Phase II Task Model: `backend/src/models/task.py`
