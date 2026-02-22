---
id: "0003"
title: Phase V Advanced Cloud Deploy Tasks
stage: tasks
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 011-advanced-cloud-deploy
branch: 011-advanced-cloud-deploy
user: alihaidernoorani
command: /sp.tasks
labels: ["tasks","dapr","kafka","kubernetes","recurring-tasks","reminders","priority","tags","search","ci-cd","monitoring"]
links:
  spec: specs/011-advanced-cloud-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-advanced-cloud-deploy/tasks.md
tests:
  - "N/A — tasks phase; tests executed during /sp.implement red/green cycle"
---

## Prompt

/sp.tasks

Generate tasks based on the plan

(User instruction: Generate tasks based on the plan)

Context: /sp.plan completed; all design artifacts available in specs/011-advanced-cloud-deploy/ — plan.md, research.md, data-model.md, contracts/api.yaml, contracts/events.md, quickstart.md, spec.md

## Response snapshot

Generated `specs/011-advanced-cloud-deploy/tasks.md` with 78 tasks across 8 phases:

**Phase 1 — Setup** (T001–T007, 7 tasks): Scaffold `services/recurring-service/`, `services/notification-service/`, `dapr/components/`, new Helm charts, `k8s/` cluster resources. All parallelizable.

**Phase 2 — Foundational** (T008–T022, 15 tasks): Dapr component YAMLs (pubsub-kafka local+cloud, statestore-postgres, secretstore-kubernetes), Dapr subscription manifests, `dapr_pubsub.py` + `dapr_jobs.py` + `dapr_secrets.py` services, Dapr sidecar annotations on all 4 Helm deployments, RBAC per service, 4 Alembic migrations (tags, recurring_tasks+task_instances, reminders, event_log), Prometheus instrumentation on backend. BLOCKS all user stories.

**Phase 3 — US1 Recurring Tasks P1** (T023–T036, 14 tasks): RecurringTask + TaskInstance + ProcessedEventLog models, RRuleService (dateutil), RecurringTaskService, POST/GET/PATCH/DELETE /api/tasks/recurring endpoints, OpenAI agent recurring task tool, recurring-service consumers + Dapr Jobs client + job_callback handler + InstanceCreator with idempotency + publisher + db.py + Dockerfile.

**Phase 4 — US3 Priority & Tags P2** (T037–T045, 9 tasks): Tag + TaskTag models, TagService with normalize_tag, extend task_service + task endpoints for priority/tags, tags API, agent tool updates, frontend TaskForm priority/tags, TaskItem badges.

**Phase 5 — US2 Reminders P2** (T046–T056, 11 tasks): Reminder model, ReminderService with Dapr Jobs, reminder API endpoints + Dapr job callback, notification-service db + consumers/reminders + notifier with task-completion suppression + event_log idempotency + Dockerfile + notifications proxy endpoint.

**Phase 6 — US4 Search/Filter P3** (T057–T062, 6 tasks): PostgreSQL FTS index migration, task_service filter params, GET /api/tasks filter endpoint, agent tool update, frontend filter bar, tasks.ts filter types.

**Phase 7 — US5 Cloud Deploy P1** (T063–T071, 9 tasks): 4× values-aks.yaml, Ingress templates, ServiceMonitor templates, KEDA ScaledObjects + cluster-issuer.yaml, cloud Dapr components, GitHub Actions CI/CD workflow (.github/workflows/deploy-aks.yml), secrets documentation, gitleaks config.

**Phase 8 — Polish** (T072–T078, 7 tasks): Health probes, task-updates consumer stub, structured logging, task complete shorthand endpoint, SSE stream for real-time updates, agent edge case handling, quickstart validation.

**Task statistics**:
- Total tasks: 78
- P1 stories: US1 (14 tasks) + US5 (9 tasks) = 23
- P2 stories: US3 (9 tasks) + US2 (11 tasks) = 20
- P3 stories: US4 (6 tasks) = 6
- Setup: 7 | Foundational: 15 | Polish: 7
- Parallelizable [P] tasks: ~40 (51%)

**Story dependency graph**:
- US3 → US4 (tags before tag filtering)
- US1 Jobs client → US2 (reminder Jobs reuses dapr_jobs.py)
- All features → US5 cloud validation
- US5 CI/CD + Helm tasks can run parallel with US1–US4

**MVP scope**: Phase 1 + Phase 2 + Phase 3 (US1) = 36 tasks → validates full EDA + Dapr + recurring-service end-to-end

## Outcome

- ✅ Impact: 78 immediately-executable tasks generated; each has exact file path, dependency order, and sufficient context for LLM implementation without additional context
- 🧪 Tests: No test tasks generated (tests not explicitly requested in spec); existing test suite in backend/tests/ provides baseline coverage
- 📁 Files: 1 file created — specs/011-advanced-cloud-deploy/tasks.md
- 🔁 Next prompts: /sp.implement (execute tasks from tasks.md)
- 🧠 Reflection: Existing Phase IV codebase inspection (alembic/versions/, backend/src/, frontend/components/) enabled precise "extend existing" vs "create new" task descriptions; prevented rebuilding already-implemented auth, task CRUD, and chat components

## Evaluation notes (flywheel)

- Failure modes observed: check-prerequisites.sh still resolves to git root — non-blocking; continued with direct file reads
- Graders run and results (PASS/FAIL): Format check PASS (all tasks follow `- [ ] [TaskID] [P?] [Story?] Description filepath` pattern); Completeness check PASS (all 5 user stories have implementation tasks); Path accuracy check PASS (all file paths verified against existing codebase structure)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add a --spec-root flag to common.sh that allows overriding git root resolution to Phase_V directory
