# Patch 001 — Implementation Gaps

**Feature:** 011-advanced-cloud-deploy
**Branch:** 011-advanced-cloud-deploy
**Date:** 2026-03-09
**Status:** Pending Implementation

---

## Context

The `tasks.md` for this feature incorrectly marks several tasks as complete. A source-code audit identified four groups of missing functionality. This patch spec defines the exact changes needed.

---

## P001 — FR-020 Event Publishing

**File:** `backend/src/services/task_service.py`

### Problem

`create_task()`, `update_task()`, and `delete_task()` perform no Dapr event publishing. Only `complete_task()` publishes events (lines 279–300). The feature requirement FR-020 mandates that all mutating operations emit events to the `task-events` topic.

### Implementation Details

Follow the exact same pattern used in `complete_task()`:

1. **`create_task()`** — after `await session.refresh(task)` and before the `return`:
   - Import `dapr_pubsub` from `src.services.dapr_pubsub` (inside try block)
   - Build `event_payload` with keys: `task_id`, `user_id`, `title`, `priority`, `timestamp`
   - Publish to `"task-events"` with `event_type: "task.instance_created"`
   - Wrap in `try/except Exception` — log warning on failure, do not raise

2. **`update_task()`** — after `await session.refresh(task)` and before the `return`:
   - Same import and payload pattern
   - Publish to `"task-events"` with `event_type: "task.updated"`
   - Add `"status": "completed" if task.is_completed else "pending"` to payload
   - Wrap in `try/except Exception` — log warning, do not raise

3. **`delete_task()`** — after `await session.delete(task)` and `await session.flush()`, before `return True`:
   - Same import and payload pattern (use `task.title`, `task.priority`, `str(task_id)` captured before delete)
   - Publish to `"task-events"` with `event_type: "task.deleted"`
   - Wrap in `try/except Exception` — log warning, do not raise

### Reference Pattern (from `complete_task()`, lines 280–300)

```python
try:
    from src.services.dapr_pubsub import dapr_pubsub  # noqa: PLC0415

    event_payload = {
        "task_id": str(task_id),
        "user_id": user_id,
        "status": "completed",
        "title": task.title,
        "priority": task.priority,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await dapr_pubsub.publish("task-updates", {
        "event_type": "task.status_changed",
        **event_payload,
    })
    await dapr_pubsub.publish("task-events", {
        "event_type": "task.updated",
        **event_payload,
    })
except Exception as exc:
    logger.warning("Failed to publish task completion events for %s: %s", task_id, exc)
```

### Acceptance Criteria

- [ ] `create_task()` publishes `{"event_type": "task.instance_created", "task_id": ..., "user_id": ..., "title": ..., "priority": ..., "timestamp": ...}` to `"task-events"`
- [ ] `update_task()` publishes `{"event_type": "task.updated", ...}` to `"task-events"` after a successful update
- [ ] `delete_task()` publishes `{"event_type": "task.deleted", ...}` to `"task-events"` after a successful delete
- [ ] All three publish calls are wrapped in `try/except Exception` — failures log a warning and do not raise
- [ ] The function return value is unchanged in all three cases (success path unaffected)

---

## P002 — Frontend Tag Support

**Files:**
- `frontend/lib/api/types.ts`
- `frontend/lib/api/tasks.ts`
- `frontend/components/dashboard/TaskForm.tsx`
- `frontend/components/dashboard/TaskItem.tsx`

### Problem

`TaskRead` has no `tags` field; `TaskCreate` and `TaskUpdate` also lack `tags`. The form collects no tag input, `TaskItem` renders no tag chips, and the API client sends no tags in create/update payloads.

### Implementation Details

#### 1. `frontend/lib/api/types.ts`

Add `tags` to the three task interfaces:

```typescript
// TaskRead (line ~103) — add after `user_id`:
/** Tags associated with this task */
tags?: string[]

// TaskCreate (line ~41) — add after `priority?`:
/** Optional tags to associate with this task */
tags?: string[]

// TaskUpdate (line ~68) — add after `priority`:
/** Optional tags to associate with this task */
tags?: string[]
```

#### 2. `frontend/lib/api/tasks.ts`

`createTask` and `updateTask` already spread `taskData` directly into `JSON.stringify(taskData)`, so tags are included automatically once `TaskCreate`/`TaskUpdate` have the field. No code change needed unless tags are being stripped — verify the JSON body passes through.

If `createTask` or `updateTask` construct the body manually, add `tags: taskData.tags ?? []`.

#### 3. `frontend/components/dashboard/TaskForm.tsx`

Add tag input after the Priority select block (after line ~312):

- Add state: `const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])`
- Add state: `const [tagInput, setTagInput] = useState("")`
- Render a text input for tag entry:
  - Placeholder: `"Add tag and press Enter"`
  - On `Enter` keydown: trim the value, if non-empty and not a duplicate, push to `tags` array, clear input
  - Render existing tags as removable chips (tag text + `×` button that splices the tag out)
- Include `tags` in the `taskData` object passed to `onSubmit`
- In `initialData` usage, read `initialData?.tags` to populate initial tags (extend `TaskFormProps.initialData` type if needed to accept `Partial<TaskRead>` instead of `Partial<TaskUpdate>`)

#### 4. `frontend/components/dashboard/TaskItem.tsx`

Display tag chips after the timestamp `<p>` (after line ~165):

```tsx
{task.tags && task.tags.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {task.tags.map(tag => (
      <span
        key={tag}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
      >
        {tag}
      </span>
    ))}
  </div>
)}
```

### Acceptance Criteria

- [ ] `TaskRead` interface in `types.ts` includes `tags?: string[]`
- [ ] `TaskCreate` interface in `types.ts` includes `tags?: string[]`
- [ ] `TaskUpdate` interface in `types.ts` includes `tags?: string[]`
- [ ] `TaskForm` renders a tag text input with Enter-to-add behaviour
- [ ] `TaskForm` renders removable tag chips for each entered tag
- [ ] `TaskForm` passes `tags` in the submitted `taskData` object
- [ ] `TaskItem` renders tag chips below the timestamp when `task.tags` is non-empty
- [ ] No TypeScript type errors introduced

---

## P003 — Search & Tag Filters

**File:** `frontend/components/dashboard/TaskStream.tsx`

### Problem

The filter bar (lines 219–257) has `<select>` for status and priority only. There is no search text input and no tag selector. `TaskFilters.search` and `TaskFilters.tags` are defined in `types.ts` but never set from the UI.

### Implementation Details

Add two controls to the filter bar div (after the priority `<select>`, before the "Clear filters" button):

#### 1. Search Input

```tsx
<input
  type="search"
  value={filters.search || ''}
  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value || undefined }))}
  placeholder="Search tasks…"
  className="text-sm bg-slate-700 border border-slate-600 rounded-md px-3 py-1.5 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[160px]"
  aria-label="Search tasks"
/>
```

#### 2. Tag Selector

Add state: `const [tagInput, setTagInput] = useState("")`

Render a text input for tag filtering:
- Placeholder: `"Filter by tag…"`
- On `Enter` keydown: trim value, if non-empty add to `filters.tags` array (avoid duplicates), clear input
- Render active tag filters as removable chips with `×` that removes the tag from `filters.tags`

Helper functions to add/remove a tag from filters:
```typescript
const handleAddTagFilter = (tag: string) => {
  const normalized = tag.trim().toLowerCase()
  if (!normalized) return
  setFilters(prev => ({
    ...prev,
    tags: prev.tags ? (prev.tags.includes(normalized) ? prev.tags : [...prev.tags, normalized]) : [normalized]
  }))
  setTagInput("")
}

const handleRemoveTagFilter = (tag: string) => {
  setFilters(prev => ({
    ...prev,
    tags: prev.tags?.filter(t => t !== tag) || undefined
  }))
}
```

#### 3. Update `clearFilters`

The existing `clearFilters` function sets `setFilters({})` which already clears tags and search. Also reset `setTagInput("")`.

#### 4. Update "Clear filters" visibility condition

Change the condition from:
```tsx
{(filters.status || filters.priority) && (
```
to:
```tsx
{(filters.status || filters.priority || filters.search || filters.tags?.length) && (
```

### Acceptance Criteria

- [ ] Filter bar contains a search `<input type="search">` that updates `filters.search` on change
- [ ] Filter bar contains a tag input that adds tags to `filters.tags` on Enter
- [ ] Active tag filters are shown as removable chips in the filter bar
- [ ] "Clear filters" button appears when search or tags are active (in addition to status/priority)
- [ ] Clearing filters also resets the search input text and all tag chips
- [ ] The `listTasks` call automatically re-fires when `filters` changes (already wired via existing `useEffect`)

---

## P004 — SSE Real-Time Updates

**File:** `frontend/contexts/TasksContext.tsx`

### Problem

`TasksContext` provides `triggerRefresh()` which increments `refreshKey`, but nothing subscribes to the backend SSE stream at `/api/tasks/stream`. There is no `EventSource` connection, so the frontend never receives push events.

### Implementation Details

Inside `TasksProvider`, add an SSE subscription effect:

```typescript
useEffect(() => {
  // Only connect when running in the browser
  if (typeof window === 'undefined') return

  const streamUrl = '/api/tasks/stream'
  const es = new EventSource(streamUrl, { withCredentials: true })

  es.addEventListener('task.instance_created', () => {
    triggerRefresh()
  })

  es.addEventListener('task.status_changed', () => {
    triggerRefresh()
  })

  es.onerror = (err) => {
    console.warn('[SSE] Connection error, will auto-reconnect:', err)
    // Browser auto-reconnects EventSource on error — no manual retry needed
  }

  return () => {
    es.close()
  }
}, [triggerRefresh])
```

**Notes:**
- The stream URL `/api/tasks/stream` is a Next.js proxy route that forwards to the backend SSE endpoint (`GET /api/{user_id}/tasks/stream`). Verify this route exists in `frontend/app/api/tasks/stream/route.ts` (or equivalent). If it does not exist, that is a separate gap outside this patch.
- `withCredentials: true` ensures auth cookies are sent with the SSE request.
- `triggerRefresh()` increments `refreshKey`, which `TaskStream` already watches via its `refreshKey` prop to re-fetch tasks.
- Do not reconstruct `triggerRefresh` on every render — it is already wrapped in `useCallback`.

### Acceptance Criteria

- [ ] `TasksProvider` opens an `EventSource` to `/api/tasks/stream` on mount
- [ ] Receiving a `task.instance_created` event calls `triggerRefresh()`
- [ ] Receiving a `task.status_changed` event calls `triggerRefresh()`
- [ ] The `EventSource` is closed (`es.close()`) in the effect cleanup on unmount
- [ ] SSE errors are logged as warnings and do not crash the component
- [ ] `TaskStream` re-fetches its task list after `refreshKey` increments (already wired via existing prop)

---

## Execution Order

These patches are independent and can be implemented in parallel:

| Patch | Dependencies |
|-------|-------------|
| P001  | None — backend only |
| P002  | None — frontend types + components |
| P003  | P002 (tags must exist in `TaskFilters` — already defined in `types.ts`) |
| P004  | None — context only |

Recommended order: **P001 → P002 → P003 → P004** (P003 after P002 to ensure tag types are consistent).
