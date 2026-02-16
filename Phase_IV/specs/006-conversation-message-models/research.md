# Research: Conversation and Message Models

**Feature**: 006-conversation-message-models
**Date**: 2026-02-09
**Status**: Complete

## Overview

This document consolidates research findings for implementing conversation and message storage models for Phase III's stateless AI chatbot. All technical decisions are documented with rationale and alternatives considered.

---

## 1. SQLModel Patterns from Existing Codebase

**Research Question**: What patterns does Phase II use for SQLModel definitions?

**Findings**:

From `backend/src/models/task.py`:
- Base class: `SQLModel` with `table=True` parameter
- Explicit `__tablename__` definition
- `Field()` function for all columns with constraints
- Type hints using modern Python `|` syntax (e.g., `str | None`)
- UTC timestamps using `datetime.now(UTC)`
- Indexed `user_id` field for scoped queries
- Auto-generated primary keys (UUID for Task)

**Decision**: Replicate these patterns exactly for Conversation and Message models

**Rationale**: Consistency, proven in production, reduces cognitive load

---

## 2. Primary Key Strategy

**Research Question**: Should we use UUIDs (like Task) or integers for IDs?

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| UUID | Globally unique, matches Task model | Larger storage (16 bytes), harder to debug, no inherent ordering |
| Auto-increment INT | Sequential ordering, smaller (4 bytes), easier debugging | Not globally unique |
| Snowflake ID | Sortable + unique | Complexity overkill for this use case |

**Decision**: Use auto-incrementing integers (`int | None` with `primary_key=True`)

**Rationale**:
- Sequential IDs preserve chronological order (critical for conversations/messages)
- Smaller index size improves query performance
- PostgreSQL `SERIAL` handles auto-increment reliably
- Simpler to debug and reason about
- Conversations/messages don't need global uniqueness across systems

**Implementation**:
```python
id: int | None = Field(default=None, primary_key=True)
```

PostgreSQL automatically creates a sequence and sets default to `nextval()`.

---

## 3. Foreign Key Relationships

**Research Question**: How to model the Conversation → Message one-to-many relationship?

**Options Considered**:

1. **Explicit foreign key with index** (Chosen)
   ```python
   conversation_id: int = Field(foreign_key="conversations.id", nullable=False, index=True)
   ```

2. **SQLAlchemy relationship() with backpopulates**
   ```python
   conversation: Conversation = Relationship(back_populates="messages")
   ```

3. **Implicit relationship (no FK constraint)**

**Decision**: Explicit foreign key with index, no SQLAlchemy relationship()

**Rationale**:
- Explicit foreign keys enforce data integrity at database level
- Index on foreign key improves join performance
- Simple approach matches existing codebase style (no relationships in Task model)
- Relationship() adds ORM magic we don't need (API layer handles joins)
- Explicit is better than implicit

**Cascade Delete**: Use `ondelete="CASCADE"` to auto-delete messages when conversation deleted (spec requirement FR-009)

---

## 4. Message Role Storage

**Research Question**: How to store and constrain the "user" vs "assistant" role?

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| String with app validation | Simple, flexible, easy to extend | No DB-level constraint |
| PostgreSQL ENUM | DB-level validation | Requires migration to add roles, complex |
| Python Enum + mapping | Type-safe in Python | Over-engineering for 2 values |

**Decision**: Store as plain string, validate at application layer (Pydantic)

**Rationale**:
- SQLModel doesn't have native Pydantic Enum support for tables
- PostgreSQL ENUMs require custom migrations and are hard to modify
- Future-proof: easy to add "system" or "tool" roles later
- Application-layer validation (Pydantic in API) is sufficient
- Keeps database schema simple

**Implementation**:
```python
role: str = Field(nullable=False)  # "user" or "assistant"
```

Validation handled by Pydantic schema in API layer:
```python
class MessageCreate(BaseModel):
    role: Literal["user", "assistant"]
    content: str
```

---

## 5. Timestamp Auto-Update for `updated_at`

**Research Question**: How to automatically update Conversation.updated_at when a message is added?

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| Application logic | Simple, portable | Must remember to update in API code |
| PostgreSQL trigger | Automatic, DB-enforced | DB-specific SQL, harder to test |
| SQLAlchemy `onupdate` | ORM handles it | SQLModel doesn't support onupdate for datetime |

**Decision**: Application logic (update in API layer when adding messages)

**Rationale**:
- Simplest approach (no triggers, no ORM magic)
- Explicit updates in API code are easy to test
- Portable across databases
- SQLModel doesn't support `onupdate` parameter for datetime fields
- Future feature (API implementation) will handle this

**Implementation**:
```python
# In Conversation model:
updated_at: datetime = Field(
    default_factory=lambda: datetime.now(UTC),
    nullable=False,
)

# In API endpoint (future):
async def create_message(...):
    message = Message(...)
    conversation.updated_at = message.created_at
    session.add(message)
    session.add(conversation)
    session.commit()
```

---

## 6. Text Content Storage

**Research Question**: What column type for message content? VARCHAR vs TEXT?

**Findings**:
- PostgreSQL TEXT has no practical limit (up to 1GB)
- TEXT and VARCHAR have same performance in PostgreSQL
- VARCHAR requires arbitrary length limit (e.g., 10000)

**Decision**: Use TEXT (no length limit)

**Rationale**:
- Message content varies widely (short "ok" to long explanations)
- No need to guess max length
- Application layer can validate if needed (e.g., 100KB limit for API)
- PostgreSQL TEXT is as efficient as VARCHAR

**Implementation**:
```python
from sqlalchemy import Text

content: str = Field(nullable=False, sa_column_kwargs={"type_": Text()})
```

---

## 7. Indexing Strategy

**Research Question**: What indexes are needed for efficient queries?

**Expected Query Patterns**:
1. Get all conversations for a user (ORDER BY updated_at DESC)
2. Get all messages for a conversation (ORDER BY created_at ASC)
3. Check if user owns a conversation
4. Check if user owns a message

**Decision**: Index these columns

**Conversation**:
- `id` (primary key, automatic)
- `user_id` (single-column index)
- `(user_id, updated_at DESC)` (composite index for "recent conversations")

**Message**:
- `id` (primary key, automatic)
- `conversation_id` (foreign key, automatic with index=True)
- `user_id` (single-column index)
- `(conversation_id, created_at ASC)` (composite index for chronological message ordering)

**Rationale**:
- Composite indexes support ORDER BY without additional sort step
- user_id indexes critical for user-scoped queries (constitution requirement)
- conversation_id index supports fast message retrieval

---

## 8. User ID Consistency Constraint

**Research Question**: How to ensure Message.user_id matches Conversation.user_id?

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| Database CHECK constraint | DB-enforced | Requires JOIN in constraint (complex, not supported in all DBs) |
| Application validation | Simple, testable | Not DB-enforced |
| Database trigger | DB-enforced | Complex SQL, harder to maintain |

**Decision**: Application-layer validation (API layer checks before insert)

**Rationale**:
- Database CHECK constraints can't reference other tables
- Triggers add complexity and are DB-specific
- Application validation is simple, explicit, and testable
- API endpoints will verify user_id matches before allowing message creation

**Implementation** (future API feature):
```python
async def create_message(conversation_id, message_data, current_user):
    conversation = session.get(Conversation, conversation_id)
    if conversation.user_id != current_user.id:
        raise HTTPException(403, "Cannot add message to another user's conversation")
    # ... create message
```

---

## 9. Migration Strategy

**Research Question**: How to generate and apply database migrations?

**Existing Pattern** (from Phase II):
- Alembic for migrations
- Auto-generate with `alembic revision --autogenerate`
- Manual review before running
- Version control migration scripts

**Decision**: Follow existing Alembic workflow

**Steps**:
1. Create SQLModel classes
2. Import in `__init__.py`
3. Run `alembic revision --autogenerate -m "Add conversation and message models"`
4. Review generated migration (verify foreign keys, indexes, CASCADE)
5. Run `alembic upgrade head`
6. Verify with `\d conversations` and `\d messages` in psql

**Rollback Plan**: `alembic downgrade -1` if issues found

---

## Summary of Decisions

| Decision Area | Chosen Approach | Key Rationale |
|---------------|----------------|---------------|
| Primary Keys | Auto-increment integers | Sequential ordering, performance |
| Foreign Keys | Explicit with CASCADE | Data integrity, automatic cleanup |
| Role Storage | String with app validation | Simple, extensible |
| Timestamp Updates | Application logic | Portable, explicit |
| Text Storage | PostgreSQL TEXT | No arbitrary limits |
| Indexes | Composite for query patterns | Query performance |
| User ID Validation | Application layer | Simple, testable |
| Migrations | Alembic (existing pattern) | Consistency with Phase II |

---

## References

- Phase II Task model: `backend/src/models/task.py`
- SQLModel documentation: https://sqlmodel.tiangolo.com/
- PostgreSQL foreign keys: https://www.postgresql.org/docs/current/ddl-constraints.html
- Alembic migrations: https://alembic.sqlalchemy.org/
