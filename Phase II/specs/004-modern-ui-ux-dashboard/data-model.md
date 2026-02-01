# Data Model: Modern UI/UX Dashboard

**Feature**: 004-modern-ui-ux-dashboard
**Date**: 2026-01-25
**Related**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Overview

This document defines the data structures, state models, and component hierarchy for the Modern UI/UX Dashboard. It covers backend schema modifications, frontend-only state models, and the React component architecture with Server/Client Component boundaries.

---

## Backend Data Model

### Task Entity (Modified)

**Table**: `tasks` (PostgreSQL via SQLModel)

**Modifications from Existing Schema**:
- ADD `priority` field (string enum: "High", "Medium", "Low")

**Complete Schema** (backend/src/models/task.py):
```python
class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=255, nullable=False)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool = Field(default=False, nullable=False)
    priority: str = Field(default="Medium", nullable=False)  # NEW: High/Medium/Low
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), nullable=False)
    user_id: UUID = Field(nullable=False, index=True)
```

**Validation Rules**:
- `priority` MUST be one of: "High", "Medium", "Low"
- Backend service layer validates priority enum before saving
- Invalid priority values return 422 Unprocessable Entity

**State Transitions**:
- `is_completed`: false → true (via PATCH /api/{user_id}/tasks/{id}/complete)
- `priority`: Can change via PUT /api/{user_id}/tasks/{id}

---

### TaskMetrics Entity (Computed)

**Source**: Aggregation query, NOT a database table

**Schema** (backend response only):
```typescript
interface TaskMetrics {
  total: number                 // Total tasks for user
  completed: number             // is_completed = true
  pending: number               // is_completed = false
  overdue: number               // due_date < now AND is_completed = false
  high_priority: number         // priority = "High"
  medium_priority: number       // priority = "Medium"
  low_priority: number          // priority = "Low"
}
```

**Computation Logic** (backend/src/services/task_service.py):
```python
async def get_metrics(session: AsyncSession, user_id: UUID) -> TaskMetrics:
    tasks = await session.exec(
        select(Task).where(Task.user_id == user_id)
    ).all()

    total = len(tasks)
    completed = sum(1 for t in tasks if t.is_completed)
    pending = total - completed
    overdue = sum(1 for t in tasks
                  if not t.is_completed and t.due_date and t.due_date < datetime.now(UTC))
    high = sum(1 for t in tasks if t.priority == "High")
    medium = sum(1 for t in tasks if t.priority == "Medium")
    low = sum(1 for t in tasks if t.priority == "Low")

    return TaskMetrics(
        total=total, completed=completed, pending=pending, overdue=overdue,
        high_priority=high, medium_priority=medium, low_priority=low
    )
```

---

## Frontend Data Model

### API Contract Types (TypeScript)

**File**: `frontend/src/lib/api/types.ts`

Match backend Pydantic schemas exactly:

```typescript
// Priority enum
export type TaskPriority = "High" | "Medium" | "Low"

// Request schemas
export interface TaskCreate {
  title: string                    // min_length=1, max_length=255
  description: string | null
  priority: TaskPriority           // NEW field
}

export interface TaskUpdate {
  title: string                    // min_length=1, max_length=255
  description: string | null
  is_completed: boolean
  priority: TaskPriority           // NEW field
}

// Response schemas
export interface TaskRead {
  id: string                       // UUID as string
  title: string
  description: string | null
  is_completed: boolean
  priority: TaskPriority           // NEW field
  created_at: string               // ISO 8601 datetime
  user_id: string                  // UUID as string
}

export interface TaskList {
  items: TaskRead[]
  count: number
}

export interface TaskMetrics {
  total: number
  completed: number
  pending: number
  overdue: number
  high_priority: number
  medium_priority: number
  low_priority: number
}
```

---

### Frontend-Only State Models

#### OptimisticTask (Client State)

**Purpose**: Extend TaskRead with optimistic update metadata

**File**: `frontend/src/lib/hooks/use-optimistic-task.ts`

```typescript
export interface OptimisticTask extends TaskRead {
  _optimistic: boolean             // True if not yet confirmed by server
  _error: string | null            // Error message if mutation failed (for inline display)
  _retryFn: (() => Promise<void>) | null  // Retry function for failed mutations
}
```

**Usage**:
```typescript
const [optimisticTasks, setOptimisticTasks] = useOptimistic<OptimisticTask[]>(
  serverTasks,
  (state, newTask) => [...state, { ...newTask, _optimistic: true, _error: null, _retryFn: null }]
)
```

**State Lifecycle**:
1. User triggers mutation → `_optimistic: true` (task appears immediately)
2. API call succeeds → Merge server response, remove `_optimistic` flag
3. API call fails → Set `_error` with message, `_retryFn` with retry callback, rollback optimistic change

---

#### DraftTask (localStorage Schema)

**Purpose**: Persist unsaved form state during session expiry

**File**: `frontend/src/lib/hooks/use-draft-recovery.ts`

```typescript
export interface DraftTask {
  title: string
  description: string | null
  priority: TaskPriority
  timestamp: number                // Unix timestamp (Date.now())
}
```

**Storage Key**: `draft-task-${user_id}`

**Expiry**: Drafts older than 24 hours are automatically discarded

**Lifecycle**:
1. User starts creating task (types in form)
2. Session expires (401 from API) → Save current form state to localStorage
3. Redirect to /sign-in
4. User re-authenticates → Check localStorage for draft
5. If draft found AND < 24 hours old → Show "Restore unsaved work?" modal
6. User confirms → Pre-fill form with draft data, delete draft from localStorage
7. User discards → Delete draft from localStorage

---

## Component Architecture

### Component Hierarchy

```text
App Shell (Server Component)
│
├── RootLayout (Server Component)
│   ├── <html> + <body> tags
│   ├── Font Loading (Inter variable, Playfair Display)
│   ├── Tailwind Global Styles (globals.css)
│   └── Better Auth Provider (Client Boundary)
│
├── (auth) Route Group [No Sidebar]
│   ├── AuthLayout (Server Component)
│   │   └── Centered Form Container
│   │
│   └── /sign-in/page.tsx (Client Component)
│       └── SignInForm
│           ├── Email Input
│           ├── Password Input
│           ├── Submit Button (LuxuryButton)
│           └── Better Auth Integration
│
└── (dashboard) Route Group [With Layout]
    ├── DashboardLayout (Client Component)
    │   ├── Sidebar (Client - Glassmorphism)
    │   │   ├── Logo
    │   │   ├── Navigation Links
    │   │   └── Collapse Toggle
    │   │
    │   ├── Topbar (Client)
    │   │   ├── Page Title (Playfair Display)
    │   │   ├── User Avatar
    │   │   └── Sign Out Button
    │   │
    │   └── MobileNav (Client - Sticky Bottom)
    │       └── Icon Buttons x3-4
    │
    └── /page.tsx (Server Component with Suspense)
        ├── <Suspense fallback={<MetricsGridSkeleton />}>
        │   └── MetricsGrid (Client Component)
        │       ├── MetricCard (Atomic) - Total Tasks
        │       ├── MetricCard (Atomic) - Completed Tasks
        │       ├── MetricCard (Atomic) - Pending Tasks
        │       └── MetricCard (Atomic) - Overdue Tasks
        │
        └── <Suspense fallback={<TaskStreamSkeleton />}>
            └── TaskStream (Client Component)
                ├── TaskForm (Client)
                │   ├── Title Input
                │   ├── Description Textarea
                │   ├── Priority Dropdown
                │   ├── Submit Button (LuxuryButton)
                │   └── DraftRecovery Modal (conditional)
                │
                ├── TaskItem (Client) x N
                │   ├── AnimatedCheckbox (Atomic)
                │   ├── Task Content
                │   │   ├── Title (with priority badge)
                │   │   └── Description
                │   ├── Action Buttons
                │   │   ├── Edit Button (LuxuryButton)
                │   │   └── Delete Button (LuxuryButton)
                │   └── InlineError (conditional if _error)
                │       ├── Error Message
                │       └── Retry Button
                │
                └── EmptyState (if no tasks)
                    ├── Illustration/Icon
                    ├── "No tasks yet" message
                    └── CTA to create first task
```

---

### Server vs Client Component Boundaries

**Server Components** (Default - No 'use client' directive):
- RootLayout
- AuthLayout
- DashboardPage (wraps Suspense boundaries)
- Static content wrappers

**Benefits**:
- Zero JavaScript bundle for static content
- Server-side data fetching (no waterfalls)
- SEO-friendly rendering

**Client Components** ('use client' directive required):
- SignInForm (Better Auth needs browser APIs)
- DashboardLayout (state for sidebar collapse)
- Sidebar, Topbar, MobileNav (interactive UI)
- MetricsGrid (fetches data, updates on interval)
- TaskStream (useOptimistic hook)
- TaskForm (form state, localStorage hooks)
- TaskItem (checkbox toggle, edit mode)
- All atomic components with animations (AnimatedCheckbox, LuxuryButton)

**Why Client Boundary Needed**:
- Hooks (`useState`, `useOptimistic`, `useEffect`)
- Browser APIs (localStorage, fetch with credentials)
- Event handlers (onClick, onChange)
- Third-party libraries requiring window object (Framer Motion)

---

### Atomic Component Design

#### Atoms (Smallest Units)

**ShimmerSkeleton.tsx**:
```typescript
interface ShimmerSkeletonProps {
  width?: string          // Tailwind width class (default: "w-full")
  height?: string         // Tailwind height class (default: "h-4")
  rounded?: string        // Tailwind rounded class (default: "rounded-md")
}
```
**Usage**: Placeholder during Suspense or loading states

---

**AnimatedCheckbox.tsx**:
```typescript
interface AnimatedCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}
```
**Behavior**: Spring animation on toggle (Framer Motion)

---

**LuxuryButton.tsx**:
```typescript
interface LuxuryButtonProps {
  variant: "primary" | "secondary" | "ghost"
  size: "sm" | "md" | "lg"
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}
```
**Styling**: Glassmorphism (backdrop-blur, translucent border), hover state with glow

---

#### Molecules (Combinations)

**MetricCard**:
```typescript
interface MetricCardProps {
  label: string           // e.g., "Total Tasks"
  value: number           // Big bold number
  icon: React.ReactNode   // Lucide icon
  trend?: "+5" | "-3"     // Optional trend indicator
}
```

**TaskItem**:
```typescript
interface TaskItemProps {
  task: OptimisticTask
  onToggleComplete: (id: string) => Promise<void>
  onEdit: (id: string) => void
  onDelete: (id: string) => Promise<void>
}
```

---

## State Management Patterns

### Optimistic Update Flow

**Initial State**: Server tasks from API
```typescript
const [serverTasks, setServerTasks] = useState<TaskRead[]>([])
```

**Optimistic State** (React 19 `useOptimistic`):
```typescript
const [optimisticTasks, addOptimisticTask] = useOptimistic<OptimisticTask[]>(
  serverTasks,
  (state, optimisticUpdate) => {
    // Apply optimistic update immediately
    return [...state, optimisticUpdate]
  }
)
```

**Mutation Flow**:
```typescript
async function createTask(taskData: TaskCreate) {
  // 1. Add optimistic task immediately (UI updates <100ms)
  const tempId = `temp-${Date.now()}`
  const optimisticTask: OptimisticTask = {
    ...taskData,
    id: tempId,
    user_id: currentUserId,
    is_completed: false,
    created_at: new Date().toISOString(),
    _optimistic: true,
    _error: null,
    _retryFn: null
  }
  addOptimisticTask(optimisticTask)

  try {
    // 2. Send API request
    const createdTask = await apiClient.tasks.create(taskData)

    // 3. Success: Merge server response (removes _optimistic flag)
    setServerTasks(prev => [...prev, createdTask])
  } catch (error) {
    // 4. Failure: Rollback optimistic state, show inline error
    setServerTasks(prev => prev)  // Trigger re-render to remove optimistic task

    // Update specific task with error
    setOptimisticTasks(prev => prev.map(t =>
      t.id === tempId
        ? { ...t, _error: error.message, _retryFn: () => createTask(taskData) }
        : t
    ))
  }
}
```

---

### Draft Recovery Flow

**On Session Expiry Detection** (ApiClient intercepts 401):
```typescript
// In ApiClient error handler
if (response.status === 401) {
  // 1. Save current form state
  const draftData: DraftTask = {
    title: formData.title,
    description: formData.description,
    priority: formData.priority,
    timestamp: Date.now()
  }
  localStorage.setItem(`draft-task-${userId}`, JSON.stringify(draftData))

  // 2. Clear auth cookies
  document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

  // 3. Redirect to sign-in
  window.location.href = "/sign-in"
}
```

**On Dashboard Mount After Re-Auth**:
```typescript
useEffect(() => {
  const draftKey = `draft-task-${userId}`
  const savedDraft = localStorage.getItem(draftKey)

  if (savedDraft) {
    const draft: DraftTask = JSON.parse(savedDraft)
    const age = Date.now() - draft.timestamp

    // Discard drafts older than 24 hours
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(draftKey)
      return
    }

    // Show "Restore unsaved work?" modal
    setDraftModal({ visible: true, data: draft })
  }
}, [userId])
```

---

## Data Validation

### Frontend Validation (Before API Call)

```typescript
const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(2000, "Description too long").nullable(),
  priority: z.enum(["High", "Medium", "Low"], {
    errorMap: () => ({ message: "Invalid priority level" })
  })
})

// Validate before sending to API
const validatedData = taskCreateSchema.parse(formData)
await apiClient.tasks.create(validatedData)
```

### Backend Validation (Pydantic + SQLModel)

Backend already validates via Pydantic schemas:
- Field lengths enforced automatically
- Type coercion handled by Pydantic
- Returns 422 Unprocessable Entity for validation errors

Frontend must handle 422 responses and display field-specific errors.

---

## Relationships & Data Integrity

### User ↔ Task Relationship

**Cardinality**: One-to-Many
- One User owns many Tasks
- Each Task belongs to exactly one User

**Enforcement**:
- Backend: `user_id` foreign key constraint (not enforced in SQLModel schema but implicit)
- API: All endpoints require `user_id` in path (`/api/{user_id}/tasks`)
- Authorization: Backend validates JWT `user_id` matches path `user_id` (403 Forbidden if mismatch)

**Cascade Behavior**:
- User deletion → Delete all associated Tasks (not yet implemented, but planned)

---

## Performance Considerations

### Database Indexing

**Existing Indexes**:
- `tasks.user_id` (already indexed via `index=True` in SQLModel)

**Recommended Additional Indexes** (for metrics query):
```sql
CREATE INDEX idx_tasks_user_priority ON tasks(user_id, priority);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, is_completed);
```

### Frontend Caching Strategy

**Task List Caching**:
- Use React Query or SWR for automatic caching
- Stale-while-revalidate pattern (show cached data immediately, fetch fresh in background)
- Cache invalidation on mutations (optimistic updates handle UI immediately)

**Metrics Polling**:
- Fetch metrics on mount
- Refresh every 30 seconds (only when tab is active)
- Use `visibilitychange` event to pause polling when tab hidden

---

## Security Model

### User Data Isolation

**Principle**: User MUST NEVER see or modify another user's tasks

**Backend Enforcement**:
- All queries filtered by `user_id` from JWT
- Path parameter `user_id` validated against JWT claim
- 403 Forbidden if mismatch

**Frontend Enforcement**:
- ApiClient extracts `user_id` from JWT (via server-side decode)
- All API paths constructed with authenticated user's ID
- No client-side logic for user switching (single-user session)

### Draft Data Privacy

**localStorage Scope**: Per-origin (shared across all users on same domain)

**Mitigation**:
- Draft keys include `user_id`: `draft-task-${userId}`
- On sign-out, clear all drafts for current user
- On sign-in as different user, ignore drafts from previous user

---

## Migration Path

### Database Migration (Alembic)

**File**: `backend/alembic/versions/XXXX_add_priority_field.py`

```python
def upgrade():
    # Add priority column with default value
    op.add_column('tasks', sa.Column('priority', sa.String(length=20), nullable=False, server_default='Medium'))

    # Remove server default after backfill (keeps default in code, not DB)
    op.alter_column('tasks', 'priority', server_default=None)

def downgrade():
    op.drop_column('tasks', 'priority')
```

**Execution**:
```bash
cd backend
alembic revision --autogenerate -m "add_priority_field"
alembic upgrade head
```

### Frontend Type Migration

No migration needed - frontend is greenfield. Types defined from scratch matching enhanced backend schema.

---

## Summary

This data model defines:
1. **Backend Schema**: Task entity with priority field, TaskMetrics computed entity
2. **Frontend Types**: TypeScript interfaces matching backend Pydantic schemas
3. **Optimistic State**: OptimisticTask with metadata for rollback and inline errors
4. **Draft Recovery**: DraftTask schema for localStorage persistence
5. **Component Hierarchy**: Server/Client boundary decisions with atomic design
6. **State Patterns**: useOptimistic flow, draft save/restore lifecycle
7. **Validation**: Frontend Zod schema + Backend Pydantic enforcement
8. **Security**: User data isolation via JWT + path validation
9. **Migration**: Alembic script for priority field addition

**Next Artifact**: [contracts/task-api.yaml](./contracts/task-api.yaml) - OpenAPI specification
