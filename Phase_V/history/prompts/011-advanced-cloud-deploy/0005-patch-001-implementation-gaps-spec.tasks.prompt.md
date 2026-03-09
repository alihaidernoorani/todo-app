---
id: "0005"
title: Patch 001 Implementation Gaps Spec
stage: tasks
date: 2026-03-09
surface: agent
model: claude-sonnet-4-6
feature: 011-advanced-cloud-deploy
branch: 011-advanced-cloud-deploy
user: alihaidernoorani
command: /sp.tasks
labels: ["patch-spec","dapr","tags","sse","filters","implementation-gaps"]
links:
  spec: specs/011-advanced-cloud-deploy/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-advanced-cloud-deploy/patch-001-implementation-gaps.md
tests:
  - null
---

## Prompt

You are working in Phase_V on branch `011-advanced-cloud-deploy`.

IMPORTANT
The file `specs/011-advanced-cloud-deploy/tasks.md` marks all tasks as complete, but this is incorrect. Treat the following items as unfinished based on the actual source code:

- FR-020: create_task(), update_task(), delete_task() do not publish Dapr events
- T043–T045: frontend has no tag input, no tag display, and TaskRead lacks a tags field
- T061–T062: TaskStream filter bar has no search input or tag selector
- T076: frontend has no EventSource connection to `/api/tasks/stream`

Do not rely on tasks.md. The source code is the ground truth.

STEP 1 — Analyze the repository
Read and confirm the gaps in these files:
- backend/src/services/task_service.py
- backend/src/services/dapr_pubsub.py
- frontend/lib/api/types.ts
- frontend/lib/api/tasks.ts
- frontend/components/dashboard/TaskForm.tsx
- frontend/components/dashboard/TaskItem.tsx
- frontend/components/dashboard/TaskStream.tsx
- frontend/contexts/TasksContext.tsx
- backend/src/api/v1/tasks.py

STEP 2 — Create a patch spec at specs/011-advanced-cloud-deploy/patch-001-implementation-gaps.md
STEP 3 — Stop (do not implement code yet).

## Response snapshot

Confirmed all four gaps from source:

1. **P001**: `task_service.py` — `create_task()`, `update_task()`, `delete_task()` have zero Dapr publish calls. Only `complete_task()` (lines 280–300) publishes events.
2. **P002**: `types.ts` — `TaskRead`, `TaskCreate`, `TaskUpdate` have no `tags` field. `TaskForm.tsx` has no tag input. `TaskItem.tsx` has no tag chips.
3. **P003**: `TaskStream.tsx` filter bar (lines 219–257) — only status + priority selects. No search input, no tag selector.
4. **P004**: `TasksContext.tsx` — no `EventSource` instantiation anywhere. No SSE subscription.

Created `specs/011-advanced-cloud-deploy/patch-001-implementation-gaps.md` defining four patch tasks (P001–P004) with implementation details and acceptance criteria for each.

## Outcome

- ✅ Impact: Patch spec created; four implementation gaps documented with exact file targets and acceptance criteria
- 🧪 Tests: None run (analysis + spec creation only)
- 📁 Files: specs/011-advanced-cloud-deploy/patch-001-implementation-gaps.md (created)
- 🔁 Next prompts: Implement P001, P002, P003, P004 in order (or in parallel for P001+P002+P004)
- 🧠 Reflection: Source-code-as-ground-truth approach correctly identified discrepancy between tasks.md completion markers and actual implementation

## Evaluation notes (flywheel)

- Failure modes observed: tasks.md completion markers were inaccurate — do not use as source of truth for implementation status
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): implement P001 first (backend only, zero frontend risk)
