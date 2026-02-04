# Tasks: TaskFlow Dashboard Pivot

**Input**: Design documents from `/specs/004-modern-ui-ux-dashboard/`
**Prerequisites**: plan.md (revised 2026-02-02), spec.md, data-model.md, contracts/
**Pivot Focus**: Transform from "Command Center" (dark mode) to "TaskFlow" (Clean Light Mode)

**Agent Assignments**:
- `ui-structure-architect`: Architecture & Global Proxy (Phases 1-2)
- `ui-interaction-designer`: Authentication & Task UI (Phases 3-5)
- `ui-ux-futuristic-designer`: Visual Polish & Animations (Phase 6)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` for Next.js, `backend/` for FastAPI
- All paths relative to `/Phase II/`

---

## Phase 1: Architecture & Route Restructuring

**Purpose**: Refactor folder structure to support standalone public `/login` and `/signup` routes
**Agent**: `ui-structure-architect`

### Route Migration

- [X] T001 [P] Create standalone `/login` route at `frontend/app/login/page.tsx` (public, no auth required)
- [X] T002 [P] Create standalone `/signup` route at `frontend/app/signup/page.tsx` (public, no auth required)
- [X] T003 [P] Create shared auth layout at `frontend/app/(auth-pages)/layout.tsx` for login/signup pages (centered card, light background)
- [X] T004 Remove deprecated `frontend/app/(auth)/sign-in/` directory (migrated to /login)
- [X] T005 Remove deprecated `frontend/app/(auth)/layout.tsx` (replaced by (auth-pages))

### Client-Side Route Protection

- [X] T006 Create `AuthGuard` component at `frontend/components/auth/AuthGuard.tsx` (checks session, redirects to /login)
- [X] T007 Create `useSession` hook at `frontend/lib/auth/useSession.ts` (wraps Better Auth session hook)
- [X] T008 Update `frontend/app/(dashboard)/layout.tsx` to wrap children with `AuthGuard` component
- [X] T009 Create `DashboardSkeleton` component at `frontend/components/layout/DashboardSkeleton.tsx` (loading state for auth check)

**Checkpoint**: Route structure migrated to /login and /signup with client-side protection

---

## Phase 2: Design System - "Slate & Snow" Light Mode

**Purpose**: Establish "Clean Light Mode" design tokens replacing "Midnight Stone" dark theme
**Agent**: `ui-structure-architect`

### Tailwind Configuration

- [X] T010 Update `frontend/tailwind.config.ts` with Clean Light Mode color palette:
  - Primary White (#ffffff), Secondary Slate (#f8fafc), Tech Blue (#2563eb)
  - Remove stone-950, stone-900, amber-500 dark theme tokens
- [X] T011 Update `frontend/app/globals.css` to remove dark theme CSS custom properties and add light theme tokens
- [X] T012 [P] Update CSS utility classes in `frontend/app/globals.css`:
  - `.card` → `bg-white rounded-lg border border-slate-200 shadow-sm`
  - `.btn-primary` → `bg-blue-600 text-white hover:bg-blue-700`
  - `.input` → `border-slate-300 focus:ring-blue-500`

### Branding Updates

- [X] T013 Update `frontend/components/layout/Sidebar.tsx`:
  - Change logo/title from "Command Center" to "TaskFlow"
  - Apply `bg-slate-50 border-r border-slate-200` styling
- [X] T014 Update `frontend/components/layout/Topbar.tsx`:
  - Change page title from "Mission Control" to "My Tasks"
  - Apply light theme styling with `text-slate-900` typography
- [X] T015 [P] Update `frontend/components/layout/MobileNav.tsx` with light theme styling

### Atom Component Updates

- [X] T016 Rename `frontend/components/atoms/LuxuryButton.tsx` to `frontend/components/atoms/PrimaryButton.tsx`
- [X] T017 Update `frontend/components/atoms/PrimaryButton.tsx` styling:
  - `bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-blue-500`
- [X] T018 [P] Update `frontend/components/atoms/ShimmerSkeleton.tsx`:
  - Change from dark theme to `bg-slate-200 animate-pulse`
- [X] T019 [P] Update `frontend/components/atoms/AnimatedCheckbox.tsx` with blue accent colors

**Checkpoint**: Design system fully migrated to Clean Light Mode

---

## Phase 3: User Story 1 - Authenticated Dashboard Access (Priority: P1) 🎯 MVP

**Goal**: Users can securely sign in via /login and access their personalized dashboard
**Agent**: `ui-interaction-designer`

**Independent Test**: Navigate to /login, enter credentials, verify redirect to dashboard with "My Tasks" header

### Authentication Forms

- [X] T020 [US1] Create `LoginForm` component at `frontend/components/auth/LoginForm.tsx`:
  - Email/password inputs with light theme styling
  - Better Auth `useSignIn` hook integration
  - Loading state with spinner on submit button
  - Inline error display below form
  - "Sign up" link to `/signup`
- [X] T021 [US1] Create `SignupForm` component at `frontend/components/auth/SignupForm.tsx`:
  - Name, email, password, confirm password inputs
  - Better Auth `useSignUp` hook integration
  - Validation feedback (password match, email format)
  - "Sign in" link to `/login`
- [X] T022 [US1] Implement `/login` page at `frontend/app/login/page.tsx`:
  - Bento grid layout with centered LoginForm
  - TaskFlow branding at top
  - Light gray background (`bg-slate-50`)
- [X] T023 [US1] Implement `/signup` page at `frontend/app/signup/page.tsx`:
  - Same Bento grid layout as login
  - SignupForm with validation

### Session Management

- [X] T024 [US1] Update `frontend/lib/auth/better-auth.ts` to configure Better Auth client with HttpOnly cookies
- [X] T025 [US1] Create `frontend/lib/auth/jwt-utils.ts` with `getUserIdFromJWT` server action
- [X] T026 [US1] Update `frontend/lib/api/client.ts` ApiClient to:
  - Intercept 401 responses and redirect to /login
  - Save draft to localStorage before redirect

### Dashboard Shell

- [X] T027 [US1] Update `frontend/app/(dashboard)/page.tsx`:
  - Display "Welcome back, {name}" with user from session
  - Apply light theme styling
- [X] T028 [US1] Update `frontend/app/(dashboard)/layout.tsx`:
  - Integrate AuthGuard wrapper
  - Apply sidebar + content layout with light theme

**Checkpoint**: US1 Complete - Users can sign in via /login and see their dashboard

---

## Phase 4: User Story 2 - Real-Time Task Overview (Priority: P1)

**Goal**: Users see task metrics (Total, Completed, Pending, Overdue) at a glance
**Agent**: `ui-interaction-designer`

**Independent Test**: Sign in, verify metric cards display with correct counts and light theme styling

### Metrics Components

- [X] T029 [US2] Update `frontend/components/dashboard/MetricsGrid.tsx`:
  - Apply light theme card styling (`bg-white border-slate-200 shadow-sm`)
  - Display "Total Tasks", "Completed", "In Progress", "Overdue" labels
- [X] T030 [P] [US2] Create `MetricCard` component at `frontend/components/dashboard/MetricCard.tsx`:
  - Large number display with `text-slate-900`
  - Icon with blue accent
  - Subtle shadow and rounded corners
- [X] T031 [US2] Update `frontend/components/atoms/ShimmerSkeleton.tsx` for light theme metrics skeleton
- [X] T032 [US2] Create empty state component at `frontend/components/dashboard/EmptyState.tsx`:
  - "No tasks yet. Create your first task to get started."
  - CTA button with blue accent

**Checkpoint**: US2 Complete - Metrics display with light theme styling

---

## Phase 5: User Story 3 - Instant Task Interaction (Priority: P1)

**Goal**: Create, update, complete tasks with immediate visual feedback via useOptimistic
**Agent**: `ui-interaction-designer`

**Independent Test**: Create task, verify it appears immediately; toggle completion, verify instant UI update

### Task Components

- [X] T033 [US3] Update `frontend/components/dashboard/TaskForm.tsx`:
  - Light theme input styling (`border-slate-300 focus:ring-blue-500`)
  - Priority dropdown (High=red, Medium=amber, Low=blue)
  - PrimaryButton with blue accent
- [X] T034 [US3] Update `frontend/components/dashboard/TaskItem.tsx`:
  - Rename from TaskCard if exists
  - Light theme card with `bg-white border-slate-200`
  - Playfair Display for task title
  - Inter for metadata
  - Priority badge with semantic colors
- [X] T035 [US3] Update `frontend/components/dashboard/TaskStream.tsx`:
  - Light theme container styling
  - Integration with useOptimistic hook

### Optimistic Updates

- [X] T036 [US3] Update `frontend/lib/hooks/use-optimistic-task.ts`:
  - Configure React 19 `useOptimistic` for task mutations
  - Handle rollback on server error
  - Set `_optimistic: true` flag on pending tasks
- [X] T037 [US3] Create inline error component at `frontend/components/dashboard/InlineError.tsx`:
  - Red text below affected item
  - Retry button with ghost styling
- [X] T038 [US3] Update `frontend/lib/hooks/use-draft-recovery.ts`:
  - Save form state to localStorage on 401
  - Restore draft after re-authentication with modal prompt

### API Integration

- [X] T039 [US3] Update `frontend/lib/api/tasks.ts`:
  - Ensure all endpoints use `/api/{user_id}/tasks` path
  - Extract user_id from JWT via server action
- [X] T040 [US3] Audit `frontend/lib/api/client.ts` for user-scoped path construction

**Checkpoint**: US3 Complete - Optimistic updates working with instant feedback

---

## Phase 6: Visual Polish & Animations

**Purpose**: Light-mode glassmorphism effects and celebratory animations
**Agent**: `ui-ux-futuristic-designer`

### Light-Mode Glassmorphism

- [X] T041 [P] [US4] Update sidebar with subtle backdrop blur:
  - `backdrop-blur-sm bg-slate-50/95 border-slate-200`
  - Maintain readability with high contrast text
- [X] T042 [P] [US4] Add glass effect to metric cards on hover:
  - `hover:shadow-md transition-shadow duration-200`
- [X] T043 [P] [US4] Apply subtle glass borders to task cards:
  - `border border-slate-200/80`

### Framer Motion Animations

- [X] T044 [US4] Create "Celebratory Pop" animation for task completion:
  - Blue-to-green transition on checkbox
  - Scale pop effect `{ scale: [1, 1.2, 1] }`
  - Spring physics `{ type: "spring", stiffness: 300, damping: 20 }`
- [X] T045 [US4] Implement staggered entrance for task list:
  - 50ms offset between items
  - Fade-in with `{ opacity: [0, 1], y: [10, 0] }`
- [X] T046 [P] [US4] Add smooth transitions to sidebar collapse/expand
- [X] T047 [P] [US4] Add hover animations to buttons and interactive elements

### Typography Refinement

- [X] T048 [US4] Ensure Playfair Display applied to:
  - Page titles ("My Tasks")
  - Section headers
  - Task titles in list
- [X] T049 [US4] Ensure Inter applied to:
  - Body text, buttons, inputs
  - Metadata (dates, counts)
  - Navigation items

**Checkpoint**: US4 Complete - Visual polish with light glassmorphism and animations

---

## Phase 7: User Story 5 - Mobile-First Navigation (Priority: P2)

**Goal**: Mobile users have accessible bottom navigation; desktop users have collapsible sidebar
**Agent**: `ui-interaction-designer`

**Independent Test**: Access dashboard on mobile, verify sticky bottom nav; on desktop, verify collapsible sidebar

- [X] T050 [US5] Update `frontend/components/layout/MobileNav.tsx`:
  - Sticky bottom navigation with light theme
  - Icon buttons for Dashboard, Create Task, Settings
  - Active state with blue accent
- [X] T051 [US5] Update `frontend/components/layout/Sidebar.tsx`:
  - Collapsible state with smooth animation
  - Collapse toggle button
  - Responsive hide on mobile (hidden below md breakpoint)
- [X] T052 [US5] Add responsive breakpoints in `frontend/app/(dashboard)/layout.tsx`:
  - Show sidebar on `md:` and above
  - Show MobileNav on mobile only

**Checkpoint**: US5 Complete - Mobile and desktop navigation working

---

## Phase 8: User Story 6 - User-Scoped Data Access (Priority: P1)

**Goal**: All API requests automatically scoped to authenticated user's ID
**Agent**: `ui-structure-architect`

**Independent Test**: Sign in as two different users, verify each only sees their own tasks

- [X] T053 [US6] Audit `frontend/lib/api/client.ts`:
  - Verify Authorization Bearer header injection
  - Verify user_id path interpolation
- [X] T054 [US6] Verify `frontend/lib/auth/jwt-utils.ts` extracts user_id correctly
- [X] T055 [US6] Test unauthorized access handling:
  - 401 → redirect to /login
  - 403 → display forbidden error

**Checkpoint**: US6 Complete - User data isolation verified

---

## Phase 9: Security & Verification

**Purpose**: Confirm HttpOnly cookie security and API contract adherence
**Agent**: `ui-structure-architect`

- [X] T056 Verify HttpOnly cookie configuration in `frontend/lib/auth/better-auth.ts`
- [X] T057 Audit all `fetch` calls for `credentials: 'include'` setting
- [X] T058 Verify CORS configuration allows frontend origin
- [X] T059 Confirm BETTER_AUTH_SECRET not exposed in client bundle (check build output)
- [X] T060 Run quickstart.md validation checklist

**Checkpoint**: Security verified - ready for deployment

---

## Phase 10: Public Landing Page & Auth Scoping

**Purpose**: Add public frontpage and scope auth middleware to /dashboard/** only
**Agent**: `ui-structure-architect`

**Goal**: Create a public landing page at / with Login/Sign Up CTAs; ensure unauthenticated users can access / without redirect

**Independent Test**: Visit / while logged out, verify landing page displays; visit /dashboard while logged out, verify redirect to /login

### Public Landing Page

- [X] T061 [US1] Create public landing page at `frontend/app/page.tsx`:
  - Hero section with TaskFlow branding
  - Feature highlights (Real-time metrics, Optimistic updates, Clean UI)
  - Call-to-action buttons for "Sign Up" (→ /signup) and "Log In" (→ /login)
  - Light theme styling with Clean Light Mode palette
- [X] T062 [P] [US1] Create `LandingHero` component at `frontend/components/landing/LandingHero.tsx`:
  - Large heading with Playfair Display
  - Subtitle with Inter
  - CTA buttons with blue accent
- [X] T063 [P] [US1] Create `FeaturesSection` component at `frontend/components/landing/FeaturesSection.tsx`:
  - Grid of feature cards
  - Icons from Lucide
  - Light glassmorphism styling
- [X] T064 [P] [US1] Create `LandingLayout` component at `frontend/app/(landing)/layout.tsx` (optional):
  - Minimal header with TaskFlow logo
  - Footer with links
  - No sidebar or auth protection

### Auth Middleware Scoping

- [X] T065 [US1] Update `frontend/app/(dashboard)/layout.tsx`:
  - Ensure AuthGuard ONLY applies to (dashboard)/** routes
  - Verify / (root) is NOT wrapped by AuthGuard
- [X] T066 [US1] Audit route structure to confirm:
  - `/` → public (no redirect)
  - `/login` → public (no redirect)
  - `/signup` → public (no redirect)
  - `/dashboard/**` → protected (redirect to /login if unauthenticated)
- [X] T067 [US1] Test auth scoping with manual navigation:
  - Logged out: / shows landing page
  - Logged out: /dashboard redirects to /login
  - Logged in: / shows landing page with "Go to Dashboard" CTA
  - Logged in: /dashboard shows dashboard

### Landing Page Enhancements

- [X] T068 [P] [US4] Add smooth scroll-to-features interaction on landing page
- [X] T069 [P] [US4] Add Framer Motion fade-in animations for hero and feature sections
- [X] T070 [US1] Update navigation in `frontend/components/layout/Topbar.tsx`:
  - If on landing page: Show "TaskFlow" logo only
  - If authenticated and on dashboard: Show full navigation

**Checkpoint**: Public landing page live; auth protection scoped to /dashboard/** only

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Routes) ──────────┐
                           ├──→ Phase 3 (US1: Auth)
Phase 2 (Design System) ───┘
                           ├──→ Phase 4 (US2: Metrics)
                           │
                           ├──→ Phase 5 (US3: Tasks)
                           │
                           └──→ Phase 8 (US6: Scoping)

Phase 6 (Polish) ← depends on Phase 3-5
Phase 7 (Mobile) ← depends on Phase 2
Phase 9 (Security) ← depends on all phases
Phase 10 (Landing Page) ← depends on Phase 1-2 (can parallelize with Phase 3+)
```

### Parallel Opportunities by Phase

**Phase 1**: T001, T002, T003 can run in parallel
**Phase 2**: T010-T012 sequential; T013-T015 can parallelize; T016-T019 can parallelize
**Phase 3-5**: Tasks within each phase follow model → service → component order
**Phase 6**: T041-T043 can parallelize; T046-T047 can parallelize

---

## Implementation Strategy

### MVP First (Phases 1-3)

1. Complete Phase 1: Route Restructuring
2. Complete Phase 2: Design System Migration
3. Complete Phase 3: User Story 1 (Authentication)
4. **STOP and VALIDATE**: Test login/signup flow with light theme
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1-2 → Foundation ready (light theme, new routes)
2. Add Phase 3 (US1) → Auth working → Deploy/Demo (MVP!)
3. Add Phase 4 (US2) → Metrics visible → Deploy/Demo
4. Add Phase 5 (US3) → Task management working → Deploy/Demo
5. Add Phase 6 → Visual polish complete → Deploy/Demo
6. Add Phase 7 (US5) → Mobile ready → Deploy/Demo
7. Add Phase 8-9 → Security verified → Production ready

---

## Summary

**Total Tasks**: 70
**By User Story**:
- US1 (Auth + Landing): 19 tasks
- US2 (Metrics): 4 tasks
- US3 (Tasks): 8 tasks
- US4 (Visual): 11 tasks
- US5 (Mobile): 3 tasks
- US6 (Scoping): 3 tasks
- Infrastructure: 22 tasks

**MVP Scope**: Phases 1-3 (23 tasks)
**Full Implementation with Landing Page**: All phases (70 tasks)

**Key Changes from Previous Version**:
1. Route migration: `(auth)/sign-in` → standalone `/login` and `/signup`
2. Design system: "Midnight Stone" dark → "Clean Light Mode"
3. Branding: "Command Center" → "TaskFlow", "Mission Control" → "My Tasks"
4. Route protection: Middleware → Client-side AuthGuard
5. Accent color: Amber → Tech Blue (#2563eb)
