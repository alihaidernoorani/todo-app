---
id: "0006"
title: Implement Patch 001 Implementation Gaps
stage: green
date: 2026-03-10
surface: agent
model: claude-sonnet-4-6
feature: 011-advanced-cloud-deploy
branch: 011-advanced-cloud-deploy
user: alihaidernoorani
command: /sp.implement
labels: ["dapr","tags","sse","filters","event-publishing","implementation"]
links:
  spec: specs/011-advanced-cloud-deploy/patch-001-implementation-gaps.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/services/task_service.py
  - frontend/lib/api/types.ts
  - frontend/components/dashboard/TaskForm.tsx
  - frontend/components/dashboard/TaskItem.tsx
  - frontend/components/dashboard/TaskStream.tsx
  - frontend/contexts/TasksContext.tsx
tests:
  - null
---

## Prompt

Implement the patch specification:

specs/011-advanced-cloud-deploy/patch-001-implementation-gaps.md

Branch: 011-advanced-cloud-deploy
Directory: Phase_V

IMPORTANT
Only implement what is defined in the patch spec. Do not modify any unrelated files or refactor existing code.

Implementation order:
1. P001 — FR-020 Event Publishing
2. P002 — Frontend Tag Support
3. P003 — Search and Tag Filters
4. P004 — SSE Real-Time Updates

## Response snapshot

All four patches implemented successfully:

**P001** (`backend/src/services/task_service.py`): Added `dapr_pubsub.publish("task-events", ...)` to `create_task()` (event_type: task.instance_created), `update_task()` (event_type: task.updated), and `delete_task()` (event_type: task.deleted). Each wrapped in `try/except Exception` with `logger.warning`. `delete_task()` captures title/priority before deletion.

**P002** (`frontend/lib/api/types.ts`, `TaskForm.tsx`, `TaskItem.tsx`): Added `tags?: string[]` to `TaskRead`, `TaskCreate`, `TaskUpdate`. Added tag input with Enter-to-add + removable chips in `TaskForm`. Added tag chip display in `TaskItem` below timestamp. Changed `initialData` type from `Partial<TaskUpdate>` to `Partial<TaskRead>`.

**P003** (`frontend/components/dashboard/TaskStream.tsx`): Added search `<input type="search">` binding to `filters.search`, tag filter input with Enter-to-add, active tag chip display with remove buttons, updated "Clear filters" condition to include search and tags.

**P004** (`frontend/contexts/TasksContext.tsx`): Added `useEffect` with `EventSource('/api/tasks/stream', { withCredentials: true })`, listeners for `task.instance_created` and `task.status_changed` that call `triggerRefresh()`, cleanup via `es.close()` on unmount.

## Outcome

- ✅ Impact: All four implementation gaps from patch-001 are resolved across backend and frontend
- 🧪 Tests: None run (implementation only per patch spec scope)
- 📁 Files: 6 files modified (task_service.py, types.ts, TaskForm.tsx, TaskItem.tsx, TaskStream.tsx, TasksContext.tsx)
- 🔁 Next prompts: Verify SSE route `/api/tasks/stream` exists in Next.js proxy; run integration tests
- 🧠 Reflection: Minimal additive changes only — no refactoring of existing code outside patch scope

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): verify SSE stream route exists and test end-to-end
