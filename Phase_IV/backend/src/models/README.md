# Database Models Documentation

This document describes the database models and their constraints for the Todo application.

## Models Overview

### Task Model
- **File**: `task.py`
- **Purpose**: Represents user tasks
- **Key Fields**: id (UUID), title, description, is_completed, priority, user_id
- **Constraints**: user_id is indexed for efficient scoped queries

### Conversation Model
- **File**: `conversation.py`
- **Purpose**: Represents chat sessions between user and AI assistant
- **Key Fields**: id (int), user_id, created_at, updated_at
- **Constraints**:
  - `user_id` is indexed for efficient user-scoped queries
  - `id` is auto-incrementing integer (PostgreSQL SERIAL)

### Message Model
- **File**: `message.py`
- **Purpose**: Represents individual messages in a conversation
- **Key Fields**: id (int), conversation_id, user_id, role, content, created_at
- **Constraints**:
  - `conversation_id` is a foreign key to conversations.id
  - `user_id` is indexed for efficient user-scoped queries
  - `role` should be "user" or "assistant" (validated at application layer)
  - `content` uses PostgreSQL TEXT type (no length limit)

## Database Constraints

### Foreign Key Constraints

#### Message → Conversation Relationship
- **Foreign Key**: `messages.conversation_id` → `conversations.id`
- **ON DELETE**: CASCADE
- **Behavior**: When a conversation is deleted, all associated messages are automatically deleted by PostgreSQL
- **Verification**: Tested and confirmed working (see T012 test results)

### NOT NULL Constraints

All core fields are marked as NOT NULL:
- Conversation: id, user_id, created_at, updated_at
- Message: id, conversation_id, user_id, role, content, created_at

### Index Strategy

#### Conversations
- **Primary Key**: id (automatic index)
- **Secondary Index**: user_id (for user-scoped queries)
- **Composite Index** (future): (user_id, updated_at DESC) for recent conversations list

#### Messages
- **Primary Key**: id (automatic index)
- **Secondary Index**: conversation_id (for fetching conversation history)
- **Secondary Index**: user_id (for user-scoped queries)
- **Composite Index** (future): (conversation_id, created_at ASC) for chronological message ordering

## Timestamp Management

### Auto-Population
- **created_at**: Automatically set to current UTC time on record creation
- **updated_at**: Automatically set to current UTC time on record creation

### Update Strategy for Conversation.updated_at

**Implementation**: Application-layer update (not database trigger)

**Rationale**:
- SQLModel/SQLAlchemy does not provide automatic `onupdate` for timestamp fields
- Database triggers add complexity and are database-specific
- Application logic provides explicit control and is easier to test

**When to Update**:
- When a new message is added to the conversation
- When conversation metadata changes (future feature)

**Example Implementation** (future API endpoint):
```python
@app.post("/api/conversations/{conversation_id}/messages")
async def create_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Create message
    message = Message(**message_data.dict(), conversation_id=conversation_id, user_id=current_user.id)
    session.add(message)

    # Update conversation timestamp
    conversation = await session.get(Conversation, conversation_id)
    if conversation and conversation.user_id == current_user.id:
        conversation.updated_at = datetime.now(UTC)

    await session.commit()
    return message
```

## Application-Layer Validations

The following validations are enforced at the API/application layer:

### Message Role Validation
- **Rule**: `role` must be exactly "user" or "assistant"
- **Implementation**: Pydantic models in API layer
- **Rationale**: Flexible for future roles (e.g., "system", "tool")

### User ID Consistency
- **Rule**: `message.user_id` must match `conversation.user_id`
- **Implementation**: API endpoint validation before insert
- **Rationale**: Prevents cross-user data leakage

### Content Length
- **Rule**: Consider 100KB limit for message content
- **Implementation**: API layer validation (future enhancement)
- **Rationale**: Prevent abuse and large payloads

## Database-Level Guarantees

✅ **Foreign Key Integrity**: PostgreSQL prevents orphaned messages
✅ **Cascade Delete**: Deleting conversation auto-deletes messages
✅ **NOT NULL**: Required fields cannot be empty
✅ **Primary Key Uniqueness**: Each record has unique ID
✅ **Index Performance**: Efficient user-scoped and chronological queries

## Migration History

- **003**: Initial database setup (Task model, Auth tables)
- **14fa95511b5d**: Added Conversation and Message models with foreign key constraints

## Testing Results

### T011: Foreign Key Constraint Test
✅ **PASS**: Attempting to insert message with non-existent conversation_id raises IntegrityError

### T012: CASCADE DELETE Test
✅ **PASS**: Deleting conversation automatically deletes all associated messages

## Security Notes

### User Data Isolation
- All queries MUST filter by `user_id` from authenticated JWT token
- Indexes optimize user-scoped queries
- No cross-user access possible with proper filtering

### Example Safe Query
```python
# ✅ SAFE: Filtered by authenticated user
messages = await session.exec(
    select(Message)
    .where(Message.conversation_id == conv_id)
    .where(Message.user_id == current_user.id)
    .order_by(Message.created_at)
).all()
```

### Example Unsafe Query
```python
# ❌ UNSAFE: No user_id filter (would leak data)
messages = await session.exec(
    select(Message)
    .where(Message.conversation_id == conv_id)
    .order_by(Message.created_at)
).all()
```

## Performance Considerations

### Expected Scale
- 10-100 conversations per user
- 10-1000 messages per conversation
- Target: <100ms for conversation history queries

### Optimization Strategies
1. **Indexes**: Composite indexes support common query patterns
2. **Pagination**: Future API will add LIMIT/OFFSET for large conversations
3. **Connection Pooling**: SQLModel/FastAPI handles connection pooling
4. **Cascade Delete**: Database handles deletion efficiently

## Future Enhancements

- Add composite index: (user_id, updated_at DESC) on conversations
- Add composite index: (conversation_id, created_at ASC) on messages
- Consider CHECK constraint for message.role validation
- Add conversation metadata fields (title, archived, tags)
- Add message metadata fields (edited_at, token_count)
