# Implementation Plan: Modern UI/UX Dashboard

**Branch**: `004-modern-ui-ux-dashboard` | **Date**: 2026-01-25 | **Revised**: 2026-02-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-modern-ui-ux-dashboard/spec.md`

## Summary

Build a professional-grade Next.js 16+ dashboard featuring the **"Clean Light Mode"** design system with a crisp white/slate palette and blue accents. The application is rebranded as **"TaskFlow"** for clarity and professionalism. The dashboard provides real-time task analytics, instant UI feedback via React 19 `useOptimistic`, and seamless integration with the existing FastAPI backend through a centralized `ApiClient` utility. Key innovations include HttpOnly cookie-based token storage for XSS protection, sub-100ms perceived latency through optimistic mutations, zero layout shift (0px CLS) via strategic Suspense boundaries, and **client-side route protection** with public `/login` and `/signup` pages.

**Critical Architecture Decisions** (from spec clarification 2026-02-02):
- **JWT Access**: Client-side JavaScript MUST NEVER directly decode JWT payload
- **user_id Extraction**: Obtained exclusively via Next.js Server Action (server-side cookie read + JWT decode)
- **API Paths**: Backend requires `/api/{user_id}/tasks` paths; client constructs these using user_id from Server Action
- **ApiClient Role**: Handles fetch, credentials, error handling, 401 redirects, AND user_id path interpolation (using Server Action-provided user_id)

## Revision Summary (2026-02-02)

**Architectural Changes**:
1. **Authentication Flow**: Added public `/login` and `/signup` pages with Better Auth client forms; implemented client-side route protection in `DashboardLayout`; legacy `/auth/*` routes redirect to `/login`
2. **Visual Theme**: Replaced "Midnight Stone" dark theme with "Clean Light Mode" light palette
3. **Rebranding**: Changed application name from "Command Center" to "TaskFlow"
4. **UI Headers**: Updated terminology (e.g., "Mission Control" → "My Tasks")
5. **User ID Flow (CRITICAL)**: Server Action extracts user_id from HttpOnly cookie server-side; client receives user_id for API path construction; client NEVER decodes JWT directly

---

## Server-Side User ID Extraction Architecture

**Problem**: Backend API requires `/api/{user_id}/tasks` paths, but JWT is stored in HttpOnly cookies (inaccessible to client-side JavaScript).

**Solution**: Next.js Server Action extracts user_id server-side and passes it to client components.

### Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (CLIENT)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│   1. Dashboard Page Loads                                                    │
│   2. Client Component calls Server Action: getUserId()                       │
├──────────────────────────────── SERVER BOUNDARY ────────────────────────────┤
│                              NEXT.JS SERVER                                  │
│   3. Server Action reads HttpOnly cookie: cookies().get('auth-token')        │
│   4. Server Action decodes JWT (server-side only): jwtDecode(token)          │
│   5. Server Action returns user_id string to client                          │
├──────────────────────────────── SERVER BOUNDARY ────────────────────────────┤
│                              BROWSER (CLIENT)                                │
│   6. Client receives user_id (string, not JWT payload)                       │
│   7. ApiClient constructs path: `/api/${userId}/tasks`                       │
│   8. ApiClient makes fetch request with credentials: 'include'               │
├─────────────────────────────────────────────────────────────────────────────┤
│                              FASTAPI BACKEND                                 │
│   9. Backend receives request at /api/{user_id}/tasks                        │
│  10. Backend extracts JWT from Authorization header                          │
│  11. Backend validates: JWT.user_id === path.user_id (403 if mismatch)       │
│  12. Backend returns user-scoped data                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Server Action Implementation

**File**: `frontend/src/lib/auth/actions.ts`

```typescript
'use server'

import { cookies } from 'next/headers'
import { jwtDecode } from 'jwt-decode'

interface JWTPayload {
  user_id: string
  email: string
  exp: number
}

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth-token')

  if (!authToken?.value) {
    return null
  }

  try {
    const decoded = jwtDecode<JWTPayload>(authToken.value)
    if (decoded.exp * 1000 < Date.now()) {
      return null
    }
    return decoded.user_id
  } catch {
    return null
  }
}
```

### ApiClient Responsibilities

| Responsibility | Implementation |
|----------------|----------------|
| Obtain user_id | Call `getUserId()` Server Action on init |
| Construct API paths | Interpolate user_id: `/api/${userId}/tasks` |
| Include credentials | `fetch(..., { credentials: 'include' })` |
| Handle 401 | Dispatch `session-expired` event, trigger draft save |
| Error handling | Parse error responses, throw typed errors |

### Security Properties

- **JWT never in client bundle**: HttpOnly cookie; client only sees user_id string
- **No client-side JWT decode**: Server Action performs decode on server
- **Path validation**: Backend verifies JWT.user_id matches path user_id
- **XSS protection**: Even if attacker has XSS, they cannot steal JWT

---

## Design System: "Clean Light Mode"

### Color Palette

**Background Colors**:
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `bg-primary` | `bg-white` | `#ffffff` | Main content areas, cards |
| `bg-secondary` | `bg-slate-50` | `#f8fafc` | Sidebar, page background |
| `bg-tertiary` | `bg-slate-100` | `#f1f5f9` | Hover states, input backgrounds |

**Text Colors**:
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `text-primary` | `text-slate-900` | `#0f172a` | Headings, primary content |
| `text-secondary` | `text-slate-600` | `#475569` | Body text, descriptions |
| `text-muted` | `text-slate-400` | `#94a3b8` | Placeholders, disabled text |

**Accent Colors**:
| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| `accent-primary` | `bg-blue-600` | `#2563eb` | Primary buttons, active states |
| `accent-hover` | `bg-blue-700` | `#1d4ed8` | Button hover states |
| `accent-light` | `bg-blue-50` | `#eff6ff` | Selected items, highlights |
| `accent-ring` | `ring-blue-500` | `#3b82f6` | Focus rings |

**Semantic Colors**:
| Token | Tailwind Class | Usage |
|-------|---------------|-------|
| `success` | `text-green-600` / `bg-green-50` | Completed tasks, success messages |
| `warning` | `text-amber-600` / `bg-amber-50` | Medium priority, warnings |
| `error` | `text-red-600` / `bg-red-50` | High priority, error states |
| `info` | `text-blue-600` / `bg-blue-50` | Low priority, informational |

### Typography

**Font Families** (unchanged from original):
- **Headings**: `Playfair Display` (serif) - Page titles, section headers
- **Body/UI**: `Inter` (sans-serif) - All other text, buttons, inputs

**Font Scale**:
| Element | Size | Weight | Class |
|---------|------|--------|-------|
| Page Title | 32px | 700 | `text-3xl font-bold font-serif` |
| Section Header | 24px | 600 | `text-2xl font-semibold` |
| Card Title | 18px | 600 | `text-lg font-semibold` |
| Body Text | 14px | 400 | `text-sm` |
| Small/Caption | 12px | 400 | `text-xs text-slate-500` |

### Component Styling

**Cards**:
```css
.card {
  @apply bg-white rounded-lg border border-slate-200 shadow-sm;
}
.card:hover {
  @apply shadow-md;
}
```

**Buttons**:
```css
.btn-primary {
  @apply bg-blue-600 text-white rounded-lg px-4 py-2 font-medium;
  @apply hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
.btn-secondary {
  @apply bg-white text-slate-700 border border-slate-300 rounded-lg px-4 py-2;
  @apply hover:bg-slate-50 focus:ring-2 focus:ring-blue-500;
}
.btn-ghost {
  @apply text-slate-600 px-4 py-2 rounded-lg;
  @apply hover:bg-slate-100;
}
```

**Form Inputs**:
```css
.input {
  @apply w-full px-3 py-2 border border-slate-300 rounded-lg;
  @apply bg-white text-slate-900 placeholder:text-slate-400;
  @apply focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none;
}
.input-error {
  @apply border-red-500 focus:border-red-500 focus:ring-red-500/20;
}
```

**Sidebar**:
```css
.sidebar {
  @apply bg-slate-50 border-r border-slate-200 w-64;
}
.sidebar-item {
  @apply px-4 py-2 text-slate-600 rounded-lg mx-2;
  @apply hover:bg-slate-100 hover:text-slate-900;
}
.sidebar-item-active {
  @apply bg-blue-50 text-blue-700 font-medium;
}
```

### Spacing & Layout

**Container**:
- Max width: `max-w-7xl`
- Padding: `px-4 sm:px-6 lg:px-8`

**Card Grid**:
- Gap: `gap-4` or `gap-6`
- Responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

**Shadows**:
| Usage | Class |
|-------|-------|
| Cards (default) | `shadow-sm` |
| Cards (hover) | `shadow-md` |
| Dropdowns/Modals | `shadow-lg` |
| Elevated elements | `shadow-xl` |

### Animation Patterns

**Transitions** (subtle, professional):
- Duration: `duration-150` or `duration-200`
- Easing: `ease-in-out`
- Properties: `transition-colors`, `transition-shadow`, `transition-all`

**Framer Motion** (where needed):
- Spring physics for checkboxes: `{ type: "spring", stiffness: 300, damping: 20 }`
- Fade-in for lists: `{ opacity: [0, 1], y: [10, 0] }`
- Stagger: `0.05s` delay between items

---

## Authentication Architecture (Revised)

### Route Structure

**Public Routes** (no auth required):
- `/login` - Login form page
- `/signup` - Registration form page
- `/api/auth/*` - Better Auth API endpoints

**Protected Routes** (auth required):
- `/(dashboard)/*` - All dashboard routes

### Client-Side Route Protection

**Implementation Strategy**: Use a client-side `AuthGuard` component in the dashboard layout

```text
(dashboard)/layout.tsx
├── AuthGuard (Client Component)
│   ├── Check session via Better Auth useSession hook
│   ├── If loading: Show skeleton/spinner
│   ├── If unauthenticated: redirect('/login')
│   └── If authenticated: render children
└── DashboardShell
    ├── Sidebar
    ├── Topbar ("TaskFlow" branding)
    └── {children}
```

**AuthGuard Component Behavior**:
```typescript
'use client'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, status } = useSession()  // Better Auth hook
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  if (status === 'unauthenticated') {
    return null  // Will redirect
  }

  return <>{children}</>
}
```

### Login Page Design

**Route**: `/login`

**Layout**: Centered card on light gray background

**Components**:
- TaskFlow logo/name (top)
- Email input with validation
- Password input with show/hide toggle
- "Sign In" primary button
- "Forgot password?" link (optional)
- "Don't have an account? Sign up" link to `/signup`
- Error message display (inline)

**States**:
| State | Visual |
|-------|--------|
| Default | Clean form, blue "Sign In" button |
| Loading | Button shows spinner, inputs disabled |
| Error | Red border on invalid fields, error message below |
| Success | Redirect to `/(dashboard)` |

### Signup Page Design

**Route**: `/signup`

**Layout**: Same as login (centered card)

**Components**:
- TaskFlow logo/name (top)
- Name input
- Email input with validation
- Password input with requirements hint
- Confirm password input
- "Create Account" primary button
- "Already have an account? Sign in" link to `/login`
- Error message display (inline)

**Validation Rules**:
- Email: Valid format
- Password: Minimum 8 characters
- Confirm password: Must match

---

## Rebranding: Command Center → TaskFlow

### Terminology Updates

| Original | Revised |
|----------|---------|
| Command Center | TaskFlow |
| Mission Control | My Tasks |
| Control Panel | Dashboard |
| Operatives | N/A (removed) |
| Intel | Insights (optional) |

### UI Text Changes

**Topbar**:
- Logo/Name: "TaskFlow"
- Page title: "My Tasks" (main dashboard), "Settings" (settings page)

**Sidebar Navigation**:
- "Dashboard" or "My Tasks"
- "Create Task" or "+ New Task"
- "Settings"
- "Sign Out"

**Empty States**:
- "No tasks yet. Create your first task to get started."

**Welcome Message**:
- "Welcome back, {name}"

**Metric Cards**:
- "Total Tasks"
- "Completed"
- "In Progress"
- "Overdue"

## Technical Context

**Language/Version**:
- Frontend: TypeScript 5.0+ (strict mode), Node.js 20+
- Backend: Python 3.13+ (already implemented)

**Primary Dependencies**:
- Frontend: Next.js 16 (App Router), React 19 (RSC + useOptimistic), Tailwind CSS v4, Better Auth client, shadcn/ui, Framer Motion, Lucide icons
- Backend: FastAPI (existing), SQLModel (existing), Better Auth JWT verification (existing)

**Storage**:
- Neon PostgreSQL (existing backend)
- Client-side: HttpOnly cookies (JWT tokens), localStorage (draft recovery)

**Testing**:
- Frontend: Vitest + React Testing Library
- Backend: pytest (existing infrastructure)
- Contract: OpenAPI schema validation

**Target Platform**:
- Web browsers (Chrome, Firefox, Safari, Edge - last 2 years)
- Mobile responsive (320px-428px width)
- Desktop (collapsible sidebar UX)

**Project Type**: Web application (frontend + backend)

**Performance Goals**:
- 0px Cumulative Layout Shift (CLS)
- < 100ms optimistic update latency
- < 5s sign-in to dashboard load
- < 50ms skeleton loader render
- Support 1000+ concurrent authenticated users

**Constraints**:
- BETTER_AUTH_SECRET never exposed to client bundle
- JWT tokens stored exclusively in HttpOnly cookies
- All API requests must include user_id in path: `/api/{user_id}/tasks`
- Frontend cannot directly import backend code (tier isolation)
- Zero manual coding (all AI-generated via Claude Code)

**Scale/Scope**:
- Single-page dashboard application
- ~5-8 React components (atomic design)
- 1 centralized API client utility
- Tailwind v4 design token system
- Integration with 5 existing FastAPI endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Multi-Tier Isolation
- **Status**: COMPLIANT
- **Evidence**: Frontend code will reside in `/frontend/`, backend exists in `/backend/`
- **Note**: No cross-tier imports; communication via REST API only

### ✅ II. Persistence First
- **Status**: COMPLIANT (Backend already implements)
- **Evidence**: Backend uses SQLModel with Neon PostgreSQL; task data persists via existing endpoints
- **Note**: Frontend relies on backend persistence, no frontend-only data storage

### ✅ III. Secure by Design
- **Status**: COMPLIANT (Backend already implements)
- **Evidence**: Backend enforces JWT auth via Better Auth; user_id path scoping prevents cross-user access
- **Frontend Responsibility**: Store JWT in HttpOnly cookies; obtain user_id via Server Action (not client-side decode)
- **Note**: Server Action reads HttpOnly cookie server-side, decodes JWT, returns user_id to client for API path construction

### ✅ IV. Zero Manual Coding
- **Status**: COMPLIANT
- **Evidence**: All code generated via Claude Code `/sp.*` commands
- **Tracking**: PHR records maintained for all sessions

### ⚠️ V. Test-First Discipline
- **Status**: ADVISORY (SHOULD, not MUST)
- **Approach**: Contract tests for frontend-backend integration; component tests for UI; E2E tests for user journeys
- **Note**: Will define test structure in Phase 1

### ✅ VI. API Contract Enforcement
- **Status**: COMPLIANT (Backend already implements)
- **Evidence**: FastAPI auto-generates OpenAPI schema; existing endpoints follow REST conventions
- **Frontend Responsibility**: Strictly adhere to existing TaskCreate, TaskRead, TaskUpdate, TaskList schemas

**Overall Gate Status**: ✅ PASS - All MUST requirements met, proceeding to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/004-modern-ui-ux-dashboard/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   ├── task-api.yaml           # OpenAPI spec for task endpoints
│   ├── better-auth-flow.md     # JWT authentication contract
│   └── frontend-backend-types.ts  # TypeScript type definitions from backend schemas
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/                      # NEW - Created by this feature
├── src/
│   ├── app/                  # Next.js 16 App Router
│   │   ├── login/
│   │   │   └── page.tsx             # Public login page (Better Auth form)
│   │   ├── signup/
│   │   │   └── page.tsx             # Public signup page (Better Auth form)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # Dashboard layout with client-side auth protection
│   │   │   └── page.tsx             # Main dashboard view ("My Tasks")
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...better-auth]/route.ts  # Better Auth API routes
│   │   ├── layout.tsx               # Root layout (fonts, providers)
│   │   └── globals.css              # Tailwind imports + Clean Light Mode tokens
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives (Button, Card, etc.)
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx        # Email/password login with Better Auth
│   │   │   ├── SignupForm.tsx       # Registration form with validation
│   │   │   └── AuthGuard.tsx        # Client-side route protection component
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Light theme sidebar (desktop)
│   │   │   ├── Topbar.tsx           # Top navigation with "TaskFlow" branding
│   │   │   └── MobileNav.tsx        # Bottom nav (mobile)
│   │   ├── dashboard/
│   │   │   ├── MetricsGrid.tsx      # Analytics cards ("My Tasks" overview)
│   │   │   ├── TaskStream.tsx       # Main task feed with optimistic updates
│   │   │   ├── TaskItem.tsx         # Individual task row
│   │   │   └── TaskForm.tsx         # Create/edit task form
│   │   └── atoms/
│   │       ├── ShimmerSkeleton.tsx  # Loading placeholders (light theme)
│   │       ├── PrimaryButton.tsx    # Styled button (blue accent)
│   │       └── AnimatedCheckbox.tsx # Checkbox with spring animation
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts            # ApiClient with user_id path interpolation (from Server Action)
│   │   │   ├── tasks.ts             # Task API methods (create, list, update, delete, toggle)
│   │   │   └── types.ts             # TypeScript types matching backend schemas
│   │   ├── auth/
│   │   │   ├── better-auth.ts       # Better Auth client configuration
│   │   │   ├── actions.ts           # Server Action: getUserId() - reads HttpOnly cookie server-side
│   │   │   └── useSession.ts        # Client-side session hook for auth protection
│   │   ├── hooks/
│   │   │   ├── use-optimistic-task.ts   # useOptimistic wrapper for task mutations
│   │   │   ├── use-draft-recovery.ts    # localStorage draft save/restore
│   │   │   └── use-concurrent-update.ts # Detect cross-device updates
│   │   └── utils/
│   │       └── cn.ts                # className utility (shadcn standard)
│   └── styles/
│       └── tailwind.config.ts       # Clean Light Mode design tokens
├── public/
│   └── fonts/
│       ├── Inter/                   # Inter variable font
│       └── PlayfairDisplay/         # Playfair Display for headers
├── tests/
│   ├── components/
│   │   ├── TaskStream.test.tsx     # Optimistic update tests
│   │   └── MetricsGrid.test.tsx    # Metrics display tests
│   ├── integration/
│   │   ├── api-client.test.ts      # ApiClient JWT injection tests
│   │   └── auth-flow.test.ts       # Better Auth integration tests
│   └── e2e/
│       └── dashboard.spec.ts       # End-to-end user journey tests
├── .env.local                      # Environment variables (NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET)
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Dependencies
├── tsconfig.json                   # TypeScript configuration (strict mode)
└── tailwind.config.ts              # Tailwind CSS v4 configuration

backend/                      # EXISTING - Modified for priority field
├── src/
│   ├── models/
│   │   └── task.py                 # ADD: priority field (High, Medium, Low enum)
│   ├── schemas/
│   │   └── task.py                 # ADD: priority to TaskCreate, TaskUpdate, TaskRead
│   ├── api/v1/
│   │   └── tasks.py                # ADD: metrics endpoint GET /api/{user_id}/tasks/metrics
│   └── services/
│       └── task_service.py         # ADD: get_metrics method for analytics
└── alembic/versions/
    └── XXXX_add_priority_field.py  # NEW migration for priority column
```

**Structure Decision**: Web application (Option 2 from template) with frontend tier added. Backend already exists with complete authentication and task CRUD infrastructure. Frontend will be a greenfield Next.js 16 application with App Router, following atomic design principles for component hierarchy.

## Complexity Tracking

> No constitution violations detected. Table intentionally left empty.

---

## Phase 0: Research & Technology Evaluation

**Objective**: Resolve all "NEEDS CLARIFICATION" items from Technical Context and establish best practices for each technology choice.

### Research Tasks

1. **Better Auth Client Integration with HttpOnly Cookies**
   - **Question**: How does Better Auth client SDK work with HttpOnly cookies in Next.js 16 App Router?
   - **Why**: FR-001a requires HttpOnly cookie storage; need to verify Better Auth supports this in Next.js server components

2. **React 19 useOptimistic Hook Patterns**
   - **Question**: What are the best practices for using `useOptimistic` with async API calls and rollback on error?
   - **Why**: FR-005 requires optimistic updates; FR-016 requires rollback with inline error display

3. **Next.js 16 App Router Authentication Middleware**
   - **Question**: How should we protect dashboard routes and redirect unauthenticated users to sign-in?
   - **Why**: FR-014 requires redirect for unauthenticated access

4. **Server Action User ID Extraction Pattern** ✅ RESOLVED
   - **Question**: How can client-side code obtain user_id when JWT is in HttpOnly cookies?
   - **Answer**: Use Next.js Server Action to read cookie server-side, decode JWT, return user_id string to client
   - **Why**: FR-003 requires path construction with user_id; Server Action pattern preserves HttpOnly security

5. **Tailwind CSS v4 Design Token System**
   - **Question**: What is the syntax for defining custom design tokens in Tailwind v4 configuration?
   - **Why**: FR-007, FR-008, FR-009 require "Clean Light Mode" palette, subtle styling utilities, custom fonts
   - **REVISED**: Focus on light theme tokens (white/slate backgrounds, blue accents) instead of dark glassmorphism

6. **Server Actions vs Client-Side API Calls**
   - **Question**: Should we use Next.js 19+ Server Actions or client-side fetch for task mutations?
   - **Why**: User prompt mentions "Server Actions" but React 19 `useOptimistic` typically works with client-side state

7. **Framer Motion with React Server Components**
   - **Question**: Can Framer Motion animations work in Server Components or must they be in Client Components?
   - **Why**: FR-011 requires staggered animations; need to understand RSC boundaries

8. **localStorage Draft Recovery During Session Expiry**
   - **Question**: How can we detect session expiry before redirect and save form state to localStorage?
   - **Why**: FR-015 requires draft saving before redirect; need to hook into token expiry detection

9. **shadcn/ui Customization for Glassmorphism**
   - **Question**: What's the recommended approach for overriding shadcn/ui component styles globally?
   - **Why**: FR-010 requires customized border-radius and shadows for all primitives

10. **Concurrent Edit Detection via Polling or WebSockets**
    - **Question**: Should we use polling, WebSockets, or Server-Sent Events for detecting cross-device updates?
    - **Why**: FR-019a requires visual indicator when task updated elsewhere; need lightweight approach

### Research Output Location

All findings will be consolidated in:
```
specs/004-modern-ui-ux-dashboard/research.md
```

Each research task will produce:
- **Decision**: Technology/pattern chosen
- **Rationale**: Why it's the best fit for this feature
- **Alternatives Considered**: Other options evaluated and why they were rejected
- **Implementation Notes**: Key takeaways for Phase 1 design

---

## Phase 1: Data Model & API Contracts

**Prerequisite**: Phase 0 research complete

### 1.1 Data Model Enhancements

**File**: `specs/004-modern-ui-ux-dashboard/data-model.md`

#### Backend Schema Modifications

**Task Model Enhancement** (backend/src/models/task.py):
```python
# ADD priority field
priority: str = Field(default="Medium", nullable=False)
# Constraint: Must be one of ["High", "Medium", "Low"]
```

**TaskMetrics Entity** (NEW - computed, not stored):
```typescript
interface TaskMetrics {
  total: number
  completed: number
  pending: number
  overdue: number
  high_priority: number
  medium_priority: number
  low_priority: number
}
```

#### Frontend-Only State Models

**OptimisticTask** (extends TaskRead):
```typescript
interface OptimisticTask extends TaskRead {
  _optimistic: boolean        // True if not yet confirmed by server
  _error: string | null       // Inline error message if mutation failed
}
```

**DraftTask** (localStorage schema):
```typescript
interface DraftTask {
  title: string
  description: string | null
  priority: "High" | "Medium" | "Low"
  timestamp: number          // When draft was saved
}
```

### 1.2 API Contract Documentation

**File**: `specs/004-modern-ui-ux-dashboard/contracts/task-api.yaml`

Generate OpenAPI 3.0 spec from existing FastAPI endpoints PLUS new metrics endpoint:

**NEW Endpoint**:
```yaml
GET /api/{user_id}/tasks/metrics
  Summary: Get aggregated task statistics
  Responses:
    200: TaskMetrics object
    401: Unauthorized
    403: Forbidden (user_id mismatch)
```

**Existing Endpoints** (document from backend/src/api/v1/tasks.py):
- POST /api/{user_id}/tasks
- GET /api/{user_id}/tasks
- GET /api/{user_id}/tasks/{id}
- PUT /api/{user_id}/tasks/{id}
- PATCH /api/{user_id}/tasks/{id}/complete
- DELETE /api/{user_id}/tasks/{id}

**File**: `specs/004-modern-ui-ux-dashboard/contracts/better-auth-flow.md`

Document JWT authentication contract:
- Token acquisition via Better Auth sign-in
- HttpOnly cookie storage (name: `auth-token`)
- JWT payload structure: `{ user_id: UUID, exp: timestamp, ... }`
- Authorization header format: `Bearer <token>`
- Token expiry handling and draft recovery

**File**: `specs/004-modern-ui-ux-dashboard/contracts/frontend-backend-types.ts`

TypeScript type definitions matching backend Pydantic schemas:
```typescript
// Generated from backend/src/schemas/task.py
export interface TaskCreate {
  title: string
  description: string | null
  priority: "High" | "Medium" | "Low"
}

export interface TaskUpdate {
  title: string
  description: string | null
  is_completed: boolean
  priority: "High" | "Medium" | "Low"
}

export interface TaskRead {
  id: string  // UUID as string
  title: string
  description: string | null
  is_completed: boolean
  created_at: string  // ISO 8601
  user_id: string     // UUID as string
  priority: "High" | "Medium" | "Low"
}

export interface TaskList {
  items: TaskRead[]
  count: number
}
```

### 1.3 Component Architecture

**File**: `specs/004-modern-ui-ux-dashboard/data-model.md` (Component Hierarchy section)

```text
App Shell (Server Component)
├── RootLayout
│   ├── Fonts (Inter, Playfair Display)
│   ├── Tailwind Global Styles
│   └── Better Auth Provider
│
├── (auth) Route Group
│   ├── AuthLayout (no sidebar)
│   └── SignInPage (Better Auth form)
│
└── (dashboard) Route Group
    ├── DashboardLayout (Client Component - Sidebar + Topbar)
    │   ├── Sidebar (Client - glassmorphism, collapsible)
    │   ├── Topbar (Client - user menu, notifications)
    │   └── MobileNav (Client - sticky bottom nav)
    │
    └── DashboardPage (Server Component - Suspense boundaries)
        ├── <Suspense fallback={<MetricsGridSkeleton />}>
        │   └── MetricsGrid (Client Component - fetches metrics)
        │       └── MetricCard (atomic) x4
        │
        └── <Suspense fallback={<TaskStreamSkeleton />}>
            └── TaskStream (Client Component - useOptimistic)
                ├── TaskForm (Client - optimistic create)
                ├── TaskItem (Client - optimistic update/delete) x N
                │   ├── AnimatedCheckbox
                │   ├── LuxuryButton (edit/delete)
                │   └── InlineError (if optimistic update failed)
                └── EmptyState (if no tasks)
```

### 1.4 State Flow Architecture

**File**: `specs/004-modern-ui-ux-dashboard/data-model.md` (State Management section)

**Optimistic Update Flow**:
```text
1. User Action (e.g., toggles checkbox)
   ↓
2. useOptimistic updates local state IMMEDIATELY
   → UI reflects change within <100ms (SC-002)
   ↓
3. ApiClient sends mutation to FastAPI
   POST/PUT/PATCH/DELETE /api/{user_id}/tasks/{id}
   ↓
4a. Success Response:
    → Server confirms change
    → useOptimistic reconciles with server state
    → Optimistic indicator removed
    ↓
4b. Error Response:
    → Server rejects change
    → useOptimistic ROLLS BACK to pre-mutation state
    → InlineError displayed below affected task (FR-016)
    → Retry button offered
```

**Session Expiry Flow**:
```text
1. Token Expiry Detected (ApiClient 401 response)
   ↓
2. useDraftRecovery hook saves current form state to localStorage
   → Key: `draft-task-${user_id}`
   ↓
3. Redirect to /login (FR-015)
   ↓
4. User Re-Authenticates
   ↓
5. Redirect to /(dashboard)
   ↓
6. useDraftRecovery detects stored draft
   ↓
7. Modal prompts: "Restore unsaved work?" [Yes] [Discard]
   ↓
8. If Yes: Pre-fill TaskForm with draft data
```

### 1.5 Quickstart Guide

**File**: `specs/004-modern-ui-ux-dashboard/quickstart.md`

```markdown
# Modern UI/UX Dashboard Quickstart

## Prerequisites
- Node.js 20+
- Backend running at http://localhost:8000
- Better Auth configured with shared BETTER_AUTH_SECRET

## 1. Install Dependencies
```bash
cd frontend
npm install
```

## 2. Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=<same-as-backend>
BETTER_AUTH_URL=http://localhost:3000
```

## 3. Run Development Server
```bash
npm run dev
```
Visit http://localhost:3000

## 4. Test Authentication
1. Navigate to http://localhost:3000/login
2. Enter credentials (Better Auth provider)
3. On success, redirected to /(dashboard)
4. JWT stored in HttpOnly cookie automatically

## 5. Test Optimistic Updates
1. Create a task (appears instantly)
2. Toggle completion (checkbox animates immediately)
3. Observe < 100ms perceived latency (SC-002)

## 6. Test Draft Recovery
1. Start creating a task (fill title field)
2. Wait for session expiry (~15 min) OR clear cookies
3. Redirect to sign-in
4. Re-authenticate
5. See "Restore unsaved work?" modal

## Architecture Overview
- Next.js 16 App Router (frontend/src/app)
- React Server Components for shell
- Client Components for interactive features
- ApiClient utility (frontend/src/lib/api/client.ts)
- Tailwind v4 design tokens (frontend/tailwind.config.ts)
```

### 1.6 Agent Context Update

Run agent context updater:
```bash
.specify/scripts/bash/update-agent-context.sh claude
```

This will add Next.js 16, React 19, Tailwind CSS v4, Better Auth client to Claude's project context.

---

## Phase 2 Preview: Task Generation Readiness

Phase 2 (`/sp.tasks`) will generate dependency-ordered implementation tasks from this plan. The following task categories are anticipated:

1. **Frontend Project Initialization** (1-2 tasks)
   - Bootstrap Next.js 16 with App Router
   - Configure Tailwind CSS v4 with "Clean Light Mode" tokens
   - Install dependencies (Better Auth, shadcn/ui, Framer Motion)

2. **Backend Schema Enhancement** (1 task)
   - Add `priority` field to Task model
   - Create Alembic migration
   - Update TaskCreate/TaskUpdate/TaskRead schemas

3. **Backend Metrics Endpoint** (1 task)
   - Implement `GET /api/{user_id}/tasks/metrics` endpoint
   - Add `get_metrics` method to task_service

4. **API Client Utility** (1-2 tasks)
   - Build ApiClient with JWT injection
   - Implement path interpolation for user_id
   - Add error handling (401 → draft save + redirect to `/login`)

5. **Authentication Pages & Protection** (3-4 tasks)
   - Configure Better Auth client
   - Implement `/login` page with email/password form
   - Implement `/signup` page with registration form
   - Build `AuthGuard` component for client-side route protection

6. **Dashboard Layout** (2-3 tasks)
   - Build Sidebar with "TaskFlow" branding, Topbar ("My Tasks"), MobileNav
   - Apply light theme styling (white/slate backgrounds, blue accents)
   - Add responsive breakpoints

7. **Metrics Grid** (1-2 tasks)
   - Build MetricsGrid component
   - Fetch data from metrics endpoint
   - Add ShimmerSkeleton loaders

8. **Task Stream with Optimistic Updates** (3-5 tasks)
   - Build TaskStream + TaskItem components
   - Implement useOptimistic hook integration
   - Add inline error display with retry
   - Implement draft recovery hook
   - Add concurrent update detection

9. **Visual Polish** (2-3 tasks)
   - Framer Motion animations (subtle, professional)
   - AnimatedCheckbox with spring physics
   - PrimaryButton component (blue accent styling)
   - Typography (Inter + Playfair Display)

10. **Testing** (2-4 tasks)
    - Component tests (TaskStream, MetricsGrid)
    - Integration tests (ApiClient, auth flow)
    - E2E tests (user journeys)

**Estimated Total Tasks**: 18-28 tasks

**Critical Path**:
Backend Priority Field → ApiClient → Authentication → Dashboard Layout → TaskStream → Optimistic Updates → Visual Polish

---

## Risk Analysis

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Better Auth + HttpOnly cookies incompatibility with Next.js 16 | HIGH | LOW | Phase 0 research will validate compatibility; fallback to session cookies if needed |
| useOptimistic rollback complexity with nested state | MEDIUM | MEDIUM | Implement atomic task updates; keep optimistic state flat |
| JWT user_id extraction with HttpOnly cookies | HIGH | LOW | ✅ MITIGATED: Server Action pattern implemented - `getUserId()` reads cookie server-side, returns user_id string to client |
| Tailwind v4 breaking changes from v3 | MEDIUM | LOW | Review Tailwind v4 migration guide in Phase 0; most utility classes stable |
| 0px CLS goal unachievable with dynamic content | MEDIUM | MEDIUM | Pre-allocate space with skeleton loaders; avoid layout shifts via fixed heights |
| Concurrent edit detection performance overhead | LOW | LOW | Implement polling at 30s intervals; only fetch when tab is active |

---

## Success Validation

After implementation, the following validation steps confirm spec adherence:

1. **Performance Benchmarks** (SC-001 to SC-003, SC-009):
   - Lighthouse CI: CLS = 0px
   - Chrome DevTools: Optimistic update latency < 100ms
   - Network throttling: Sign-in to dashboard < 5s

2. **Security Audit** (SC-004, SC-005):
   - Verify JWT in HttpOnly cookies (not localStorage/sessionStorage)
   - Attempt URL manipulation to access other user's tasks (expect 403)
   - Check BETTER_AUTH_SECRET not in client bundle

3. **Visual Regression** (SC-008):
   - Percy/Chromatic screenshots across browsers
   - Verify "Clean Light Mode" theme renders correctly on Chrome, Firefox, Safari, Edge

4. **Mobile Responsiveness** (SC-006):
   - Test on physical devices (320px to 428px width)
   - Verify bottom navigation thumb reach

5. **User Acceptance** (SC-010):
   - Manual testing of primary flows (create, update, complete, delete)
   - Verify 90% task success rate (monitored via analytics if available)

---

## Next Steps

1. **Complete Phase 0 Research**: Dispatch research agents to resolve all 10 research questions
2. **Consolidate Findings**: Write `research.md` with decisions and rationale
3. **Generate Artifacts**: Create `data-model.md`, `contracts/`, `quickstart.md`
4. **Update Agent Context**: Run update script to inform Claude of new technologies
5. **Ready for `/sp.tasks`**: Plan is complete; proceed to task generation phase

**Command to Execute**: Run `/sp.tasks` after approving this plan to generate implementation tasks.
