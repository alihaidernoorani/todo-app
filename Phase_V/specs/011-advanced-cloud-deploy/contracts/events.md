# Kafka Event Contracts: Phase V Advanced Cloud-Native AI Deployment

**Feature**: 011-advanced-cloud-deploy
**Version**: 1.0
**Date**: 2026-02-21

All events are JSON, published via Dapr PubSub (`pubsub-kafka` component).
All `timestamp` fields are ISO-8601 UTC. All `*_id` fields are UUID v4.

---

## Envelope Schema (all events)

Every event shares this top-level envelope:

```json
{
  "event_id": "string (UUID v4) — globally unique event identifier; used for idempotency",
  "event_type": "string — dot-namespaced type (see per-topic types below)",
  "schema_version": "string — semver (currently 1.0)",
  "timestamp": "string (ISO-8601 UTC) — when the event was produced",
  "user_id": "string — authenticated user who triggered the event",
  "payload": "object — event-specific data (see per-event definitions)"
}
```

---

## Topic: `task-events`

**Partitions**: 3
**Retention**: 7 days
**Partition key**: `user_id` (ensures ordering per user)

**Publishers**: backend (Chat API, REST API)
**Consumers**: recurring-service (consumer group: `recurring-service-task-events-v1`)

---

### Event: `task.created`

Published when a new one-time task is created.

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "task.created",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:00:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "Medium",
    "status": "pending",
    "due_date": "2026-02-25T18:00:00Z",
    "tags": ["personal", "errands"]
  }
}
```

---

### Event: `task.updated`

Published when a task's fields are updated (title, priority, status, tags, due_date).

```json
{
  "event_id": "uuid",
  "event_type": "task.updated",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:05:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "changed_fields": ["priority", "due_date"],
    "before": {
      "priority": "Low",
      "due_date": "2026-02-28T18:00:00Z"
    },
    "after": {
      "priority": "High",
      "due_date": "2026-02-22T09:00:00Z"
    }
  }
}
```

---

### Event: `task.deleted`

Published when a task is cancelled/deleted.

```json
{
  "event_id": "uuid",
  "event_type": "task.deleted",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:10:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "cancellation_reason": "user_request"
  }
}
```

---

### Event: `recurring.scheduled`

Published when a recurring task series is created. Triggers recurring-service to register a Dapr Job.

```json
{
  "event_id": "uuid",
  "event_type": "recurring.scheduled",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:00:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "series_id": "uuid-v4",
    "title": "Weekly team sync",
    "description": "Every Friday at 2 PM",
    "priority": "High",
    "tags": ["work", "meetings"],
    "rrule": "DTSTART;TZID=America/New_York:20260221T140000\nRRULE:FREQ=WEEKLY;BYDAY=FR",
    "timezone_iana": "America/New_York",
    "recurrence_end_type": null,
    "recurrence_max_count": null,
    "recurrence_end_date": null,
    "dapr_job_name": "recurring-task-uuid-v4"
  }
}
```

---

### Event: `recurring.cancelled`

Published when a recurring task series is cancelled. Triggers recurring-service to delete the Dapr Job.

```json
{
  "event_id": "uuid",
  "event_type": "recurring.cancelled",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T15:00:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "series_id": "uuid-v4",
    "dapr_job_name": "recurring-task-uuid-v4",
    "cancellation_reason": "user_request"
  }
}
```

---

## Topic: `reminders`

**Partitions**: 2
**Retention**: 24 hours
**Partition key**: `user_id`

**Publishers**: backend (when user sets a reminder)
**Consumers**: notification-service (consumer group: `notification-service-reminders-v1`)

---

### Event: `reminder.scheduled`

Published when a reminder is created for a task or task instance.

```json
{
  "event_id": "uuid",
  "event_type": "reminder.scheduled",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:00:00Z",
  "user_id": "user_abc123",
  "payload": {
    "reminder_id": "uuid-v4",
    "task_id": "uuid-v4",
    "task_instance_id": null,
    "reminder_type": "in_app",
    "scheduled_for": "2026-02-25T17:30:00Z",
    "task_title": "Buy groceries",
    "task_due_date": "2026-02-25T18:00:00Z"
  }
}
```

**Note**: Exactly one of `task_id` or `task_instance_id` will be non-null.

---

### Event: `reminder.cancelled`

Published when a reminder is cancelled.

```json
{
  "event_id": "uuid",
  "event_type": "reminder.cancelled",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:05:00Z",
  "user_id": "user_abc123",
  "payload": {
    "reminder_id": "uuid-v4",
    "task_id": "uuid-v4",
    "task_instance_id": null,
    "cancellation_reason": "task_deleted"
  }
}
```

---

## Topic: `task-updates`

**Partitions**: 2
**Retention**: 1 hour
**Partition key**: `user_id`

**Publishers**:
- recurring-service (after creating a task instance)
- backend (after status change)

**Consumers**: notification-service (consumer group: `notification-service-task-updates-v1`)

---

### Event: `task.instance_created`

Published by recurring-service after successfully creating a TaskInstance.

```json
{
  "event_id": "uuid",
  "event_type": "task.instance_created",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:00:01Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "series_id": "uuid-v4",
    "task_instance_id": "uuid-v4",
    "title": "Weekly team sync",
    "priority": "High",
    "scheduled_for": "2026-02-28T14:00:00Z",
    "instance_index": 1
  }
}
```

---

### Event: `task.status_changed`

Published when a task or task instance changes status.

```json
{
  "event_id": "uuid",
  "event_type": "task.status_changed",
  "schema_version": "1.0",
  "timestamp": "2026-02-21T14:30:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "task_instance_id": null,
    "previous_status": "pending",
    "new_status": "completed",
    "change_reason": "user_action"
  }
}
```

---

### Event: `task.overdue`

Published by notification-service or a scheduled check when a task passes its due_date without completion.

```json
{
  "event_id": "uuid",
  "event_type": "task.overdue",
  "schema_version": "1.0",
  "timestamp": "2026-02-25T18:01:00Z",
  "user_id": "user_abc123",
  "payload": {
    "task_id": "uuid-v4",
    "task_instance_id": null,
    "title": "Buy groceries",
    "due_date": "2026-02-25T18:00:00Z",
    "priority": "High"
  }
}
```

---

## Event Schema Versioning Policy

- Version format: `MAJOR.MINOR` (e.g., `1.0`)
- **Non-breaking additions** (new optional fields in `payload`): increment `MINOR`
- **Breaking changes** (rename/remove required fields, change type): increment `MAJOR`, create new topic with version suffix (e.g., `task-events-v2`), run both topics in parallel during migration
- All consumers MUST ignore unknown fields (forward-compatible parsing)
- `schema_version` field MUST be checked by consumers before processing

---

## Dapr Pub/Sub Integration Notes

Publishing (from backend/FastAPI via Dapr HTTP API):
```
POST http://localhost:3500/v1.0/publish/pubsub-kafka/task-events
Content-Type: application/json

{body as JSON above}
```

Subscribing (Dapr declarative subscription YAML):
```yaml
apiVersion: dapr.io/v1alpha1
kind: Subscription
metadata:
  name: recurring-service-task-events
spec:
  pubsubname: pubsub-kafka
  topic: task-events
  route: /events/task-events
  # Filter: only events relevant to this consumer
  filter: |
    event.type == "recurring.scheduled" || event.type == "recurring.cancelled"
```

Dapr delivers events via HTTP POST to the service's `route` endpoint. Service must return:
- `200 {"status": "SUCCESS"}` — processed; Dapr commits offset
- `200 {"status": "RETRY"}` — Dapr retries (up to configured limit)
- `200 {"status": "DROP"}` — Dapr skips; offset committed
