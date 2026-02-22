---
id: "0004"
title: implement-011-advanced-cloud-deploy
stage: green
date: 2026-02-22
surface: agent
model: claude-sonnet-4-6
feature: 011-advanced-cloud-deploy
branch: 011-advanced-cloud-deploy
user: alihaidernoorani
command: /sp.implement Implement the tasks for 011-advanced-cloud-deploy
labels: ["implementation","dapr","kafka","kubernetes","helm","aks","recurring-tasks","notifications","sse","ci-cd","prometheus","keda","agent"]
links:
  spec: specs/011-advanced-cloud-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - services/recurring-service/app/main.py
  - services/recurring-service/app/consumers/task_events.py
  - services/recurring-service/app/handlers/job_callback.py
  - services/recurring-service/app/services/dapr_jobs_client.py
  - services/recurring-service/app/services/instance_creator.py
  - services/recurring-service/app/services/publisher.py
  - services/recurring-service/app/db.py
  - services/recurring-service/Dockerfile
  - services/notification-service/app/main.py
  - services/notification-service/app/consumers/reminders.py
  - services/notification-service/app/consumers/task_updates.py
  - services/notification-service/app/services/notifier.py
  - services/notification-service/app/services/event_log.py
  - services/notification-service/app/db.py
  - services/notification-service/Dockerfile
  - dapr/components/local/pubsub-kafka.yaml
  - dapr/components/cloud/pubsub-kafka.yaml
  - dapr/components/local/statestore-postgres.yaml
  - dapr/components/cloud/statestore-postgres.yaml
  - dapr/components/local/secretstore-kubernetes.yaml
  - dapr/components/cloud/secretstore-kubernetes.yaml
  - dapr/subscriptions/recurring-service-subscriptions.yaml
  - dapr/subscriptions/notification-service-subscriptions.yaml
  - backend/src/services/dapr_pubsub.py
  - backend/src/services/dapr_jobs.py
  - backend/src/services/dapr_secrets.py
  - backend/src/services/rrule_service.py
  - backend/src/services/recurring_task_service.py
  - backend/src/services/tag_service.py
  - backend/src/services/reminder_service.py
  - backend/src/services/task_service.py
  - backend/src/models/recurring.py
  - backend/src/models/event_log.py
  - backend/src/models/tag.py
  - backend/src/models/reminder.py
  - backend/src/models/__init__.py
  - backend/src/api/v1/recurring.py
  - backend/src/api/v1/tags.py
  - backend/src/api/v1/reminders.py
  - backend/src/api/v1/notifications.py
  - backend/src/api/v1/tasks.py
  - backend/src/api/v1/router.py
  - backend/src/schemas/task.py
  - backend/src/agents/mcp/mcp_tools.py
  - backend/src/agents/core/agent.py
  - backend/src/agents/config/agent_config.py
  - backend/src/main.py
  - backend/alembic/versions/004_add_tags_tables.py
  - backend/alembic/versions/005_add_recurring_task_tables.py
  - backend/alembic/versions/006_add_reminders_table.py
  - backend/alembic/versions/007_add_event_log_table.py
  - backend/alembic/versions/008_add_task_fts_index.py
  - helm/backend/templates/deployment.yaml
  - helm/backend/templates/service.yaml
  - helm/backend/templates/ingress.yaml
  - helm/backend/templates/rbac.yaml
  - helm/backend/templates/servicemonitor.yaml
  - helm/backend/values.yaml
  - helm/backend/values-aks.yaml
  - helm/frontend/templates/deployment.yaml
  - helm/frontend/templates/ingress.yaml
  - helm/frontend/values-aks.yaml
  - helm/recurring-service/Chart.yaml
  - helm/recurring-service/values.yaml
  - helm/recurring-service/values-aks.yaml
  - helm/recurring-service/templates/deployment.yaml
  - helm/recurring-service/templates/service.yaml
  - helm/recurring-service/templates/rbac.yaml
  - helm/recurring-service/templates/servicemonitor.yaml
  - helm/notification-service/Chart.yaml
  - helm/notification-service/values.yaml
  - helm/notification-service/values-aks.yaml
  - helm/notification-service/templates/deployment.yaml
  - helm/notification-service/templates/service.yaml
  - helm/notification-service/templates/rbac.yaml
  - helm/monitoring/values.yaml
  - k8s/cluster-issuer.yaml
  - k8s/keda-scaled-objects.yaml
  - k8s/namespace-limits.yaml
  - .github/workflows/deploy-aks.yml
  - .gitleaks.toml
  - frontend/lib/api/tasks.ts
  - frontend/lib/api/types.ts
  - frontend/components/dashboard/TaskStream.tsx
  - specs/011-advanced-cloud-deploy/tasks.md
  - specs/011-advanced-cloud-deploy/quickstart.md
tests:
  - "No automated tests written (infrastructure/integration tasks)"
  - "Manual: helm upgrade --install backend ./helm/backend -f ./helm/backend/values-aks.yaml"
  - "Manual: kubectl rollout status deployment/backend"
  - "Manual: curl https://api.yourdomain.com/health"
  - "Manual: POST /api/{user_id}/tasks/recurring with RRULE to test recurring task flow"
---

## Prompt

Implement the tasks for 011-advanced-cloud-deploy

(Continued from previous session — context compacted. User constraint: "Keep all working in Phase_V directory. There you will also find the specs.")

## Response snapshot

Implemented all 78 tasks across 8 phases of the Phase V Advanced Cloud-Native AI Deployment feature. The implementation adds:

**Phase 1–2 (Setup + Foundational):** Two new microservices (`recurring-service` port 8001, `notification-service` port 8002), Dapr component YAMLs for local (Redpanda) and cloud (Aiven Kafka) deployments, Alembic migrations 004–008 (tags, recurring tasks, reminders, event logs, FTS index), Prometheus instrumentation, and Helm chart updates with Dapr sidecar annotations and RBAC.

**Phase 3 (US1 — Recurring Tasks):** Backend models (`RecurringTask`, `TaskInstance`, `ProcessedEventLog`), `RRuleService` (RFC 5545 RRULE → 6-field Dapr cron), `RecurringTaskService`, 5-endpoint recurring API, `recurring-service` Kafka consumer + Dapr Jobs callback with idempotency via SHA-256 key.

**Phase 4 (US3 — Priority/Tags):** `Tag`/`TaskTag` models, `TagService` (normalize + upsert), tags endpoint, task_service extended with tag joining.

**Phase 5 (US2 — Reminders):** `Reminder` model, `ReminderService` (Dapr Jobs one-shot), reminders API, `notification-service` consumers for `reminders` and `task-updates` topics, `NotificationService` with task-completion suppression via Dapr Service Invocation.

**Phase 6 (US4 — Search/Filter):** task_service `list_tasks()` extended with status/priority/tags/search/sort/pagination, GIN FTS index migration, `GET /tasks` endpoint with all query params, frontend `listTasks()` accepting `TaskFilters`, `TaskStream.tsx` filter bar with Status/Priority dropdowns and empty-state handling.

**Phase 7 (US5 — Cloud Deploy):** `values-aks.yaml` for all 4 services, NGINX Ingress templates, ServiceMonitor CRDs for Prometheus, KEDA ScaledObjects, `helm/monitoring/values.yaml`, `.github/workflows/deploy-aks.yml` (matrix build → GHCR → `helm upgrade --install` → rollout verify), `.gitleaks.toml`, quickstart.md updated with GitHub Secrets and Secret Scanning sections.

**Phase 8 (Polish):** Structured JSON logging to all 3 services, `POST /api/{user_id}/tasks/{id}/complete` with event publishing (`task.status_changed` + `task.updated`), SSE endpoint `GET /api/{user_id}/tasks/stream`, agent extended with `add_recurring_task`/`set_reminder`/`cancel_reminder` tools and edge-case instructions (invalid RRULE → clarify, empty results → conversational, cancelled series → notify, completed task reminder → skip).

All 78 tasks marked `[X]` in `specs/011-advanced-cloud-deploy/tasks.md`.

## Outcome

- ✅ Impact: All 5 user stories implemented — recurring tasks (US1), reminders (US2), priority/tags (US3), search/filter (US4), AKS cloud deploy (US5). Full Dapr + Kafka event-driven architecture in place.
- 🧪 Tests: No unit tests written (infrastructure feature); validate end-to-end on Minikube per quickstart.md
- 📁 Files: 80+ files created or modified across backend, services, helm, dapr, k8s, frontend, .github, specs
- 🔁 Next prompts: Deploy to Minikube for local validation; substitute real AKS cluster + Aiven credentials for cloud deploy; run `alembic upgrade head` to apply migrations 004–008
- 🧠 Reflection: Dapr Jobs API alpha endpoint required httpx direct calls (Python SDK doesn't expose it). Consumer group names follow `<service>-<domain>-v1` format — changing them resets Kafka offsets. KEDA maxReplicaCount must not exceed partition count.

## Evaluation notes (flywheel)

- Failure modes observed: None — all tasks implemented successfully; previous session context compacted mid-implementation, resumed cleanly
- Graders run and results (PASS/FAIL): None automated
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add unit tests for RRuleService and InstanceCreator idempotency logic
