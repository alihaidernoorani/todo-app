---
id: 0035
title: Fix duplicate key and metrics update bugs
stage: green
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-modern-ui-ux-dashboard
branch: full-stack-todo-app
user: alihaidernoorani
command: /sp.implement
labels: ["bug-fix", "state-management", "optimistic-updates", "real-time-metrics"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/dashboard/TaskStream.tsx
  - frontend/lib/hooks/use-optimistic-task.ts
tests:
  - Manual testing - All task buttons functional
  - Manual testing - Metrics updating in real-time
---

## Prompt

There is still problems with the tasks buttons. They are not working

## Response snapshot

### Issue Identified
User reported that all task buttons (Add, Edit, Delete, Complete) were not responding to clicks. Browser console showed duplicate key error:
```
Encountered two children with the same key, `170d5c0d-a8c2-457b-88b8-2435630111be`.
Keys should be unique so that components maintain their identity across updates.
```

This duplicate key error was breaking React's reconciliation, preventing all button interactions.

### Root Cause Analysis
The duplicate key issue was caused by improper state management in the optimistic update flow:

1. **useOptimisticTask hook** was updating optimistic state with server response data
2. **TaskStream component** was also adding the same task to `initialTasks`
3. React's `useOptimistic` was showing both the optimistic task AND the real task
4. Same task appeared twice with the same ID → duplicate key error
5. React reconciliation broke → all buttons stopped working

### Solution Implemented

#### 1. Fixed useOptimisticTask Hook (`frontend/lib/hooks/use-optimistic-task.ts`)

**Before:**
- After server response, hook added real task to optimistic state
- This caused duplicates when parent also updated `initialTasks`

**After:**
- **Create operation**: Only removes temp task, doesn't add real task to optimistic state
- **Update/Toggle operations**: Only clears optimistic flag, doesn't update with full server data
- Hook returns real task data for parent to update `initialTasks`

**Changes:**
```tsx
// Create - removed adding real task to optimistic state
startTransition(() => {
  updateOptimisticTasks({ type: "DELETE", taskId: tempId })
  // Removed: updateOptimisticTasks({ type: "CREATE", task: createdTask })
})

// Update/Toggle - only clear optimistic flag
startTransition(() => {
  updateOptimisticTasks({
    type: "UPDATE",
    taskId,
    updates: { _optimistic: false }, // Only clear flag, not full data
  })
})
```

#### 2. Fixed TaskStream Component (`frontend/components/dashboard/TaskStream.tsx`)

**Issue 1: Duplicate Key Error**
- Kept updating `initialTasks` with server responses
- Now properly syncs with optimistic hook to avoid duplicates

**Issue 2: Metrics Not Updating**
- Was calling `notifyParent()` with stale optimistic state
- Now notifies parent synchronously inside `setInitialTasks` callback

**Changes:**
```tsx
// Before: Used stale optimistic state
const notifyParent = () => {
  const realTasks = tasks.filter(task => !task.id.startsWith('temp-'))
  onTasksChange?.(realTasks)
}
setTimeout(notifyParent, 0)

// After: Notify immediately with fresh data
setInitialTasks(prev => {
  const updatedTasks = [newTask, ...prev]
  onTasksChange?.(updatedTasks) // Synchronous, fresh data
  return updatedTasks
})
```

### State Management Flow (After Fix)

```
1. User Action (e.g., Add Task)
   ↓
2. Optimistic Hook: Add temp task to optimistic state (instant UI feedback)
   ↓
3. API Call: Server creates real task
   ↓
4. Optimistic Hook: Remove temp task, return real task
   ↓
5. TaskStream: Update initialTasks with real task
   ↓
6. TaskStream: Notify parent with real task (for metrics)
   ↓
7. useOptimistic: Syncs optimistic state with updated initialTasks
   ↓
8. Result: No duplicates, buttons work, metrics update! ✅
```

### Testing Results

**✅ All Buttons Working:**
- Add Task button - Creates tasks without duplicates
- Complete checkbox - Toggles task completion
- Edit button - Opens edit form
- Delete button - Removes tasks
- No duplicate key errors in console

**✅ Metrics Updating in Real-Time:**
- Total Tasks updates immediately on create/delete
- Completed count updates immediately on toggle
- In Progress count updates immediately
- All metrics calculate client-side (no server calls)

### Files Modified

1. **frontend/lib/hooks/use-optimistic-task.ts** (427 lines)
   - Modified `createTask()`: Remove temp task only, don't add real task to optimistic state
   - Modified `toggleComplete()`: Only clear optimistic flag
   - Modified `updateTask()`: Only clear optimistic flag
   - Pattern: Let parent manage `initialTasks`, hook manages temporary optimistic state only

2. **frontend/components/dashboard/TaskStream.tsx** (253 lines)
   - Removed `notifyParent()` helper function
   - Updated `handleCreate()`: Notify parent inside `setInitialTasks` callback
   - Updated `handleUpdate()`: Notify parent inside `setInitialTasks` callback
   - Updated `handleToggle()`: Notify parent inside `setInitialTasks` callback
   - Updated `handleDelete()`: Notify parent inside `setInitialTasks` callback
   - Fixed useEffect: Run only on mount, notify parent with fetched tasks

## Outcome

- ✅ Impact: Fixed critical bug preventing all task interactions; metrics now update in real-time
- 🧪 Tests: Manual testing confirmed all buttons functional and metrics updating correctly
- 📁 Files: Modified 2 files (useOptimisticTask hook, TaskStream component)
- 🔁 Next prompts: Continue with remaining Phase 4 tasks (T022-T026), then Phase 5 (Typography), Phase 6 (Visual Testing)
- 🧠 Reflection: The duplicate key issue was subtle - React's useOptimistic expects the base state to be updated separately from optimistic updates. The pattern is: optimistic hook manages temporary UI state, parent manages persistent base state.

## Evaluation notes (flywheel)

- Failure modes observed: Duplicate key error breaking React reconciliation; race condition in metrics update callback timing
- Graders run and results (PASS/FAIL): Manual testing - PASS (all buttons working, metrics updating)
- Prompt variant (if applicable): N/A (bug fix)
- Next experiment (smallest change to try): Consider extracting metrics calculation into a custom hook for better separation of concerns
