---
id: "0002"
title: Phase V Advanced Cloud Deploy Plan
stage: plan
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 011-advanced-cloud-deploy
branch: 011-advanced-cloud-deploy
user: alihaidernoorani
command: /sp.plan
labels: ["plan","dapr","kafka","kubernetes","aks","recurring-tasks","event-driven","ci-cd","monitoring"]
links:
  spec: specs/011-advanced-cloud-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-advanced-cloud-deploy/research.md
  - specs/011-advanced-cloud-deploy/data-model.md
  - specs/011-advanced-cloud-deploy/contracts/api.yaml
  - specs/011-advanced-cloud-deploy/contracts/events.md
  - specs/011-advanced-cloud-deploy/quickstart.md
  - specs/011-advanced-cloud-deploy/plan.md
tests:
  - "N/A — plan phase; tests generated in /sp.tasks"
---

## Prompt

/sp.plan

Part A — Advanced feature logic + EDA + Dapr
1. Recurring tasks: RFC 5545 RRULE stored as string; python-dateutil for parsing; Dapr Jobs API (6-field cron via HTTP API) for scheduling; zoneinfo for DST-safe timezone handling
2. One-time reminders: Reminder table linked to Task or TaskInstance; reminder.scheduled event published to reminders topic; notification-service consumes and delivers in-app
3. Priorities + tags: Task.priority enum (High/Medium/Low); Tag + TaskTag M:N junction; filtering + sorting on priority and tags
4. Full-text search: PostgreSQL tsvector on title+description; keyword search via /api/tasks?search=
5. Event-driven: All task mutations publish to Kafka via Dapr PubSub; recurring-service and notification-service consume via Dapr subscriptions

Part B — Local Minikube deployment
1. Redpanda Helm chart (no ZooKeeper, 40% lighter than Strimzi)
2. Dapr initialized on Minikube cluster (dapr init -k)
3. 3 topics: task-events (3 partitions, 7d), reminders (2 partitions, 24h), task-updates (2 partitions, 1h)
4. Consumer groups: <service>-<domain>-v1 format
5. Dapr component manifests: pubsub-kafka, statestore-postgres, secretstore-kubernetes
6. Helm charts for all 4 services with Dapr sidecar annotations

Part C — Cloud AKS + CI/CD + Monitoring
1. AKS cluster: 3× Standard_D2s_v3, NGINX Ingress + cert-manager + Let's Encrypt
2. Cloud Kafka: Aiven (predictable pricing, SASL+TLS)
3. CI/CD: GitHub Actions matrix build → GHCR → helm upgrade --install
4. Monitoring: kube-prometheus-stack + prometheus-fastapi-instrumentator + ServiceMonitor
5. HPA: KEDA ScaledObject (Kafka lag-based, maxReplicas ≤ partitions)
6. Secrets: All via Kubernetes Secrets + Dapr Secrets Store API; zero hardcoded

## Response snapshot

Launched 4 parallel research agents:
- Agent a0586bd (Dapr): Full component YAMLs for PubSub (Kafka), State Store (PostgreSQL v2), Jobs API (HTTP /v1.0-alpha1/), Secrets Store (K8s), Service Invocation, sidecar injection annotations
- Agent af94619 (Kafka): Redpanda for Minikube; Aiven for cloud; topic configs; consumer group naming; Strimzi installation commands
- Agent af4ede7 (AKS/CI-CD/Monitoring): NGINX Ingress + cert-manager ClusterIssuer; GitHub Actions matrix workflow; kube-prometheus-stack; ServiceMonitor templates; KEDA ScaledObject; resource limits per service
- Agent ac5bdf6 (Recurring tasks): python-dateutil rrule; Dapr Jobs 6-field cron; zoneinfo; ProcessedEventLog idempotency table; RecurringTask + TaskInstance + TaskReminder schema

Produced 6 plan artifacts:
- research.md: 9-section consolidated research (Kafka, Dapr, recurring tasks, AKS, CI/CD, monitoring, resource limits)
- data-model.md: 6 entities (Task, Tag, RecurringTask, TaskInstance, Reminder, ProcessedEventLog) + 3 Kafka event schemas + Dapr State Store schema
- contracts/api.yaml: OpenAPI 3.1, 20+ endpoints (Tasks, Recurring, Reminders, Tags, Chat, Dapr callbacks)
- contracts/events.md: 3 topics, 9 event types with full envelope schema and versioning policy
- quickstart.md: Step-by-step local (Minikube) + cloud (AKS) setup; debugging commands; environment variables reference
- plan.md: Complete technical blueprint with architecture decisions, project structure, acceptance criteria, risks

Key architectural decisions:
- AD-1: Redpanda (local) + Aiven (cloud) — rejects Confluent (cost) and Strimzi (resource overhead)
- AD-2: Dapr Jobs via httpx HTTP API — Python SDK has no Jobs support as of v1.14
- AD-3: 5-state machine for RecurringTask (pending→active↔paused→completed/cancelled)
- AD-4: ProcessedEventLog with UNIQUE(idempotency_key) for Kafka at-least-once → exactly-once semantics
- AD-5: KEDA ScaledObject for Kafka lag-based HPA (rejects CPU-only HPA as uncorrelated with event backlog)

## Outcome

- ✅ Impact: Complete Phase V technical blueprint generated; all design artifacts created; ready for /sp.tasks
- 🧪 Tests: No tests in plan phase; test structure defined per service in plan.md project structure
- 📁 Files: 6 files created in specs/011-advanced-cloud-deploy/ (research.md, data-model.md, contracts/api.yaml, contracts/events.md, quickstart.md, plan.md)
- 🔁 Next prompts: /sp.tasks (generate tasks.md from plan.md); then /sp.implement
- 🧠 Reflection: 4 parallel research agents delivered comprehensive, non-hallucinated configurations; Dapr Jobs API Python SDK gap is a notable constraint requiring HTTP fallback

## Evaluation notes (flywheel)

- Failure modes observed: update-agent-context.sh script still resolves to git root instead of Phase_V; agent context update skipped (non-blocking)
- Graders run and results (PASS/FAIL): Constitution check PASS (all 8 principles met); Structure check PASS (all required files created at correct paths)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Initialize Phase_V as its own git repository OR add --spec-root flag to .specify/scripts/bash/common.sh to resolve paths relative to CWD
