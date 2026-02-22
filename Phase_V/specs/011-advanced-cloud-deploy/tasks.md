# Tasks: Phase V — Advanced Cloud-Native AI Deployment

**Input**: Design documents from `specs/011-advanced-cloud-deploy/`
**Branch**: `011-advanced-cloud-deploy`
**Date**: 2026-02-21
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Existing foundation** (Phase IV — do NOT rebuild):
- `backend/src/` — FastAPI app with Task model, auth, OpenAI Agents SDK, MCP tools
- `frontend/` — Next.js App Router with chat UI and task dashboard
- `helm/backend/` and `helm/frontend/` — Helm charts (no Dapr annotations yet)
- `backend/alembic/versions/` — Migrations 001–003 + conversation tables

**Phase V adds** (new):
- `services/recurring-service/` — Kafka consumer + Dapr Jobs handler
- `services/notification-service/` — Kafka consumer + notification delivery
- `dapr/components/` — Dapr component YAML manifests (local + cloud)
- `helm/recurring-service/`, `helm/notification-service/` — New Helm charts
- `k8s/` — Cluster-level resources (cert-manager, KEDA)
- `.github/workflows/` — CI/CD pipeline

**Format**: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- `[P]` = parallelizable (different files, no incomplete dependencies)
- `[US#]` = user story label (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold all new directories and skeleton files needed by Phase V.
No business logic — just structure, empty stubs, and dependency declarations.

- [X] T001 Create `services/recurring-service/` directory with FastAPI app skeleton: `services/recurring-service/app/__init__.py`, `services/recurring-service/app/main.py` (FastAPI app with `/health` and Dapr subscription route stubs), `services/recurring-service/requirements.txt` (fastapi, uvicorn, httpx, python-dateutil, sqlmodel, psycopg2-binary, prometheus-fastapi-instrumentator)
- [X] T002 [P] Create `services/notification-service/` directory with FastAPI app skeleton: `services/notification-service/app/__init__.py`, `services/notification-service/app/main.py` (FastAPI app with `/health` and Dapr subscription route stubs), `services/notification-service/requirements.txt` (fastapi, uvicorn, httpx, sqlmodel, psycopg2-binary)
- [X] T003 [P] Create Dapr component directory structure: `dapr/components/local/` and `dapr/components/cloud/` (both empty, populated in Phase 2 foundational tasks)
- [X] T004 [P] Create `helm/recurring-service/` Helm chart by copying `helm/backend/` structure — `Chart.yaml` (name: recurring-service, version: 0.1.0), `values.yaml` (replicaCount: 1, image.repository: recurring-service, service.port: 8001, resources with 200m/500m CPU, 256Mi/512Mi memory), `templates/deployment.yaml` (with placeholder Dapr annotations), `templates/service.yaml`
- [X] T005 [P] Create `helm/notification-service/` Helm chart mirroring `helm/recurring-service/` with port 8002 in `helm/notification-service/Chart.yaml`, `helm/notification-service/values.yaml`, `helm/notification-service/templates/deployment.yaml`, `helm/notification-service/templates/service.yaml`
- [X] T006 [P] Create `k8s/` directory with skeleton YAMLs: `k8s/cluster-issuer.yaml` (ClusterIssuer template with placeholder email), `k8s/keda-scaled-objects.yaml` (ScaledObject skeletons for recurring-service and notification-service), `k8s/namespace-limits.yaml` (LimitRange template)
- [X] T007 [P] Add `python-dateutil`, `httpx`, and `prometheus-fastapi-instrumentator` to `backend/requirements.txt` (these are new Phase V dependencies not present in Phase IV)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core integration layer that MUST be complete before any user story can be implemented.
Includes Dapr components, Kafka event publishing service, Alembic migrations for new tables, and Helm Dapr annotations.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T008 Create `dapr/components/local/pubsub-kafka.yaml` — Dapr pubsub.kafka v1 component targeting Redpanda on Minikube: brokers=`redpanda.kafka.svc.cluster.local:9092`, authType=none, consumerGroup placeholder `<service>-<domain>-v1`. Create `dapr/components/cloud/pubsub-kafka.yaml` with brokers=`kafka-xxxxx.a.aivencloud.com:9092`, authType=password, saslUsername/saslPassword via secretKeyRef to `kafka-credentials`, tlsEnabled=true
- [X] T009 [P] Create `dapr/components/local/statestore-postgres.yaml` — state.postgresql v2 component: connectionString via secretKeyRef `postgres-secret`, tableName=dapr_state, cleanupInterval=1h, sslmode=disable. Create `dapr/components/cloud/statestore-postgres.yaml` with sslmode=require
- [X] T010 [P] Create `dapr/components/local/secretstore-kubernetes.yaml` and `dapr/components/cloud/secretstore-kubernetes.yaml` — secretstores.kubernetes v1 component with no metadata fields (auto-discovers secrets in pod namespace)
- [X] T011 Create Dapr subscription manifests: `dapr/subscriptions/recurring-service-subscriptions.yaml` — Dapr Subscription CRD subscribing to `pubsub-kafka` topic `task-events`, route `/events/task-events`, filter for `recurring.scheduled` and `recurring.cancelled` event types only. Create `dapr/subscriptions/notification-service-subscriptions.yaml` for `reminders` topic (route `/events/reminders`) and `task-updates` topic (route `/events/task-updates`)
- [X] T012 Create `backend/src/services/dapr_pubsub.py` — `DaprPubSubService` class with `async publish(topic: str, data: dict) -> None` method that POSTs to `http://localhost:{DAPR_HTTP_PORT}/v1.0/publish/pubsub-kafka/{topic}` using httpx.AsyncClient. Include `DAPR_HTTP_PORT` env var (default 3500). Handle HTTP errors with structured logging
- [X] T013 [P] Create `backend/src/services/dapr_jobs.py` — `DaprJobsService` class with three async methods: `create_job(job_name: str, schedule: str, data: dict, ttl: str = None)` → POST to `/v1.0-alpha1/jobs/{job_name}`; `delete_job(job_name: str)` → DELETE to `/v1.0-alpha1/jobs/{job_name}`; `get_job(job_name: str)` → GET to `/v1.0-alpha1/jobs/{job_name}`. All use httpx.AsyncClient targeting `http://localhost:{DAPR_HTTP_PORT}`
- [X] T014 [P] Create `backend/src/services/dapr_secrets.py` — `DaprSecretsService` class with `async get_secret(secret_name: str, key: str) -> str` that GETs `http://localhost:{DAPR_HTTP_PORT}/v1.0/secrets/kubernetes/{secret_name}?key={key}` and returns the value string. Used at startup to resolve secrets not available as env vars
- [X] T015 Add Dapr sidecar annotations to `helm/backend/templates/deployment.yaml` under `spec.template.metadata.annotations`: `dapr.io/enabled: "true"`, `dapr.io/app-id: "backend"`, `dapr.io/app-port: "8000"`, `dapr.io/app-protocol: "http"`, `dapr.io/cpu-request: "100m"`, `dapr.io/memory-request: "128Mi"`, `dapr.io/cpu-limit: "500m"`, `dapr.io/memory-limit: "512Mi"`. Annotations MUST be in `spec.template.metadata`, NOT top-level `metadata`
- [X] T016 [P] Add Dapr sidecar annotations to `helm/frontend/templates/deployment.yaml` with `dapr.io/app-id: "frontend"` and `dapr.io/app-port: "3000"`. Add identical annotations with `dapr.io/app-id: "recurring-service"` / port 8001 to `helm/recurring-service/templates/deployment.yaml` and `dapr.io/app-id: "notification-service"` / port 8002 to `helm/notification-service/templates/deployment.yaml`
- [X] T017 Create `helm/backend/templates/rbac.yaml` — ServiceAccount `backend`, Role `backend-secrets` (get/list on secrets), RoleBinding `backend-secrets-binding`. Repeat pattern in `helm/recurring-service/templates/rbac.yaml` (SA: `recurring-service`) and `helm/notification-service/templates/rbac.yaml` (SA: `notification-service`). Reference `serviceAccountName` in each deployment template
- [X] T018 Create Alembic migration `backend/alembic/versions/004_add_tags_tables.py` — add `tags` table (id UUID PK, user_id string NOT NULL indexed, name string(50) NOT NULL) with UNIQUE constraint on `(user_id, lower(name))`; add `task_tags` junction table (task_id UUID FK tasks.id, tag_id UUID FK tags.id, composite PK); downgrade drops both tables
- [X] T019 [P] Create Alembic migration `backend/alembic/versions/005_add_recurring_task_tables.py` — add `recurring_tasks` table (id, task_id FK tasks.id UNIQUE, user_id, series_id, rrule text, timezone_iana string, recurrence_end_type nullable, recurrence_max_count nullable int, recurrence_end_date nullable datetime, status string default=active, next_occurrence_at_utc datetime indexed, current_instance_index int, total_occurrences_executed int, created_at, updated_at); add `task_instances` table (id, parent_task_id FK recurring_tasks.id indexed, user_id, title, priority, scheduled_for_utc datetime indexed, status string, completed_at nullable, error_message nullable, retry_count int, created_at, updated_at). Create composite indexes: `(status, next_occurrence_at_utc)` on recurring_tasks; `(user_id, scheduled_for_utc)` and `(parent_task_id, status)` on task_instances
- [X] T020 [P] Create Alembic migration `backend/alembic/versions/006_add_reminders_table.py` — add `reminders` table (id UUID PK, user_id string indexed, task_id UUID nullable FK tasks.id, task_instance_id UUID nullable FK task_instances.id, reminder_type string, scheduled_for_utc datetime indexed, status string default=pending, sent_at nullable datetime, error_message nullable, created_at). Create composite index `(status, scheduled_for_utc)`. Downgrade drops table
- [X] T021 [P] Create Alembic migration `backend/alembic/versions/007_add_event_log_table.py` — add `processed_event_logs` table (id UUID PK, event_id string indexed, idempotency_key string NOT NULL, UNIQUE(idempotency_key), event_type string, status string, result_id nullable string, error_message nullable, event_timestamp datetime, processed_at datetime, expires_at datetime indexed). Downgrade drops table
- [X] T022 Add Prometheus instrumentation to `backend/src/main.py` — import `Instrumentator` from `prometheus_fastapi_instrumentator`; after `app = FastAPI(...)`, add `Instrumentator(group_paths=True, skip_paths=["/health"]).instrument(app).expose(app, endpoint="/metrics")`; expose port 9090 for metrics scraping (add `metrics` port to Helm service template `helm/backend/templates/service.yaml`)

**Checkpoint**: All Dapr services + migrations + instrumentation in place. Ready for user story implementation.

---

## Phase 3: User Story 1 — Schedule a Recurring Task (Priority: P1) 🎯 MVP

**Goal**: User can create a recurring task via chat, the system registers a Dapr Job, and recurring-service creates TaskInstances at each scheduled time with full idempotency.

**Independent Test**: `POST /api/tasks/recurring` with RRULE `FREQ=WEEKLY;BYDAY=FR;BYHOUR=14` → RecurringTask created → `recurring.scheduled` event on `task-events` topic → recurring-service registers Dapr Job → at Friday 14:00, Dapr fires `/job/recurring-task-trigger` → TaskInstance created → `task.instance_created` event on `task-updates` → duplicate event replay produces no second TaskInstance.

### Implementation: Backend Models (US1)

- [X] T023 [P] [US1] Create `backend/src/models/recurring.py` — define `RecurringTask` SQLModel (table=True) with all fields from `data-model.md` section 3: id, task_id FK tasks.id UNIQUE, user_id, series_id, rrule, timezone_iana, recurrence_end_type, recurrence_max_count, recurrence_end_date, status, next_occurrence_at_utc, current_instance_index, total_occurrences_executed, created_at, updated_at. Define `TaskInstance` SQLModel (table=True) with all fields from data-model.md section 4. Include `__table_args__` composite indexes
- [X] T024 [P] [US1] Create `backend/src/models/event_log.py` — define `ProcessedEventLog` SQLModel (table=True) with UniqueConstraint on `idempotency_key`. Fields: id, event_id, idempotency_key, event_type, status, result_id, error_message, event_timestamp, processed_at, expires_at. Import this model in `backend/src/models/__init__.py`

### Implementation: Backend Services (US1)

- [X] T025 [US1] Create `backend/src/services/rrule_service.py` — `RRuleService` class with: `parse_rrule(rrule_str: str) -> None` (validate using `rrulestr()`; raise ValueError if invalid); `compute_next_occurrence(rrule_str: str, after: datetime = None) -> datetime | None` (use `rrulestr(rrule_str).after(after or now_utc)`); `rrule_to_dapr_cron(rrule_str: str) -> str` (convert RRULE to 6-field cron string for Dapr Jobs API); `validate_timezone(tz_name: str) -> None` (call `ZoneInfo(tz_name)`; raise ValueError if invalid). Import `zoneinfo.ZoneInfo`, `dateutil.rrule.rrulestr`
- [X] T026 [P] [US1] Create `backend/src/services/recurring_task_service.py` — `RecurringTaskService` class with: `create_recurring_task(task_id: UUID, user_id: str, rrule: str, timezone_iana: str, ...) -> RecurringTask` (validates RRULE + timezone; computes next_occurrence_at_utc; inserts RecurringTask; calls `DaprJobsService.create_job()` with job_name=`recurring-task-{task_id}`); `cancel_recurring_task(task_id: UUID, user_id: str) -> None` (sets status=cancelled; calls `DaprJobsService.delete_job()`); `advance_next_occurrence(task: RecurringTask) -> RecurringTask` (recompute next_occurrence_at_utc using rrule_service; update DB record)

### Implementation: Backend API (US1)

- [X] T027 [US1] Create `backend/src/api/v1/recurring.py` — FastAPI router with these endpoints (all JWT-protected via existing `deps.get_current_user`): `POST /api/tasks/recurring` (accepts `RecurringTaskCreate` schema; calls `task_service.create_task()`; calls `recurring_task_service.create_recurring_task()`; publishes `recurring.scheduled` event via `dapr_pubsub.publish("task-events", event)`; returns `RecurringTaskResponse`); `GET /api/tasks/recurring/{task_id}` (returns series); `PATCH /api/tasks/recurring/{task_id}` (update rrule/timezone; delete+recreate Dapr job); `DELETE /api/tasks/recurring/{task_id}` (cancel series; calls cancel_recurring_task); `GET /api/tasks/recurring/{task_id}/instances` (paginated TaskInstance list). Register router in `backend/src/api/v1/router.py`
- [X] T028 [P] [US1] Add `RecurringTaskCreate` and `RecurringTaskResponse` schemas to `backend/src/schemas/task.py` — `RecurringTaskCreate` (title, description, priority, rrule, timezone_iana, recurrence_end_type, recurrence_max_count, recurrence_end_date, tags); `RecurringTaskResponse` (all RecurringTask fields + `next_occurrence_at` as ISO-8601 string + `task: TaskRead` sub-object)
- [X] T029 [US1] Update OpenAI agent in `backend/src/agents/core/agent.py` to handle recurring task intent — add recurring task tool that extracts RRULE from natural language (e.g., "every Monday at 9 AM" → `FREQ=WEEKLY;BYDAY=MO;BYHOUR=9`) and calls `POST /api/tasks/recurring`. The agent must ask for clarification if recurrence cannot be parsed unambiguously. Add tool definition and handler in `backend/src/agents/mcp/mcp_tools.py` or `backend/src/agents/core/agent.py`

### Implementation: recurring-service (US1)

- [X] T030 [US1] Create `services/recurring-service/app/consumers/__init__.py` and `services/recurring-service/app/consumers/task_events.py` — FastAPI router handling `POST /events/task-events`. Receives Dapr CloudEvent, routes by `event_type`: `recurring.scheduled` → calls `register_recurring_job(event)`; `recurring.cancelled` → calls `cancel_recurring_job(event)`. Return `{"status": "SUCCESS"}` on success, `{"status": "RETRY"}` on transient errors, `{"status": "DROP"}` on non-retriable errors. Register router in `services/recurring-service/app/main.py`
- [X] T031 [P] [US1] Create `services/recurring-service/app/services/dapr_jobs_client.py` — `RecurringJobsClient` using httpx.AsyncClient: `register_job(task_id: str, rrule: str, timezone_iana: str, payload: dict)` → converts RRULE to 6-field cron → POST to `http://localhost:3500/v1.0-alpha1/jobs/recurring-task-{task_id}`; `cancel_job(task_id: str)` → DELETE; `job_name_for_task(task_id: str) -> str` → returns `recurring-task-{task_id}`
- [X] T032 [US1] Create `services/recurring-service/app/handlers/job_callback.py` — FastAPI router at `POST /job/recurring-task-trigger`. Receives Dapr job callback body (JSON with `data` field as JSON-encoded string). Parse `data` to extract `task_id`, `user_id`, `scheduled_time`. Call `instance_creator.create_instance_idempotent()`. On success return 200. Add handler to `services/recurring-service/app/main.py`
- [X] T033 [US1] Create `services/recurring-service/app/services/instance_creator.py` — `InstanceCreator` class with `async create_instance_idempotent(task_id: str, user_id: str, scheduled_time: datetime) -> dict`: (1) compute idempotency_key = `sha256("{user_id}:{task_id}:{scheduled_time.isoformat()}")[:16]`; (2) check ProcessedEventLog for existing key → return cached result_id if found; (3) insert ProcessedEventLog with status=processing; (4) create TaskInstance in DB; (5) update ProcessedEventLog to processed + result_id; (6) call publisher to publish task.instance_created. Uses SQLModel session from `services/recurring-service/app/db.py`
- [X] T034 [P] [US1] Create `services/recurring-service/app/services/publisher.py` — `EventPublisher` class with `async publish_instance_created(task_instance: TaskInstance)` that POSTs to `http://localhost:3500/v1.0/publish/pubsub-kafka/task-updates` with `task.instance_created` event payload as defined in `contracts/events.md`
- [X] T035 [P] [US1] Create `services/recurring-service/app/db.py` — SQLModel engine using `DATABASE_URL` env var; session factory; create tables for `TaskInstance` and `ProcessedEventLog` on startup. Mirror pattern from `backend/src/database.py`
- [X] T036 [US1] Create `services/recurring-service/Dockerfile` — multi-stage: `FROM python:3.11-slim AS base`; `WORKDIR /app`; `COPY requirements.txt .`; `RUN pip install --no-cache-dir -r requirements.txt`; `COPY app/ ./app/`; `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]`

**Checkpoint**: User Story 1 fully functional. Recurring task created via API → event published → recurring-service registers Dapr Job → at scheduled time, TaskInstance created with idempotency. Testable end-to-end on Minikube.

---

## Phase 4: User Story 3 — Create Tasks with Priority and Tags (Priority: P2)

**Goal**: Users assign priority (High/Medium/Low) and tags to tasks via chat. Tags stored normalized (lowercase). Both visible in task list UI.

**Independent Test**: `POST /api/tasks` with `{title: "Prepare deck", priority: "High", tags: ["work", "Q1"]}` → Task stored with priority=High, tags=["q1","work"] (normalized) → `GET /api/tasks?priority=High&tags=work` returns this task. Chat: "Add high-priority task tagged work" → agent calls create with correct fields.

**Note**: `priority` column already added in Alembic migration 002. Task is to add `tags` M2M relationship and expose both in API.

### Implementation: Backend Models & Services (US3)

- [X] T037 [P] [US3] Create `backend/src/models/tag.py` — `Tag` SQLModel (table=True) and `TaskTag` SQLModel (table=True) per `data-model.md` section 2. Import both in `backend/src/models/__init__.py`. Add `tags: list[Tag]` relationship to `Task` model in `backend/src/models/task.py` via `Relationship(back_populates="tasks", link_model=TaskTag)`
- [X] T038 [US3] Create `backend/src/services/tag_service.py` — `TagService` with: `normalize_tag(name: str) -> str` (strip + lower); `get_or_create_tag(user_id: str, name: str, session) -> Tag`; `set_task_tags(task_id: UUID, user_id: str, tag_names: list[str], session) -> list[Tag]` (normalize all, upsert tags, update TaskTag junction); `remove_tag_from_task(task_id: UUID, tag_id: UUID, session) -> None`
- [X] T039 [US3] Extend `backend/src/services/task_service.py` — update `create_task()` to accept `priority: str` and `tags: list[str]`, pass to `tag_service.set_task_tags()` after task creation; update `update_task()` to accept optional `priority` change and `tags` replacement. Publish `task.created` or `task.updated` event via `DaprPubSubService` after every mutation. Event payload must include `priority` and `tags` fields per `contracts/events.md`
- [X] T040 [P] [US3] Update `backend/src/schemas/task.py` — add `priority: str = "Medium"` and `tags: list[str] = []` to `TaskCreate` schema; add both to `TaskUpdate` (optional); add both to `TaskRead` response schema

### Implementation: Backend API (US3)

- [X] T041 [US3] Create `backend/src/api/v1/tags.py` — FastAPI router: `GET /api/tags` (list all tags for current user, returns `list[TagRead]`); `DELETE /api/tags/{tag_id}` (remove tag from all tasks for user). Register in `backend/src/api/v1/router.py`. Update `POST /api/tasks` and `PATCH /api/tasks/{id}` in `backend/src/api/v1/tasks.py` to call tag_service and include tags in response

### Implementation: Agent (US3)

- [X] T042 [P] [US3] Update OpenAI agent tool definitions in `backend/src/agents/mcp/mcp_tools.py` — `create_task` tool schema must include `priority: "High"|"Medium"|"Low"` and `tags: string[]` parameters; `update_task` tool must include optional `priority` and `tags` fields; agent instructions must parse natural language priority ("high priority" → "High") and tags (#work → "work")

### Implementation: Frontend (US3)

- [X] T043 [P] [US3] Update `frontend/components/dashboard/TaskForm.tsx` — add priority selector (radio buttons or dropdown: High/Medium/Low, default Medium) and tag input (freeform text with comma-separated entry + tag chips display). Use existing form component patterns
- [X] T044 [P] [US3] Update `frontend/components/dashboard/TaskItem.tsx` — display priority badge (color-coded: red=High, yellow=Medium, grey=Low) and tag chips next to task title. Update `frontend/lib/api/types.ts` to add `priority: string` and `tags: string[]` to `Task` type
- [X] T045 [P] [US3] Update `frontend/contexts/TasksContext.tsx` — include `priority` and `tags` in task create/update calls to backend API. Update `frontend/lib/api/tasks.ts` to pass these fields in request bodies

**Checkpoint**: User Story 3 functional. Priority + tags created, updated, returned in API, and visible in dashboard UI.

---

## Phase 5: User Story 2 — Set a One-Time Task Reminder (Priority: P2)

**Goal**: User sets a reminder for any task. Dapr Jobs API fires at scheduled time. notification-service delivers in-app notification. Reminder suppressed if task already completed.

**Independent Test**: `POST /api/reminders` with `{task_id: uuid, scheduled_for: "2026-02-22T09:00:00Z"}` → Reminder stored → `reminder.scheduled` event on `reminders` topic → notification-service stores notification → at 09:00 notification delivered → if task was completed before 09:00, notification suppressed.

### Implementation: Backend Models & Services (US2)

- [X] T046 [P] [US2] Create `backend/src/models/reminder.py` — `Reminder` SQLModel (table=True) per `data-model.md` section 5: id, user_id, task_id nullable FK, task_instance_id nullable FK, reminder_type, scheduled_for_utc, status, sent_at nullable, error_message nullable, created_at. Add CHECK constraint: exactly one of task_id or task_instance_id must be non-null. Import in `backend/src/models/__init__.py`
- [X] T047 [US2] Create `backend/src/services/reminder_service.py` — `ReminderService` with: `create_reminder(user_id: str, task_id: UUID | None, task_instance_id: UUID | None, scheduled_for: datetime, session) -> Reminder` (validates exactly one of task_id/task_instance_id set; validates scheduled_for is in the future; inserts Reminder; registers Dapr Job with job_name=`reminder-{reminder_id}`, schedule=dueTime `scheduled_for.isoformat()`); `cancel_reminder(reminder_id: UUID, user_id: str, session) -> None` (set status=cancelled; call DaprJobsService.delete_job); `suppress_if_completed(reminder_id: UUID, session) -> bool` (check if associated task/instance is completed; update reminder to cancelled if so; return bool)

### Implementation: Backend API (US2)

- [X] T048 [US2] Create `backend/src/api/v1/reminders.py` — FastAPI router: `POST /api/reminders` (accepts `ReminderCreate`; calls `reminder_service.create_reminder()`; publishes `reminder.scheduled` event to `reminders` topic via `DaprPubSubService`; returns `ReminderResponse`); `DELETE /api/reminders/{reminder_id}` (cancels reminder; publishes `reminder.cancelled` event). Register in `backend/src/api/v1/router.py`
- [X] T049 [P] [US2] Add `ReminderCreate` (task_id nullable, task_instance_id nullable, reminder_type default=in_app, scheduled_for) and `ReminderResponse` schemas to `backend/src/schemas/task.py`. Add Dapr Jobs callback route `POST /job/reminder-trigger` to `backend/src/main.py` — this fires when a one-time reminder Dapr Job runs: checks task completion, publishes `reminder.scheduled` event to `reminders` topic if not suppressed
- [X] T050 [P] [US2] Update OpenAI agent tool definitions in `backend/src/agents/mcp/mcp_tools.py` — add `set_reminder` tool (task_id, scheduled_for ISO-8601 string); `cancel_reminder` tool (reminder_id). Agent must parse "tomorrow at 9 AM" to absolute ISO-8601 datetime using current date context

### Implementation: notification-service (US2)

- [X] T051 [US2] Create `services/notification-service/app/db.py` — SQLModel engine with session factory. Create `services/notification-service/app/models/notification.py` — `Notification` SQLModel table (id, user_id, task_id nullable, reminder_id nullable, title, body, status=unread, delivered_at nullable, created_at). Tables created on startup
- [X] T052 [US2] Create `services/notification-service/app/consumers/reminders.py` — FastAPI router at `POST /events/reminders`. Receives Dapr CloudEvent for `reminder.scheduled`. Calls `notifier.deliver_notification()`. Returns `{"status": "SUCCESS"}`. Register in `services/notification-service/app/main.py`
- [X] T053 [P] [US2] Create `services/notification-service/app/services/notifier.py` — `NotificationService` with: `deliver_notification(event: dict) -> None` (check if task already completed by calling backend's `GET /api/tasks/{task_id}` via Dapr Service Invocation `http://localhost:3500/v1.0/invoke/backend/method/api/tasks/{id}`; if completed → skip; else → insert Notification record with status=delivered; log delivery); `get_user_notifications(user_id: str) -> list[Notification]`
- [X] T054 [P] [US2] Create `services/notification-service/app/services/event_log.py` — `EventLogService` with `async check_and_register_idempotent(event_id: str, idempotency_key: str, event_type: str) -> bool` (returns True if already processed; inserts ProcessedEventLog if not). Import and use in `consumers/reminders.py`
- [X] T055 [P] [US2] Create `services/notification-service/Dockerfile` — identical pattern to recurring-service Dockerfile but CMD uses port 8002: `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]`
- [X] T056 [US2] Add notifications endpoint to `backend/src/api/v1/router.py` — `GET /api/notifications` (proxies to notification-service via Dapr Service Invocation to return unread notifications for current user). This connects the frontend to the notification store

**Checkpoint**: User Story 2 functional. Reminder created → event published → notification-service stores notification → delivered to user. Suppressed if task completed.

---

## Phase 6: User Story 4 — Search and Filter Tasks (Priority: P3)

**Goal**: Users filter tasks by priority, tag, status, due date, and keyword. Combined filters work in single query. Empty results return conversational response.

**Independent Test**: Seed 20 tasks with varied priority/tags/status. `GET /api/tasks?priority=High&tags=work&status=pending` returns only matching tasks. `GET /api/tasks?search=grocery` returns tasks with "grocery" in title/description. Empty result: `GET /api/tasks?priority=High&tags=nonexistent` → `{"tasks": [], "total": 0}`. Chat: "Show me high priority work tasks" → agent calls filtered GET and formats response.

### Implementation: Backend (US4)

- [X] T057 [P] [US4] Create Alembic migration `backend/alembic/versions/008_add_task_fts_index.py` — add PostgreSQL full-text search tsvector index on `tasks` table: `CREATE INDEX tasks_fts_idx ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')))`. Downgrade drops the index
- [X] T058 [US4] Update `backend/src/services/task_service.py` `list_tasks()` method to accept filter parameters: `status: str | None`, `priority: str | None`, `tags: list[str] | None`, `search: str | None`, `due_before: datetime | None`, `due_after: datetime | None`, `sort_by: str = "created_at"`, `sort_order: str = "desc"`. Implement: tags filter via JOIN on task_tags; search via `func.to_tsvector('english', Task.title + ' ' + Task.description).match(search_term)` using SQLAlchemy `func`; priority/status/due_date as WHERE clauses. Return `(tasks: list[Task], total: int)`
- [X] T059 [US4] Update `GET /api/tasks` endpoint in `backend/src/api/v1/tasks.py` to accept all filter query parameters from the API contract (`contracts/api.yaml`): `status`, `priority`, `tags` (multi-value), `search`, `sort_by`, `sort_order`, `due_before`, `due_after`, `page`, `page_size`. Return `TaskList` response with `tasks`, `total`, `page`, `page_size`. Return 200 with empty array (not 404) when no results match
- [X] T060 [P] [US4] Update OpenAI agent in `backend/src/agents/mcp/mcp_tools.py` — update `list_tasks` tool to include all filter parameters; add agent instruction: when filter returns empty result, respond conversationally ("No high-priority tasks found. Would you like to see all tasks instead?"). Add intent parsing for combined queries ("show me high-priority incomplete work tasks due this week")

### Implementation: Frontend (US4)

- [X] T061 [P] [US4] Update `frontend/components/dashboard/TaskStream.tsx` — add filter bar above task list with dropdowns for Status, Priority, and tag chip selector. Wire filter state to `GET /api/tasks` query parameters via `frontend/lib/api/tasks.ts`. Show "No tasks found" empty state with suggestion text when results are empty. Use existing `EmptyState` component from `frontend/components/dashboard/EmptyState.tsx`
- [X] T062 [P] [US4] Update `frontend/lib/api/tasks.ts` — extend `getTasks()` function to accept `TaskFilters` object (status, priority, tags array, search, sort_by, sort_order, due_before, due_after, page, page_size). Serialize tags array as repeated query params. Update `frontend/lib/api/types.ts` with `TaskFilters` type and `TaskList` response type (tasks array + total + page + page_size)

**Checkpoint**: User Story 4 functional. Multi-filter task queries return correct results. Chat understands filter intent and responds conversationally on empty results.

---

## Phase 7: User Story 5 — Deploy to Cloud Kubernetes (Priority: P1)

**Goal**: All 4 services deploy to AKS via Helm with cloud Kafka (Aiven), TLS, CI/CD pipeline, and Prometheus monitoring.

**Independent Test**: `helm upgrade --install backend ./helm/backend -f ./helm/backend/values-aks.yaml --set image.tag=main-test` → pod reaches Running; `curl https://api.yourdomain.com/health` returns 200; GitHub push to main triggers workflow in <10 min.

### Helm AKS Overrides (US5)

- [X] T063 [US5] Create `helm/backend/values-aks.yaml` — override: replicaCount=2, image.repository=`ghcr.io/<owner>/backend`, ingress.enabled=true + annotations (cert-manager.io/cluster-issuer: letsencrypt-prod, nginx.ingress.kubernetes.io/ssl-redirect: "true"), ingress.hosts and ingress.tls for `api.yourdomain.com`, resources.requests (cpu=500m, memory=512Mi), resources.limits (cpu=1000m, memory=1Gi), autoscaling.enabled=true (min=2, max=10, targetCPUUtilizationPercentage=70)
- [X] T064 [P] [US5] Create `helm/frontend/values-aks.yaml` — similar AKS overrides for frontend: replicaCount=2, ingress for `yourdomain.com`, resources (250m/512Mi req, 500m/1Gi limit), autoscaling (min=2, max=8, cpu=75%). Create `helm/recurring-service/values-aks.yaml` (replicaCount=1, resources 200m/512Mi req, 500m/512Mi limit, autoscaling min=1, max=3). Create `helm/notification-service/values-aks.yaml` (same as recurring-service)
- [X] T065 [US5] Add `helm/backend/templates/ingress.yaml` — Kubernetes Ingress resource (conditionally rendered `{{- if .Values.ingress.enabled }}`): apiVersion networking.k8s.io/v1, Kind Ingress, metadata.annotations from `.Values.ingress.annotations`, spec.ingressClassName=nginx, tls from `.Values.ingress.tls`, rules from `.Values.ingress.hosts`. Copy ingress template to `helm/frontend/templates/ingress.yaml`

### Monitoring (US5)

- [X] T066 [P] [US5] Create `helm/backend/templates/servicemonitor.yaml` — ServiceMonitor CRD (conditionally rendered `{{- if .Values.metrics.enabled }}`): selector matchLabels for backend service, endpoint port=metrics, interval=30s, path=/metrics, scheme=http. Add `metrics.enabled: true` to `helm/backend/values.yaml` and `values-aks.yaml`. Add `metrics` port (9090) to `helm/backend/templates/service.yaml`. Copy ServiceMonitor template to `helm/recurring-service/templates/servicemonitor.yaml` with appropriate port. Add Prometheus instrumentation to `services/recurring-service/app/main.py` (same pattern as backend T022)
- [X] T067 [P] [US5] Fill `k8s/keda-scaled-objects.yaml` with two ScaledObjects: for recurring-service (triggers: kafka consumer group `recurring-service-task-events-v1`, topic `task-events`, lagThreshold=500, activationLagThreshold=100, maxReplicaCount=3 — equal to partition count); for notification-service (consumer group `notification-service-reminders-v1`, topic `reminders`, lagThreshold=200, maxReplicaCount=2). Fill `k8s/cluster-issuer.yaml` with prod and staging ClusterIssuer objects (placeholder email field). Create `helm/monitoring/values.yaml` — kube-prometheus-stack overrides: prometheus.retention=15d, prometheus.serviceMonitorSelectorNilUsesHelmValues=false, grafana.persistence.enabled=true, grafana.persistence.size=10Gi
- [X] T068 [P] [US5] Create `dapr/components/cloud/pubsub-kafka.yaml` — copy from local, update: brokers=`kafka-xxxxx.a.aivencloud.com:9092`, authType=password, saslUsername and saslPassword via secretKeyRef to `kafka-credentials`, tlsEnabled=true, tlsSkipVerify=false. Ensure consumerGroup is templated per service (each service's Helm values sets `DAPR_CONSUMER_GROUP` env var; component YAML reads from that)

### CI/CD (US5)

- [X] T069 [US5] Create `.github/workflows/deploy-aks.yml` — GitHub Actions workflow: trigger on push to `main` with path filter (backend/**, frontend/**, services/**, helm/**, .github/workflows/**). Two jobs: (1) `build-and-push` with matrix strategy for 4 services (backend, frontend, recurring-service, notification-service), each with docker/setup-buildx-action, docker/login-action (GHCR), docker/metadata-action (tag: `main-${{ github.sha }}`), docker/build-push-action (push=true, cache-from/to GHA). (2) `deploy-helm` (needs: build-and-push) — azure/setup-kubectl, azure/setup-helm, configure kubeconfig from base64 secret, add Helm repos, create GHCR imagePullSecret via kubectl, then `helm upgrade --install` for all 4 services with `--set image.tag=main-${{ github.sha }}` and `--wait --timeout 5m`, followed by `kubectl rollout status` verification for each deployment
- [X] T070 [P] [US5] Add GitHub Actions secrets documentation to `specs/011-advanced-cloud-deploy/quickstart.md` — add section "GitHub Secrets Required" listing: `AZURE_CREDENTIALS` (service principal JSON from `az ad sp create-for-rbac`), `REGISTRY_PASSWORD` (GitHub PAT with write:packages scope), `KUBECONFIG` (base64-encoded AKS kubeconfig from `az aks get-credentials`). Note that `REGISTRY_USERNAME` is `${{ github.actor }}` (no separate secret needed)

### Secret Management (US5)

- [X] T071 [US5] Add gitleaks configuration `.gitleaks.toml` at repo root — baseline config to scan for hardcoded secrets on every PR. Document in `specs/011-advanced-cloud-deploy/quickstart.md` under "Secret Scanning" that gitleaks blocks PRs with detected secrets. Ensure `.env` files, `*.key`, `*-secret.yaml` containing actual values are in `.gitignore` (verify no secrets committed)

**Checkpoint**: User Story 5 functional. `helm upgrade --install` deploys all services to AKS. CI/CD pipeline builds + deploys on push to main. Prometheus scrapes `/metrics`. KEDA scales on Kafka lag.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Observability, error handling, real-time task updates, and end-to-end validation.

- [X] T072 [P] Add `GET /health` endpoint (if not already present) to `services/recurring-service/app/main.py` and `services/notification-service/app/main.py` returning `{"status": "healthy", "service": "<name>"}`. Add liveness/readiness probes to `helm/recurring-service/templates/deployment.yaml` and `helm/notification-service/templates/deployment.yaml` with `httpGet: {path: /health, port: 8001/8002}`, initialDelaySeconds=10, periodSeconds=30
- [X] T073 [P] Add `consumers/task_updates.py` to `services/notification-service/app/` — FastAPI router at `POST /events/task-updates` subscribing to `task-updates` topic. On `task.instance_created` events: log receipt for observability (Phase V: no UI push yet). On `task.status_changed` events: update task status in notification-service local cache if maintained. Return `{"status": "SUCCESS"}`
- [X] T074 [P] Add structured JSON logging to `backend/src/main.py` using Python `logging` module configured with JSON format (service_name, timestamp, level, message, trace_id from Dapr). Same pattern added to `services/recurring-service/app/main.py` and `services/notification-service/app/main.py`. Use request-id from `X-Request-ID` header for correlation
- [X] T075 [P] Add `POST /api/tasks/{task_id}/complete` shorthand endpoint to `backend/src/api/v1/tasks.py` — sets status=completed, updated_at=now(); publishes `task.status_changed` event to `task-updates` topic; publishes `task.updated` event to `task-events` topic. Also update existing `PATCH /api/tasks/{id}` to publish events on status changes
- [X] T076 Add `task-updates` SSE (Server-Sent Events) endpoint to `backend/src/api/v1/tasks.py` — `GET /api/tasks/stream` returns SSE stream that the frontend can subscribe to for real-time task list updates. Update `frontend/lib/api/tasks.ts` to connect to SSE stream and dispatch updates to `TasksContext`. Update `frontend/contexts/TasksContext.tsx` to handle incoming `task.instance_created` and `task.status_changed` events by updating local state
- [X] T077 [P] Update `backend/src/agents/core/agent.py` — ensure agent handles all edge cases from spec.md: invalid RRULE → ask for clarification (not silent failure); cancelled recurring task completion → notify user the series is cancelled; reminder for completed task → confirm task already done; empty search results → conversational "No results found. Would you like to see all tasks?"
- [X] T078 Validate `specs/011-advanced-cloud-deploy/quickstart.md` against actual implementation — update any commands that changed during implementation; verify all service names, ports, and Helm chart paths are correct; add any troubleshooting steps discovered during development

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; all T001–T007 parallelizable
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001–T007) — BLOCKS all user stories; T008–T022 mostly parallelizable within phase
- **Phase 3 (US1)**: Depends on Phase 2 complete — T023–T036 ordered within phase; T023/T024/T028 can parallel
- **Phase 4 (US3)**: Depends on Phase 2 complete — T037–T045 can run parallel with Phase 3
- **Phase 5 (US2)**: Depends on Phase 2 complete, and on T025/T031 (Jobs infrastructure from Phase 3)
- **Phase 6 (US4)**: Depends on Phase 4 complete (tags needed for tag filtering)
- **Phase 7 (US5)**: Can start CI/CD and Helm tasks (T063–T070) in parallel with Phase 3–6; final cloud validation requires all phases
- **Phase 8 (Polish)**: Depends on all user story phases (3–7)

### User Story Dependencies

| Story | Depends On | Can Run In Parallel With |
|-------|-----------|--------------------------|
| US1 — Recurring Tasks | Phase 2 | US3, US5 (CI/CD tasks) |
| US3 — Priority/Tags | Phase 2 | US1, US2, US5 |
| US2 — Reminders | Phase 2 + US1 (Jobs client) | US3, US4 |
| US4 — Search/Filter | Phase 2 + US3 (tags model) | US2, US5 |
| US5 — Cloud Deploy | Phase 1 (Helm tasks), Phase 2 (Dapr cloud) | US1, US2, US3 |

### Critical Within-Story Order

- **US1**: T023/T024 models → T025 rrule_service → T026 recurring_task_service → T027 API → T028 schemas → T029 agent → T030–T036 recurring-service (T030→T031→T032→T033→T034)
- **US3**: T037 models → T038 tag_service → T039 task_service → T040 schemas → T041 API → T042–T045 agent/frontend (parallel)
- **US2**: T046 model → T047 service → T048 API → T049 schemas → T051–T055 notification-service → T056 notifications endpoint
- **US4**: T057 migration → T058 service → T059 API → T060–T062 agent/frontend (parallel)
- **US5**: T063–T065 (Helm) parallel → T066–T068 (monitoring) parallel → T069 CI/CD → T070–T071 (docs/secrets)

---

## Parallel Execution Examples

### Phase 2 (Foundational) — Run in 3 parallel tracks:

```
Track A: T008 (pubsub YAML) → T011 (subscriptions) → T012 (dapr_pubsub.py)
Track B: T009 (statestore) + T010 (secretstore) → T013 (backend Dapr annotations) → T015 (RBAC)
Track C: T016 (frontend/RS/NS Dapr annotations) + T017 (RBAC for new services) + T018-T021 (migrations) + T022 (Prometheus)
```

### Phase 3 (US1) — Run backend and recurring-service in parallel after T025:

```
Track A: T023 → T024 → T025 → T026 → T027 → T029
Track B: T028 (schemas, parallel with T026)
Track C: T030 → T031 → T032 → T033 → T034 (after T025)
Parallel solo: T035 (db.py), T036 (Dockerfile)
```

### Phase 7 (US5) — All Helm and cloud tasks parallelizable:

```
T063 + T064 + T065 + T066 + T067 + T068 [fully parallel]
T069 (CI/CD) [parallel with above]
T070 + T071 [parallel]
```

---

## Implementation Strategy

### MVP: User Story 1 Only (Proof-of-Architecture)

1. Complete Phase 1: Setup (T001–T007) — ~1 hour
2. Complete Phase 2: Foundational (T008–T022) — ~3 hours
3. Complete Phase 3: US1 Recurring Tasks (T023–T036) — ~4 hours
4. **STOP & VALIDATE**: Deploy to Minikube; verify full recurring task flow end-to-end
5. Demo: chat creates recurring task → Dapr Job registered → TaskInstance created on schedule → idempotency verified

### Incremental Delivery

1. MVP: US1 → validates EDA + Dapr + recurring service ✅
2. Add US3 (Priority/Tags) → richer task data, small change ✅
3. Add US2 (Reminders) → reuses US1 Jobs infrastructure ✅
4. Add US4 (Search/Filter) → completes the task management surface ✅
5. US5 (Cloud Deploy) → production-grade validation ✅

### Parallel Team Strategy

With 2 developers after Phase 2 completes:
- **Dev A**: US1 backend (T023–T029) → US2 (T046–T050)
- **Dev B**: US3 all (T037–T045) → US4 (T057–T062)
- **Both**: US5 cloud deployment (T063–T071) together

---

## Notes

- `[P]` = task touches different files from current pending tasks; safe to run concurrently
- `[US#]` label maps every task to its user story for traceability (SDD Principle XVIII)
- Each Checkpoint means the story is independently testable — STOP and validate before moving to next story
- All Dapr HTTP API calls use `DAPR_HTTP_PORT` env var (default 3500); sidecar handles routing
- Dapr Jobs API endpoint: `/v1.0-alpha1/jobs/{name}` — alpha API, pin Dapr to current version
- Never hardcode secrets; always reference Kubernetes Secrets via Dapr Secrets Store or env var injection from `secretKeyRef`
- Consumer group names MUST follow `<service>-<domain>-v1` format; changing them resets Kafka offsets
- `maxReplicaCount` in KEDA ScaledObjects MUST NOT exceed partition count (3 for task-events, 2 for reminders/task-updates)
