# Data Model: Phase V Advanced Cloud-Native AI Deployment

**Feature**: 011-advanced-cloud-deploy
**Date**: 2026-02-21
**Source**: specs/011-advanced-cloud-deploy/spec.md + research.md

---

## Entity Overview

```
User (managed by auth layer)
  │
  ├── Task (base entity; intermediate features)
  │     ├── Tag (M:N via TaskTag)
  │     └── RecurringTask (1:1 when task is recurring)
  │           └── TaskInstance (1:N; one per occurrence)
  │
  ├── Reminder (1:N per Task or TaskInstance)
  │
  └── ProcessedEventLog (per Kafka consumer; idempotency)
```

---

## 1. Task

Core todo item. Supports intermediate features: priorities, tags, status.

```python
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: str = Field(index=True, nullable=False)

    # Core fields
    title: str = Field(max_length=255, nullable=False)
    description: str | None = Field(max_length=2000, default=None)

    # Intermediate features
    priority: str = Field(default="Medium", nullable=False)
    # Allowed: "High" | "Medium" | "Low"

    status: str = Field(default="pending", nullable=False, index=True)
    # Allowed: "pending" | "active" | "completed" | "cancelled"

    due_date: datetime | None = Field(default=None, index=True)

    # Search support
    # Full-text search via PostgreSQL tsvector on (title, description)
    # Created as DB-level generated column in migration

    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tags: list["Tag"] = Relationship(back_populates="tasks", link_model=TaskTag)
    reminders: list["Reminder"] = Relationship(back_populates="task")
    recurring_task: Optional["RecurringTask"] = Relationship(back_populates="task")
```

**Validation rules**:
- `title`: 1–255 characters, not blank
- `priority`: enum `["High", "Medium", "Low"]`; default `"Medium"`
- `status`: enum `["pending", "active", "completed", "cancelled"]`; transitions: pending→active→completed; any→cancelled
- `due_date`: ISO-8601 datetime; must be in the future on creation

**Indexes**:
- `(user_id)` — primary filter for all user queries
- `(user_id, status)` — filter by status per user
- `(user_id, priority)` — sort/filter by priority per user
- `(due_date)` — range queries for upcoming tasks
- `(user_id, due_date)` — combined user + due date queries

---

## 2. Tag

User-defined labels for tasks. Many-to-many via TaskTag junction.

```python
class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: str = Field(index=True, nullable=False)
    name: str = Field(max_length=50, nullable=False)

    # Relationships
    tasks: list[Task] = Relationship(back_populates="tags", link_model=TaskTag)

class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"
    task_id: UUID = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: UUID = Field(foreign_key="tags.id", primary_key=True)
```

**Validation rules**:
- `name`: 1–50 characters; unique per user (case-insensitive)
- Tags are user-scoped: a tag belongs to exactly one user

**Indexes**:
- `UNIQUE(user_id, name)` — prevent duplicate tags per user (case-insensitive via DB-level constraint)

---

## 3. RecurringTask

Recurring series definition. One per recurring task configuration. Linked 1:1 to a parent Task.

```python
class RecurringTask(SQLModel, table=True):
    __tablename__ = "recurring_tasks"

    id: UUID = Field(primary_key=True, default_factory=uuid4)
    task_id: UUID = Field(foreign_key="tasks.id", unique=True, nullable=False)
    user_id: str = Field(index=True, nullable=False)
    series_id: UUID = Field(default_factory=uuid4, index=True)

    # RFC 5545 RRULE
    rrule: str = Field(nullable=False)
    # Example: "DTSTART;TZID=America/New_York:20260221T140000\nRRULE:FREQ=WEEKLY;BYDAY=FR"

    timezone_iana: str = Field(default="UTC", nullable=False)
    # IANA timezone name (e.g., "America/New_York") — NEVER store UTC offset

    # Series end conditions (mirrors RRULE COUNT/UNTIL)
    recurrence_end_type: str | None = Field(default=None)
    # "COUNT" | "UNTIL" | None (infinite)
    recurrence_max_count: int | None = Field(default=None)
    recurrence_end_date: datetime | None = Field(default=None)

    # State
    status: str = Field(default="active", nullable=False, index=True)
    # "pending" | "active" | "paused" | "completed" | "cancelled"

    # Computed for efficient scheduling queries
    next_occurrence_at_utc: datetime | None = Field(default=None, index=True)

    # Progress tracking
    current_instance_index: int = Field(default=0)
    total_occurrences_executed: int = Field(default=0)

    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    task: Task = Relationship(back_populates="recurring_task")
    instances: list["TaskInstance"] = Relationship(back_populates="parent_task")
```

**Validation rules**:
- `rrule`: must parse successfully with `python-dateutil.rrulestr()`
- `timezone_iana`: must be a valid IANA zone name (validated via `ZoneInfo(name)`)
- `recurrence_max_count`: positive integer if `recurrence_end_type == "COUNT"`
- `recurrence_end_date`: future datetime if `recurrence_end_type == "UNTIL"`

**State transitions**:
```
pending → active (task confirmed)
active → paused (user pauses series)
paused → active (user resumes)
active → completed (COUNT/UNTIL reached)
any → cancelled (user deletes recurring task)
```

**Indexes**:
- `(status, next_occurrence_at_utc)` — scheduler queries for due tasks
- `(user_id, status)` — user-scoped queries
- `UNIQUE(task_id)` — one RecurringTask per Task

---

## 4. TaskInstance

Single occurrence of a recurring task. Created by recurring-service when Dapr Jobs callback fires.

```python
class TaskInstance(SQLModel, table=True):
    __tablename__ = "task_instances"

    id: UUID = Field(primary_key=True, default_factory=uuid4)
    parent_task_id: UUID = Field(foreign_key="recurring_tasks.id", nullable=False, index=True)
    user_id: str = Field(index=True, nullable=False)

    # Inherited from parent (denormalized for query efficiency)
    title: str = Field(max_length=255)
    priority: str = Field(default="Medium")

    # Schedule
    scheduled_for_utc: datetime = Field(nullable=False, index=True)

    # Execution state
    status: str = Field(default="pending", nullable=False, index=True)
    # "pending" | "active" | "completed" | "skipped" | "failed"

    completed_at: datetime | None = Field(default=None)
    skipped_reason: str | None = Field(max_length=500, default=None)
    error_message: str | None = Field(max_length=2000, default=None)
    retry_count: int = Field(default=0)

    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    parent_task: RecurringTask = Relationship(back_populates="instances")
    reminders: list["Reminder"] = Relationship(back_populates="task_instance")
```

**Indexes**:
- `(user_id, scheduled_for_utc)` — queries by user and schedule date
- `(parent_task_id, status)` — series progress tracking
- `(status, scheduled_for_utc)` — "all pending instances due now" scheduler query

---

## 5. Reminder

Notification schedule for a Task or TaskInstance. notification-service consumes from `reminders` topic.

```python
class Reminder(SQLModel, table=True):
    __tablename__ = "reminders"

    id: UUID = Field(primary_key=True, default_factory=uuid4)
    user_id: str = Field(index=True, nullable=False)

    # Link to either a one-time Task or a recurring TaskInstance
    task_id: UUID | None = Field(foreign_key="tasks.id", default=None, index=True)
    task_instance_id: UUID | None = Field(foreign_key="task_instances.id", default=None, index=True)

    # Reminder config
    reminder_type: str = Field(nullable=False)
    # "in_app" (Phase V) | "email" | "push" (future)

    scheduled_for_utc: datetime = Field(nullable=False, index=True)
    # When to send the reminder (before task due time)

    # Status
    status: str = Field(default="pending", nullable=False, index=True)
    # "pending" | "sent" | "failed" | "cancelled"

    sent_at: datetime | None = Field(default=None)
    error_message: str | None = Field(max_length=1000, default=None)

    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Validation rules**:
- Exactly one of `task_id` or `task_instance_id` must be set
- `scheduled_for_utc`: must be before the task's `due_date`
- `reminder_type`: Phase V supports `"in_app"` only

**Indexes**:
- `(status, scheduled_for_utc)` — "all pending reminders due now" query
- `(user_id, scheduled_for_utc)` — user-scoped queries

---

## 6. ProcessedEventLog

Idempotency ledger for Kafka consumers. Prevents duplicate task instance creation / reminder delivery.

```python
class ProcessedEventLog(SQLModel, table=True):
    __tablename__ = "processed_event_logs"

    __table_args__ = (
        UniqueConstraint("idempotency_key", name="unique_idempotency_key"),
    )

    id: UUID = Field(primary_key=True, default_factory=uuid4)

    event_id: str = Field(index=True, nullable=False)
    # Kafka message key or UUID from producer

    idempotency_key: str = Field(nullable=False)
    # sha256("{user_id}:{entity_id}:{occurrence_timestamp_iso}")[:16]

    event_type: str = Field(nullable=False)
    # "recurring-task-triggered" | "reminder-due"

    status: str = Field(default="processed", nullable=False)
    # "processing" | "processed" | "failed" | "skipped"

    result_id: str | None = Field(default=None)
    # ID of created entity (task_instance_id, etc.)

    error_message: str | None = Field(default=None)

    event_timestamp: datetime = Field(nullable=False)
    processed_at: datetime = Field(nullable=False)
    expires_at: datetime = Field(nullable=False)
    # processed_at + 30 days; periodic cleanup job removes expired rows
```

**Indexes**:
- `UNIQUE(idempotency_key)` — core constraint; prevents duplicate processing
- `(expires_at)` — cleanup job: `DELETE WHERE expires_at < NOW()`

---

## 7. Kafka Event Schemas

These are the contracts published to Kafka topics. All events are JSON.

### 7.1 task-events topic

Published by: backend (Chat API) when a task is created/updated/deleted.

```json
{
  "event_id": "uuid-v4",
  "event_type": "task.created | task.updated | task.deleted | recurring.scheduled",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:00:00Z",
  "user_id": "string",
  "task_id": "uuid-v4",
  "payload": {
    "title": "string",
    "description": "string | null",
    "priority": "High | Medium | Low",
    "status": "pending | active | completed | cancelled",
    "due_date": "ISO-8601 | null",
    "tags": ["string"],
    "rrule": "RFC-5545 string | null",
    "timezone_iana": "IANA zone name | null"
  }
}
```

### 7.2 reminders topic

Published by: backend when a reminder is scheduled; consumed by notification-service.

```json
{
  "event_id": "uuid-v4",
  "event_type": "reminder.scheduled | reminder.cancelled",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T13:45:00Z",
  "user_id": "string",
  "reminder_id": "uuid-v4",
  "task_id": "uuid-v4 | null",
  "task_instance_id": "uuid-v4 | null",
  "payload": {
    "reminder_type": "in_app",
    "scheduled_for": "ISO-8601",
    "task_title": "string",
    "task_due_date": "ISO-8601 | null"
  }
}
```

### 7.3 task-updates topic

Published by: recurring-service (after task instance creation) and backend (after status change). Consumed by notification-service for real-time UI push.

```json
{
  "event_id": "uuid-v4",
  "event_type": "task.instance_created | task.status_changed | task.overdue",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:00:01Z",
  "user_id": "string",
  "task_id": "uuid-v4",
  "task_instance_id": "uuid-v4 | null",
  "payload": {
    "previous_status": "string | null",
    "new_status": "string",
    "change_reason": "string | null"
  }
}
```

---

## 8. Dapr State Store Schema (Session/Conversation)

Used by backend to persist OpenAI conversation history via Dapr State Store API. Not a SQLModel table — stored as Dapr state key-value pairs.

```
Key format: "session:{user_id}:{session_id}"
Value: JSON blob
TTL: 24h (cleanupInterval on component)

{
  "session_id": "uuid",
  "user_id": "string",
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "created_at": "ISO-8601",
  "last_activity": "ISO-8601"
}
```
