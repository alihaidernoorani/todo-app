# Implementation Plan: Phase V Advanced Cloud-Native AI Deployment

**Branch**: `011-advanced-cloud-deploy` | **Date**: 2026-02-21 | **Spec**: `specs/011-advanced-cloud-deploy/spec.md`
**Input**: Feature specification from `/specs/011-advanced-cloud-deploy/spec.md`

---

## Summary

Phase V transforms the Phase IV AI Todo Chatbot into a production-ready cloud-native application by layering four capabilities:

1. **Advanced task features**: recurring tasks (RFC 5545 RRULE), one-time reminders, priorities, tags, and full-text search/filter
2. **Event-driven architecture**: All task mutations publish to Apache Kafka via Dapr PubSub; services communicate exclusively via events (no direct HTTP for business logic)
3. **Full Dapr building blocks**: PubSub (Kafka), State Store (PostgreSQL v2 for sessions), Jobs API (recurring cron via HTTP API), Secrets Store (Kubernetes Secrets), Service Invocation
4. **Dual deployment**: Minikube (Redpanda Kafka + Dapr) for local dev; AKS (Aiven Kafka + NGINX Ingress + cert-manager + GitHub Actions CI/CD + kube-prometheus-stack) for cloud

---

## Technical Context

**Language/Version**: Python 3.11 (backend, recurring-service, notification-service), TypeScript/Node.js 20 (frontend — Next.js App Router)
**Primary Dependencies**: FastAPI, SQLModel, Alembic, python-dateutil, Dapr HTTP API (httpx), prometheus-fastapi-instrumentator, OpenAI Agents SDK; Next.js 14, TailwindCSS
**Storage**: PostgreSQL 15 (application data via SQLModel direct connection + Dapr State Store for session KV); Dapr Scheduler etcd (job state)
**Testing**: pytest + pytest-asyncio + httpx (backend); Jest + React Testing Library (frontend); pytest for recurring-service and notification-service
**Target Platform**: Kubernetes (Minikube local, AKS cloud); Linux containers (amd64)
**Project Type**: Cloud-native microservices (4 services + 3 Dapr component layers + Kafka)
**Performance Goals**: API p95 latency <200ms; Kafka consumer lag <500 messages; task creation end-to-end <1s; reminder delivery within 30s of scheduled time
**Constraints**: RRULE must parse with python-dateutil; Dapr Jobs API is alpha (v1.0-alpha1) — pinned; maxReplicas ≤ Kafka partition count; zero hardcoded secrets; all code must have a Task ID (SDD enforcement)
**Scale/Scope**: Dev/demo scale: ~100 concurrent users, ~100 events/min peak; single-tenant per namespace

---

## Constitution Check

*All gates must pass. Re-check after implementation.*

| Principle | Gate | Status |
|-----------|------|--------|
| I — SDD Traceability | Every code change references a Task ID from tasks.md | ✅ Plan creates Task IDs first |
| II — Clean Architecture | 4 services, no circular deps; events via Kafka only | ✅ Enforced by EDA topology |
| XVIII — SDD Enforcement | spec.md → plan.md → tasks.md → code; no code without task | ✅ This plan gates tasks.md |
| XIX — Event-Driven Architecture | All task mutations publish to Kafka topics | ✅ EDA topology in contracts/events.md |
| XX — Dapr Building Blocks | 5 building blocks defined and componentized | ✅ Components in dapr/components/ |
| XXI — Cloud Kubernetes | Minikube local + AKS cloud dual deployment | ✅ Helm chart per service, values-aks.yaml |
| XXII — Secrets Hardening | No hardcoded secrets; all via Kubernetes Secrets + Dapr API | ✅ Enforced in Helm values |
| XXIII — Agent Compliance | OpenAI Agents SDK remains the AI orchestration layer | ✅ Chat API proxies to SDK |
| VI — Testing | Unit + integration + contract tests per service | ⚠️ Contract tests (Pact) deferred to post-MVP |

---

## Project Structure

### Documentation (this feature)

```text
specs/011-advanced-cloud-deploy/
├── plan.md              ← This file (/sp.plan output)
├── spec.md              ← Feature specification
├── research.md          ← Phase 0 research (Dapr, Kafka, AKS, recurring tasks)
├── data-model.md        ← Phase 1 entity definitions + Kafka schemas
├── quickstart.md        ← Phase 1 local + cloud setup guide
├── contracts/
│   ├── api.yaml         ← OpenAPI 3.1 REST contract
│   └── events.md        ← Kafka event schemas (3 topics, 9 event types)
├── checklists/
│   └── requirements.md  ← Spec quality checklist
└── tasks.md             ← Phase 2 output (/sp.tasks — NOT created by /sp.plan)
```

### Source Code (repository root — Phase_V/)

```text
Phase_V/
├── backend/                          # FastAPI — Chat API + Task REST API
│   ├── app/
│   │   ├── main.py                   # FastAPI app, Prometheus instrumentation
│   │   ├── api/
│   │   │   ├── tasks.py              # Task CRUD endpoints (publish Kafka events)
│   │   │   ├── recurring.py          # Recurring task endpoints + Dapr Jobs
│   │   │   ├── reminders.py          # Reminder endpoints
│   │   │   ├── tags.py               # Tag CRUD
│   │   │   └── chat.py               # Chat endpoint → OpenAI Agents SDK
│   │   ├── models/
│   │   │   ├── task.py               # Task, Tag, TaskTag SQLModel tables
│   │   │   ├── recurring.py          # RecurringTask, TaskInstance SQLModel tables
│   │   │   ├── reminder.py           # Reminder SQLModel table
│   │   │   └── event_log.py          # ProcessedEventLog SQLModel table
│   │   ├── services/
│   │   │   ├── dapr_pubsub.py        # Publish events via Dapr HTTP API
│   │   │   ├── dapr_jobs.py          # Create/delete Dapr Jobs via HTTP API (httpx)
│   │   │   ├── dapr_secrets.py       # Retrieve secrets via Dapr HTTP API
│   │   │   ├── dapr_state.py         # Session state via Dapr State Store
│   │   │   ├── rrule_service.py      # RRULE parsing, next-occurrence compute (dateutil)
│   │   │   └── agent_service.py      # OpenAI Agents SDK integration
│   │   └── db.py                     # SQLModel engine + session factory
│   ├── alembic/                      # Database migrations
│   │   ├── versions/
│   │   │   ├── 001_base_tables.py    # Task, Tag, TaskTag tables
│   │   │   ├── 002_recurring.py      # RecurringTask, TaskInstance tables
│   │   │   ├── 003_reminders.py      # Reminder table
│   │   │   └── 004_event_log.py      # ProcessedEventLog table
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_rrule_service.py # RRULE parsing + timezone edge cases
│   │   │   └── test_dapr_jobs.py     # Job create/delete mocked
│   │   └── integration/
│   │       ├── test_tasks_api.py     # Task CRUD + event publishing
│   │       └── test_recurring_api.py # Recurring task creation + Dapr Jobs
│   ├── Dockerfile                    # Multi-stage: builder + runtime
│   └── requirements.txt
│
├── frontend/                         # Next.js App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Main chat + task view
│   │   ├── tasks/
│   │   │   ├── page.tsx              # Task list with search/filter/sort
│   │   │   ├── [id]/page.tsx         # Task detail + edit
│   │   │   └── recurring/page.tsx    # Recurring task management
│   │   └── reminders/page.tsx        # Reminder management
│   ├── components/
│   │   ├── TaskList.tsx              # Filterable, sortable task list
│   │   ├── TaskForm.tsx              # Create/edit task (with priority, tags, due date)
│   │   ├── RecurringTaskForm.tsx     # Recurring task form (RRULE builder)
│   │   ├── ReminderForm.tsx          # Reminder scheduler
│   │   └── TagManager.tsx            # Tag CRUD
│   ├── Dockerfile
│   └── package.json
│
├── services/
│   ├── recurring-service/            # Python — Kafka consumer + Dapr Jobs callback handler
│   │   ├── app/
│   │   │   ├── main.py               # FastAPI app (exposes /events/* + /job/* routes)
│   │   │   ├── consumers/
│   │   │   │   └── task_events.py    # Subscribe to task-events (recurring.scheduled, recurring.cancelled)
│   │   │   ├── handlers/
│   │   │   │   └── job_callback.py   # POST /job/recurring-task-trigger
│   │   │   └── services/
│   │   │       ├── instance_creator.py    # Create TaskInstance + idempotency check
│   │   │       ├── dapr_jobs_client.py   # Register/cancel Dapr Jobs
│   │   │       └── publisher.py          # Publish task.instance_created to task-updates
│   │   ├── tests/
│   │   │   ├── test_instance_creator.py  # Idempotency + state machine
│   │   │   └── test_job_callback.py      # Job callback handler
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── notification-service/         # Python — Kafka consumer + reminder delivery
│       ├── app/
│       │   ├── main.py               # FastAPI app (exposes /events/* routes)
│       │   ├── consumers/
│       │   │   ├── reminders.py      # Subscribe to reminders topic
│       │   │   └── task_updates.py   # Subscribe to task-updates (real-time UI notifications)
│       │   └── services/
│       │       ├── notifier.py       # In-app notification delivery (Phase V: console log / SSE stub)
│       │       └── event_log.py      # ProcessedEventLog for idempotency
│       ├── tests/
│       │   └── test_notifier.py
│       ├── Dockerfile
│       └── requirements.txt
│
├── dapr/
│   └── components/
│       ├── local/                    # Minikube Dapr components
│       │   ├── pubsub-kafka.yaml     # Redpanda broker, no auth
│       │   ├── statestore-postgres.yaml
│       │   └── secretstore-kubernetes.yaml
│       └── cloud/                    # AKS Dapr components
│           ├── pubsub-kafka.yaml     # Aiven broker, SASL+TLS
│           ├── statestore-postgres.yaml
│           └── secretstore-kubernetes.yaml
│
├── helm/
│   ├── backend/
│   │   ├── Chart.yaml
│   │   ├── values.yaml               # Minikube defaults
│   │   ├── values-aks.yaml           # AKS overrides
│   │   └── templates/
│   │       ├── deployment.yaml       # With Dapr annotations
│   │       ├── service.yaml
│   │       ├── ingress.yaml          # AKS-only
│   │       ├── servicemonitor.yaml   # Prometheus ServiceMonitor
│   │       └── rbac.yaml             # ServiceAccount + Role + RoleBinding
│   ├── frontend/
│   ├── recurring-service/
│   ├── notification-service/
│   └── monitoring/
│       └── values.yaml               # kube-prometheus-stack overrides
│
├── k8s/
│   ├── cluster-issuer.yaml           # cert-manager ClusterIssuer (prod + staging)
│   ├── keda-scaled-objects.yaml      # KEDA ScaledObjects for recurring/notification services
│   └── namespace-limits.yaml         # LimitRange + ResourceQuota
│
├── .github/
│   └── workflows/
│       └── deploy-aks.yml            # Build → GHCR → helm upgrade → rollout verify
│
└── specs/
    └── 011-advanced-cloud-deploy/    # This spec directory
```

**Structure Decision**: Cloud-native multi-service layout. Backend and frontend follow existing Phase IV patterns. Two new service directories (`recurring-service`, `notification-service`) use identical FastAPI skeleton. Dapr components split by environment (local/cloud) for clean separation. Helm chart per service with shared values-aks.yaml override pattern.

---

## Complexity Tracking

| Apparent Violation | Why Needed | Simpler Alternative Rejected Because |
|--------------------|-----------|------------------------------------|
| 4 services (backend, frontend, recurring, notification) | Constitution Principle XIX mandates event-driven microservices; each service has a distinct Kafka consumer group | Monolith cannot scale Kafka consumers independently; KEDA requires separate deployments per consumer group |
| Dapr Jobs HTTP API (not SDK) | Python Dapr SDK v1.14 has no Jobs API support | SDK limitation documented in research.md; httpx HTTP calls are the only current option |
| Dual Dapr component directories (local/cloud) | Aiven requires SASL+TLS; Redpanda requires no auth; same component name resolves differently | ConfigMaps or env-var injection would hide the difference; explicit files are readable and auditable |

---

## Architecture Decisions

### AD-1: Kafka Platform Selection

- **Local**: Redpanda (Helm) — lighter than Strimzi, no ZooKeeper, 40% faster startup
- **Cloud**: Aiven for Kafka — predictable pricing, all egress costs included, standard Kafka protocol
- **Rejected**: Confluent Cloud (2-4x cost at small scale), Strimzi locally (extra 0.5GB RAM)

### AD-2: Dapr Jobs API via HTTP (not Python SDK)

- **Decision**: Use `httpx.AsyncClient` to call Dapr's HTTP Jobs API (`/v1.0-alpha1/jobs/`)
- **Rationale**: Python Dapr SDK v1.14 does not expose Jobs API; only Go, .NET, Java SDKs support it natively
- **Risk**: Alpha API may change between Dapr releases; pin Dapr version in Helm chart

### AD-3: State Machine for RecurringTask

- **States**: `pending → active ↔ paused → completed | any → cancelled`
- **Decision**: Status column with DB-level CHECK constraint; transitions validated in service layer
- **Rejected**: Separate state-machine library (overcomplicated for 5 states)

### AD-4: Idempotency via ProcessedEventLog Table

- **Decision**: PostgreSQL table with `UNIQUE(idempotency_key)` constraint; key = `sha256("{user_id}:{task_id}:{occurrence_time}")[:16]`
- **Rejected**: Redis deduplication (additional infrastructure dependency); Kafka exactly-once (requires transactions, increases complexity)

### AD-5: KEDA for Kafka Lag-Based HPA

- **Decision**: KEDA `ScaledObject` per consumer service; `lagThreshold=500`, `maxReplicaCount` ≤ partition count
- **Rejected**: Standard Kubernetes HPA (CPU-based scaling doesn't correlate with Kafka lag)

---

## Implementation Phases

### Phase 0: Research ✅ COMPLETE

- [x] Dapr building blocks (Pub/Sub, State Store, Jobs, Secrets, Service Invocation)
- [x] Kafka platform selection (Redpanda vs Strimzi, Aiven vs Confluent)
- [x] Topic configuration (partitions, retention, consumer group naming)
- [x] Recurring task logic (RRULE, timezone, Dapr Jobs cron format)
- [x] Idempotency pattern (ProcessedEventLog, idempotency key formula)
- [x] AKS deployment (NGINX Ingress, cert-manager, Let's Encrypt)
- [x] CI/CD (GitHub Actions matrix build, GHCR, helm upgrade)
- [x] Monitoring (kube-prometheus-stack, ServiceMonitor, KEDA)

**Output**: `research.md`

### Phase 1: Design ✅ COMPLETE

- [x] Data model (`data-model.md`) — 6 entities + Kafka event schemas
- [x] API contract (`contracts/api.yaml`) — OpenAPI 3.1, 20+ endpoints
- [x] Event contract (`contracts/events.md`) — 3 topics, 9 event types
- [x] Quickstart (`quickstart.md`) — Local + AKS setup guide

**Output**: `data-model.md`, `contracts/`, `quickstart.md`

### Phase 2: Task Generation (NEXT STEP)

Run `/sp.tasks` to generate `tasks.md` from this plan. Tasks will be ordered by dependency and grouped by implementation layer.

**Expected task groups**:
1. Database migrations (Alembic) — Task IDs T-001–T-004
2. Backend models + services — T-005–T-015
3. Backend API endpoints — T-016–T-025
4. Dapr component manifests (local + cloud) — T-026–T-030
5. recurring-service implementation — T-031–T-040
6. notification-service implementation — T-041–T-048
7. Frontend components + pages — T-049–T-060
8. Helm charts (new services + AKS values) — T-061–T-068
9. GitHub Actions CI/CD workflow — T-069–T-072
10. Monitoring (ServiceMonitor, KEDA ScaledObjects) — T-073–T-078
11. End-to-end testing — T-079–T-085

**Output**: `tasks.md`

---

## Key Technical Decisions (Summary)

| Component | Decision | Key Config |
|-----------|----------|-----------|
| Kafka (local) | Redpanda Helm | `resources.limits.cpu=2, memory=2Gi` |
| Kafka (cloud) | Aiven | SASL password + TLS via K8s Secret |
| Topic: task-events | 3 partitions, 7d retention | `min.insync.replicas=2` on cloud |
| Topic: reminders | 2 partitions, 24h retention | |
| Topic: task-updates | 2 partitions, 1h retention | |
| Consumer groups | `<service>-<domain>-v1` format | Manual offset commit |
| Dapr Pub/Sub | `pubsub.kafka` v1 | `consumerGroup` per service |
| Dapr State Store | `state.postgresql` v2 | `cleanupInterval=1h`, `sslmode=require` on cloud |
| Dapr Jobs | HTTP API `/v1.0-alpha1/jobs/` via httpx | 6-field cron; callback at `POST /job/{name}` |
| Dapr Secrets | `secretstores.kubernetes` v1 | RBAC: ServiceAccount + Role + RoleBinding |
| RRULE parsing | `python-dateutil.rrulestr()` | Store RFC 5545 string in DB |
| Timezone | `zoneinfo` stdlib | Store IANA zone name, never offset |
| Idempotency | `ProcessedEventLog` table | `UNIQUE(idempotency_key)`, 30d TTL |
| Ingress (AKS) | NGINX Ingress + cert-manager | `letsencrypt-prod` ClusterIssuer |
| Registry | GHCR | `ghcr.io/<owner>/<service>:main-<sha>` |
| CI/CD | GitHub Actions matrix build | 4 services in parallel; helm upgrade |
| Monitoring | kube-prometheus-stack + KEDA | ServiceMonitor + `lagThreshold=500` |
| HPA | KEDA ScaledObject | `maxReplicaCount` ≤ partition count |
| Resources: frontend | 250m/500m CPU, 256Mi/512Mi memory | min 2 replicas |
| Resources: backend | 500m/1000m CPU, 512Mi/1Gi memory | min 2 replicas |
| Resources: *-service | 200m/500m CPU, 256Mi/512Mi memory | min 1 replica, max 3 |

---

## Acceptance Criteria

From `spec.md` (SC-001–SC-010):

- [ ] **SC-001**: User creates recurring task "Team sync every Friday 2 PM" → TaskInstance created at each Friday 14:00 (±1 min) → `task-events` topic receives `recurring.scheduled` event
- [ ] **SC-002**: User sets reminder 15 min before a task due date → `reminders` topic receives `reminder.scheduled` event → notification-service delivers in-app alert within 30s
- [ ] **SC-003**: Task created with priority=High and tag "work" → appears at top of filtered task list (priority sort) → tag filter shows only "work" tasks
- [ ] **SC-004**: User searches "grocery" → only tasks containing "grocery" in title or description returned; case-insensitive
- [ ] **SC-005**: All 4 services deploy to Minikube via Helm with Dapr sidecars injected; `dapr components -k` shows all 3 components
- [ ] **SC-006**: GitHub Actions pipeline builds 4 images, pushes to GHCR, deploys to AKS with `helm upgrade --install`; total time <10 min
- [ ] **SC-007**: Prometheus scrapes `/metrics` on backend and recurring-service; Grafana dashboard shows `fastapi_requests_total`
- [ ] **SC-008**: KEDA scales recurring-service from 1→3 replicas when `task-events` consumer lag exceeds 500; scales back after lag clears
- [ ] **SC-009**: Duplicate Kafka event (same `event_id`) → `ProcessedEventLog` returns cached result; no duplicate TaskInstance created
- [ ] **SC-010**: All secrets (OpenAI key, DB password, Kafka credentials) retrieved via Dapr Secrets API; zero hardcoded values in source code or Docker images

---

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Dapr Jobs API breaks on v1.15+ upgrade | Medium | High | Pin Dapr version in Helm; monitor release notes; abstract via `dapr_jobs_client.py` service |
| Kafka consumer lag causes task instance backlog | Low | Medium | KEDA scales consumers; idempotency prevents duplicates on retry |
| RRULE timezone edge case (DST transition at exact occurrence time) | Low | Medium | `zoneinfo` handles DST correctly; add unit test for DST transition dates |
| AKS NGINX Ingress retirement (March 2026) | High | Low (Phase V) | NGINX Ingress still works post-retirement (no forced deletion); plan Gateway API migration for Phase VI |
| Dapr sidecar memory pressure on Minikube | Medium | Medium | Resource limits set on sidecar (100m/128Mi req, 500m/512Mi limit); monitor with `kubectl top pods` |

---

## Follow-ups (Post-Phase V)

1. **Secret rotation**: Implement External Secrets Operator or manual rotation procedure (current: manual Kubernetes secret update)
2. **Gateway API migration**: Replace NGINX Ingress with AKS Gateway API (Kubernetes standard post-2026)
3. **Python Dapr Jobs SDK**: Migrate from HTTP API to native SDK when Python SDK adds Jobs support (Dapr v1.15+)
4. **Multi-tenant isolation**: Add Kafka topic-level ACLs per user segment when user base grows beyond single-tenant
5. **Contract tests**: Add Pact consumer-driven contract tests between backend and recurring-service
