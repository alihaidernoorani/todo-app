# Feature Specification: Phase V — Advanced Cloud-Native AI Deployment

**Feature Branch**: `011-advanced-cloud-deploy`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: Phase V advanced cloud-native AI deployment with event-driven
architecture, Dapr, Kafka, Kubernetes, and advanced todo features (recurring tasks, reminders,
priorities, tags, search/filter).

---

## Overview

Phase V evolves the Todo application from a locally-deployed containerized system into a
fully decoupled, event-driven, cloud-native platform. The AI chatbot remains the primary
interface, but background processing (recurring tasks, reminders, notifications) is handled
by independent services that communicate exclusively through Kafka events — never by sharing
code or databases.

The Chat API's sole responsibility is to understand user intent and publish the correct event.
All business logic that runs "later" (scheduling, reminders, recurring recalculation) lives in
dedicated consumer services.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Schedule a Recurring Task (Priority: P1)

A user tells the chatbot they want a task to repeat on a schedule. The system creates the
task, registers the recurrence pattern, and ensures the task is automatically re-created or
reminded at each scheduled occurrence — without any further user action.

**Why this priority**: Recurring tasks are the most complex end-to-end flow in Phase V.
Validating this story confirms that the chatbot, event bus, scheduler, and notification
components all work together correctly.

**Independent Test**: A user says "Every Friday at 2 PM remind me to submit my weekly
report." After one week, the system sends a reminder and re-creates the task without user
intervention.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** the user says "Every Monday at 9 AM add a standup
   task", **Then** the system creates the task, confirms the recurrence pattern to the user
   ("I've set up a recurring standup task every Monday at 9 AM"), and schedules the first
   occurrence.

2. **Given** a scheduled recurring task, **When** the scheduled time arrives, **Then** the
   system automatically triggers a reminder notification and re-creates the task for the next
   occurrence without user action.

3. **Given** a recurring task, **When** the user says "Stop the weekly standup reminder",
   **Then** the recurrence is cancelled, future occurrences are not created, and the user
   is confirmed ("I've cancelled the recurring standup task").

4. **Given** a recurring task is active, **When** the user completes the current instance,
   **Then** the current instance is marked done and the next occurrence is scheduled
   automatically.

---

### User Story 2 — Set a One-Time Task Reminder (Priority: P2)

A user asks the chatbot to remind them about a specific task at a specific future time. The
reminder fires once at the correct time and is not repeated.

**Why this priority**: Reminders are a subset of the scheduling infrastructure and require
the Jobs API to be working. They validate the simpler scheduling path before recurring tasks.

**Independent Test**: A user says "Remind me about the dentist appointment tomorrow at 9 AM."
At 9 AM the next day, a reminder notification is delivered to the user.

**Acceptance Scenarios**:

1. **Given** a logged-in user with an existing task "dentist appointment", **When** the user
   says "Remind me about the dentist appointment tomorrow at 9 AM", **Then** the system
   confirms the reminder ("I'll remind you about 'dentist appointment' tomorrow at 9 AM")
   and schedules the notification.

2. **Given** a reminder is scheduled, **When** the target time arrives, **Then** the user
   receives a notification with the task title and a link to view it.

3. **Given** a pending reminder, **When** the user says "Cancel my dentist reminder",
   **Then** the reminder is cancelled and the user is confirmed.

4. **Given** a reminder fires, **When** the task has already been completed before the
   reminder time, **Then** the notification is suppressed or clearly marked as completed.

---

### User Story 3 — Create Tasks with Priority and Tags (Priority: P2)

A user can assign a priority level (high, medium, low) and one or more tags (e.g., "work",
"personal", "urgent") to tasks via natural language. These attributes are stored and visible
in the task list.

**Why this priority**: Priorities and tags are additive to existing task creation and enable
the search/filter story (US4). They must be in place before filtering can be tested.

**Independent Test**: A user says "Add a high-priority task: prepare presentation, tag: work".
The task appears in the list with "high" priority and "work" tag visible.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** the user says "Add a high-priority task: buy flight
   tickets, tags: travel, urgent", **Then** the task is created with priority=high and
   tags=["travel", "urgent"] and the chatbot confirms the details.

2. **Given** an existing task, **When** the user says "Change the priority of 'buy flight
   tickets' to low", **Then** the task's priority is updated and confirmed.

3. **Given** an existing task, **When** the user says "Add the tag 'expense' to 'buy flight
   tickets'", **Then** the tag is added without removing existing tags.

4. **Given** an existing task with tags, **When** the user says "Remove the 'urgent' tag from
   'buy flight tickets'", **Then** only that tag is removed; others remain.

---

### User Story 4 — Search and Filter Tasks (Priority: P3)

A user can ask the chatbot to show tasks matching specific criteria: priority, tag, due date
range, completion status, or keyword in title. Results are returned in the chat interface.

**Why this priority**: Search/filter depends on the priority+tags data from US3 and enriches
the user's ability to manage their task list at scale.

**Independent Test**: A user says "Show me all high-priority work tasks". The chatbot returns
only tasks that have priority=high and tag="work".

**Acceptance Scenarios**:

1. **Given** tasks with various priorities and tags, **When** the user says "Show me all
   high-priority tasks", **Then** only tasks with priority=high are listed.

2. **Given** tasks with various tags, **When** the user says "Show me all tasks tagged
   'work'", **Then** only tasks tagged "work" are listed.

3. **Given** tasks with various statuses, **When** the user says "Show me completed tasks
   from this week", **Then** only completed tasks with a completion date in the current week
   are returned.

4. **Given** a keyword search, **When** the user says "Find tasks about presentation",
   **Then** tasks whose title or description contains "presentation" are returned.

5. **Given** combined filters, **When** the user says "Show me high-priority incomplete work
   tasks due this week", **Then** only tasks matching all criteria are returned.

---

### User Story 5 — Deploy to Cloud Kubernetes (Priority: P1)

An operator can deploy all four services (frontend, backend, recurring-service,
notification-service) to a cloud Kubernetes cluster using a single command sequence. The
deployed system passes the same functional tests as the local Minikube deployment.

**Why this priority**: Cloud deployment is the primary DevOps goal of Phase V. Without it,
the architecture changes have no production-grade validation.

**Independent Test**: After running the cloud deployment commands, the chatbot is accessible
at a public HTTPS URL and the recurring task user story (US1) completes successfully end-to-end.

**Acceptance Scenarios**:

1. **Given** a cloud Kubernetes cluster with Dapr and Kafka installed, **When** the operator
   runs the Helm install commands with cloud value overrides, **Then** all pods reach
   `Running` state within 5 minutes.

2. **Given** a deployed cloud cluster, **When** a user accesses the public HTTPS URL,
   **Then** the chatbot loads and the user can log in without certificate errors.

3. **Given** a deployed cloud cluster, **When** a user creates a recurring task via chat,
   **Then** the full end-to-end flow (event → scheduler → notification) completes correctly
   on the cloud cluster.

4. **Given** a running deployment, **When** the operator scales the backend to 3 replicas,
   **Then** the system continues to serve requests without errors during scaling.

5. **Given** a GitHub push to the main branch, **When** CI/CD pipeline runs, **Then** new
   container images are built, pushed to the registry, and deployed to the cloud cluster
   automatically.

---

### Edge Cases

- **Timezone handling**: Recurring task "every Friday at 2 PM" must respect the user's
  timezone — not the server's timezone.
- **Missed schedules**: If the system is down when a reminder fires, the system must detect
  and deliver the missed reminder when it recovers (within a configurable grace period).
- **Duplicate events**: If the same event is delivered twice (Kafka at-least-once), consumer
  services must produce the same outcome (idempotency).
- **Overlapping recurrences**: If a recurring task is still pending when the next occurrence
  triggers, the system must not create a duplicate — it skips or logs the conflict.
- **Invalid recurrence expressions**: If the user's natural language cannot be parsed into a
  valid recurrence rule, the chatbot asks for clarification rather than silently failing.
- **Tag normalization**: Tags must be normalized to lowercase and trimmed. "Work" and "work"
  are the same tag.
- **Empty search results**: When a filter yields no results, the chatbot responds
  conversationally ("No high-priority tasks found. Would you like to see all tasks instead?").
- **Cloud cluster cold start**: First deployment to a cloud cluster must be idempotent — run
  twice without creating duplicates or errors.

---

## Requirements *(mandatory)*

### Functional Requirements

**Recurring Tasks**

- **FR-001**: The system MUST allow users to create tasks with a recurrence rule expressed
  in natural language (e.g., "every weekday", "every Friday at 2 PM", "monthly on the 1st").
- **FR-002**: The system MUST schedule the first occurrence of a recurring task immediately
  upon creation and schedule all subsequent occurrences automatically.
- **FR-003**: The system MUST re-create or re-activate a recurring task instance at each
  scheduled occurrence without user intervention.
- **FR-004**: The system MUST allow users to cancel a recurring task series via the chatbot.
- **FR-005**: The system MUST handle timezone-aware scheduling — occurrences fire at the
  correct local time for the user, not server time.
- **FR-006**: The system MUST skip or log a conflict when a recurring task occurrence is
  triggered while the previous instance is still pending.

**Reminders**

- **FR-007**: The system MUST allow users to attach a one-time reminder to any task, with a
  specific date and time.
- **FR-008**: The system MUST deliver a notification to the user at the scheduled reminder
  time.
- **FR-009**: The system MUST suppress a reminder if the associated task is already completed
  before the reminder fires.
- **FR-010**: The system MUST allow users to cancel a pending reminder via the chatbot.
- **FR-011**: The system MUST handle missed reminders (fire during downtime) by delivering
  them within a configurable grace period upon recovery.

**Priorities and Tags**

- **FR-012**: The system MUST support three priority levels for tasks: high, medium, low.
  Default priority is medium if not specified.
- **FR-013**: The system MUST support one or more tags per task (free-form strings, normalized
  to lowercase).
- **FR-014**: The system MUST allow users to add, remove, and change task priority and tags
  via the chatbot.
- **FR-015**: Priority and tags MUST be visible in the task list UI.

**Search and Filter**

- **FR-016**: The system MUST allow users to filter tasks by priority, tag, completion
  status, and due date range via the chatbot.
- **FR-017**: The system MUST allow keyword search across task titles and descriptions.
- **FR-018**: The system MUST support combined filters in a single query (e.g., priority AND
  tag AND status).
- **FR-019**: The system MUST respond conversationally when no results match the filter.

**Event-Driven Architecture**

- **FR-020**: Every task mutation (create, update, complete, delete) MUST publish an event
  to the `task-events` topic.
- **FR-021**: Every reminder scheduling action MUST publish an event to the `reminders` topic.
- **FR-022**: Real-time task state changes (completion, deletion) MUST publish to the
  `task-updates` topic for frontend consumption.
- **FR-023**: The Chat API MUST NOT perform recurring logic or reminder scheduling directly;
  it MUST only publish events and return a response to the user.
- **FR-024**: All consumer services MUST process events idempotently — reprocessing the same
  event MUST NOT produce duplicate side effects.

**Cloud Infrastructure**

- **FR-025**: All four services (frontend, backend, recurring-service, notification-service)
  MUST be deployable to a cloud Kubernetes cluster via Helm with a single command per service.
- **FR-026**: The system MUST support environment-specific Helm value overrides for cloud
  deployment (separate from local Minikube values).
- **FR-027**: External access on the cloud cluster MUST use HTTPS with valid TLS certificates.
- **FR-028**: A CI/CD pipeline MUST automatically build, push, and deploy new container
  images on merge to the main branch.
- **FR-029**: All credentials and secrets MUST be retrieved from Kubernetes Secrets at
  runtime — no hardcoded values in any artifact.

---

### Key Entities

- **Task**: A user-owned work item with title, description, status, priority, tags, due date,
  recurrence rule, and reminder time. One task may have zero or one active recurrence rule
  and zero or more past occurrences.

- **RecurrenceRule**: Defines the repeat pattern for a task: frequency (daily, weekly,
  monthly), day-of-week, time-of-day, timezone, and end condition (count or end date).

- **Reminder**: A one-time scheduled notification attached to a task. Tracks target time,
  delivery status (pending, delivered, cancelled, missed), and the task it belongs to.

- **Tag**: A normalized string label attached to one or more tasks for a given user. Tags are
  owned at the user level (same tag string shared across tasks).

- **TaskEvent**: A domain event published when a task is created, updated, completed, or
  deleted. Carries event_type, task_id, user_id, timestamp, and a payload snapshot.

- **ReminderEvent**: A domain event published when a reminder is triggered by the scheduler.
  Carries reminder_id, task_id, user_id, and target_time.

- **TaskUpdateEvent**: A lightweight event for real-time frontend propagation. Carries
  task_id, user_id, change_type (completed/deleted/updated), and a summary payload.

---

## Event Schema Contracts

### Topic: `task-events`

Published by: Backend (on every task CRUD operation)
Consumed by: Recurring Service, Notification Service

```
{
  event_id:    string (UUID, for idempotency deduplication)
  event_type:  "task.created" | "task.updated" | "task.completed" | "task.deleted"
  task_id:     string (UUID)
  user_id:     string (UUID)
  timestamp:   string (ISO 8601)
  payload: {
    title:           string
    priority:        "high" | "medium" | "low"
    tags:            string[]
    due_date:        string | null (ISO 8601 date)
    recurrence_rule: RecurrenceRule | null
    reminder_time:   string | null (ISO 8601 datetime)
    status:          "pending" | "completed" | "cancelled"
  }
}
```

### Topic: `reminders`

Published by: Dapr Jobs API callback → Recurring Service
Consumed by: Notification Service

```
{
  event_id:     string (UUID, for idempotency deduplication)
  reminder_id:  string (UUID)
  task_id:      string (UUID)
  user_id:      string (UUID)
  timestamp:    string (ISO 8601, when the reminder fired)
  target_time:  string (ISO 8601, the originally scheduled time)
  reminder_type: "one-time" | "recurring"
}
```

### Topic: `task-updates`

Published by: Backend (on task state changes relevant to UI)
Consumed by: Frontend (via WebSocket or SSE relay)

```
{
  event_id:    string (UUID)
  task_id:     string (UUID)
  user_id:     string (UUID)
  timestamp:   string (ISO 8601)
  change_type: "completed" | "deleted" | "updated" | "created"
  summary: {
    title:    string
    priority: "high" | "medium" | "low"
    tags:     string[]
    status:   "pending" | "completed" | "cancelled"
  }
}
```

---

## Dapr Component Responsibilities

| Component | Building Block | Backend | Purpose |
|---|---|---|---|
| `pubsub-kafka` | Pub/Sub | Kafka | Publish/consume all three topics |
| `statestore-neon` | State Store | Neon PostgreSQL | Store conversation history per user |
| `secretstore-k8s` | Secrets Store | Kubernetes Secrets | Retrieve OpenAI key, DB URL, auth secret |
| `jobs-api` | Jobs API | Dapr scheduler | Trigger reminders and recurring task fires |
| `service-invoke` | Service Invocation | Dapr sidecar | Synchronous backend → recurring-service calls (if needed) |

---

## Kubernetes Service Responsibilities

| Service | Port | Dapr App ID | Primary Responsibility |
|---|---|---|---|
| `frontend` | 3000 | `frontend` | Serve ChatKit UI; relay `task-updates` events to browser |
| `backend` | 8000 | `backend` | Handle REST API + AI agent; publish to all three topics |
| `recurring-service` | 8001 | `recurring-service` | Subscribe `task-events`; manage recurrence state; publish `reminders` |
| `notification-service` | 8002 | `notification-service` | Subscribe `task-events` + `reminders`; send user notifications |
| `kafka` | 9092 | — | Message broker (StatefulSet or managed service) |
| `dapr-dashboard` | 8080 | — | Observability for Dapr components (local only) |

---

## User Journey: Recurring Task End-to-End Flow

```
User Input (Chat UI)
  "Every Friday at 2 PM, remind me to submit my weekly report"
        │
        ▼
[Frontend] → HTTP POST /api/chat → [Backend / AI Agent]
        │
        ▼
[AI Agent] interprets intent:
  - Task title: "Submit weekly report"
  - Recurrence: every Friday at 14:00 user timezone
        │
        ▼
[Backend] creates Task record in DB (status=pending, recurrence_rule set)
        │
        ▼
[Backend] publishes to `task-events` topic:
  { event_type: "task.created", payload: { recurrence_rule: {...} } }
        │
        ▼
[Dapr PubSub] routes event to:
        ├──► [Recurring Service] receives event
        │        │
        │        ▼
        │    Registers recurrence with Dapr Jobs API:
        │    "Fire callback every Friday at 14:00 UTC"
        │
        └──► [Notification Service] receives event
                 │
                 ▼
             Logs task creation (no notification yet)

--- [Next Friday 14:00 UTC] ---

[Dapr Jobs API] fires scheduled callback → [Recurring Service]
        │
        ▼
[Recurring Service] processes trigger:
  1. Creates next task instance in DB
  2. Publishes to `reminders` topic:
     { reminder_type: "recurring", task_id, user_id, target_time }
  3. Schedules next Friday's occurrence via Dapr Jobs API
        │
        ▼
[Notification Service] receives `reminders` event:
  1. Checks task is not already completed
  2. Sends user notification (in-app, email, or push)
  3. Marks reminder as delivered
        │
        ▼
[Backend] publishes to `task-updates` topic:
  { change_type: "created", task_id, summary: {...} }
        │
        ▼
[Frontend] receives `task-updates` via SSE/WebSocket → updates task list UI
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a recurring task through natural language and receive accurate
  automatic occurrences without any further interaction, validated across at least 3
  consecutive scheduled fires.

- **SC-002**: Reminder notifications are delivered within 60 seconds of the scheduled time
  under normal operating conditions.

- **SC-003**: Duplicate event delivery (same event_id published twice) produces exactly one
  side effect in every consumer service — verified by sending 100 duplicate events and
  confirming zero duplicates in output.

- **SC-004**: All four services remain operational after any single service pod is restarted,
  with no data loss and no duplicate processing — validated via chaos pod deletion test.

- **SC-005**: Task search with combined filters (priority + tag + status) returns correct
  results in under 2 seconds for a task list of up to 10,000 tasks.

- **SC-006**: The full cloud deployment (all four services + Dapr + Kafka) completes
  successfully from a clean cluster using documented commands in under 15 minutes.

- **SC-007**: The CI/CD pipeline automatically builds, pushes, and deploys a code change to
  the cloud cluster within 10 minutes of a merge to the main branch.

- **SC-008**: Zero hardcoded secrets are found in any committed file, verified by an
  automated secret-scanning tool run on every PR.

- **SC-009**: The system handles at least 500 concurrent users managing tasks through the
  chatbot without response time degrading beyond 3 seconds for simple operations.

- **SC-010**: A missed reminder (system down at fire time) is delivered within the configured
  grace period (default: 15 minutes) upon system recovery.

---

## Assumptions

1. **Notification channel**: In-app notification (visible in UI) is the baseline. Email or
   push notifications are out of scope for Phase V unless explicitly requested.
2. **Recurrence expression parsing**: The AI agent is responsible for parsing natural
   language into a structured recurrence rule. The recurring service consumes the structured
   rule only — it does not parse natural language.
3. **User timezone**: User timezone is stored as part of the user profile (set during
   onboarding or defaulting to UTC). All scheduling uses this stored timezone.
4. **Cloud target**: AKS (Azure Kubernetes Service) is the primary cloud target for Phase V.
   Other providers (GKE, DOKS) are supported via the same Helm charts with different cloud
   value overrides.
5. **Kafka deployment**: Kafka runs as a Kubernetes StatefulSet for local Minikube. For cloud,
   a managed Kafka service (Azure Event Hubs, Confluent Cloud, or Aiven) is used with the
   same Dapr PubSub component.
6. **Notification service scope**: For Phase V, "notification" means storing a notification
   record in the database and updating the frontend via `task-updates` events. In-app badge
   counts and toasts are delivered via the existing real-time channel.
7. **Database migrations**: Priority and tags columns are added via Alembic migration. No
   data is backfilled for existing tasks (they default to medium priority, no tags).

