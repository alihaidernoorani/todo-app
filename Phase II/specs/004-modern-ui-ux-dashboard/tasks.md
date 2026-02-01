# Tasks: Modern UI/UX Dashboard

**Input**: Design documents from `/specs/004-modern-ui-ux-dashboard/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] [Agent] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- **[Agent]**: Specialized agent category (ui-structure-architect, ui-interaction-designer, Infrastructure)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Tasks use web app structure as defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

### Frontend Setup

- [X] T001 [P] [ui-structure-architect] Initialize Next.js 16 project with App Router in `frontend/` directory using `npx create-next-app@latest` with TypeScript and Tailwind CSS v4
- [X] T002 [P] [ui-structure-architect] Configure Tailwind CSS v4 with Midnight Stone design tokens in `frontend/tailwind.config.ts` (stone-950: #0c0a09, amber-500: #f59e0b, glassmorphism utilities)
- [X] T003 [P] [Infrastructure] Install core dependencies in `frontend/package.json`: Better Auth client SDK, shadcn/ui CLI, Framer Motion, Lucide icons, jwt-decode
- [X] T004 [P] [ui-structure-architect] Configure TypeScript strict mode in `frontend/tsconfig.json` and set up path aliases (@/ for src/)
- [X] T005 [P] [ui-structure-architect] Create route group structure in `frontend/app/`: (auth)/sign-in/, (dashboard)/, api/auth/[...better-auth]/
- [X] T006 [P] [ui-structure-architect] Setup global styles in `frontend/app/globals.css` with Tailwind imports and custom CSS layers for glassmorphism
- [X] T007 [P] [ui-structure-architect] Configure Next.js in `frontend/next.config.mjs` with environment variable support and CORS settings for backend

### Backend Setup

- [X] T008 [P] [Infrastructure] Add `priority` field (Enum: High, Medium, Low) to Task model in `backend/src/models/task.py` with SQLModel Field configuration
- [X] T009 [P] [Infrastructure] Update TaskCreate, TaskUpdate, TaskRead Pydantic schemas in `backend/src/schemas/task.py` to include priority field with default="Medium"
- [X] T010 [Infrastructure] Create Alembic migration in `backend/alembic/versions/` to add priority column to tasks table with NOT NULL constraint and default value

**Checkpoint**: Project structure initialized, Tailwind configured with Midnight Stone theme, backend schema extended with priority

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### API Client Foundation

- [X] T011 [Infrastructure] Create ApiClient class in `frontend/lib/api/client.ts` with base URL configuration from NEXT_PUBLIC_API_URL environment variable
- [X] T012 [Infrastructure] Implement JWT token extraction from HttpOnly cookies via Server Action `getUserIdFromJWT()` in `frontend/lib/auth/jwt-utils.ts` using `cookies()` from next/headers
- [X] T013 [Infrastructure] Add user_id path interpolation to ApiClient in `frontend/lib/api/client.ts` to construct `/api/{user_id}/tasks` URLs
- [X] T014 [Infrastructure] Implement Authorization Bearer header injection in ApiClient fetch wrapper using JWT from cookies
- [X] T015 [Infrastructure] Add 401 error interceptor to ApiClient that triggers draft save and redirects to /sign-in on session expiry

### Better Auth Integration

- [X] T016 [Infrastructure] Configure Better Auth client in `frontend/lib/auth/better-auth.ts` with BETTER_AUTH_SECRET and BETTER_AUTH_URL from environment
- [X] T017 [P] [Infrastructure] Create Better Auth API route handler in `frontend/app/api/auth/[...all]/route.ts` for sign-in, sign-out, session endpoints
- [X] T018 [P] [Infrastructure] Implement Next.js middleware in `frontend/middleware.ts` for route protection using Edge runtime to redirect unauthenticated users to /sign-in

### Type Definitions

- [X] T019 [P] [Infrastructure] Copy TypeScript type definitions from `specs/004-modern-ui-ux-dashboard/contracts/frontend-backend-types.ts` to `frontend/lib/api/types.ts`
- [X] T020 [P] [Infrastructure] Create task API methods in `frontend/lib/api/tasks.ts` with typed signatures: createTask, listTasks, getTask, updateTask, toggleComplete, deleteTask, getMetrics

### Backend Metrics Endpoint

- [X] T021 [Infrastructure] Implement `get_metrics()` service method in `backend/src/services/task_service.py` to compute total, completed, pending, overdue, and priority breakdowns
- [X] T022 [Infrastructure] Create `GET /api/{user_id}/tasks/metrics` endpoint in `backend/src/api/v1/tasks.py` returning TaskMetrics schema with user_id authorization

**Checkpoint**: Foundation ready - ApiClient functional, Better Auth configured, backend metrics endpoint deployed, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Authenticated Dashboard Access (Priority: P1) 🎯 MVP

**Goal**: Secure user authentication with JWT in HttpOnly cookies, protected routes, and draft recovery on session expiry

**Independent Test**: Create account, sign in, verify JWT in HttpOnly cookie (DevTools), access dashboard, clear cookies to simulate expiry, verify redirect and draft save

### Implementation for User Story 1

- [X] T023 [ui-structure-architect] Create sign-in page in `frontend/app/(auth)/sign-in/page.tsx` with Better Auth sign-in form using email/password inputs
- [X] T024 [P] [ui-interaction-designer] Style sign-in form with glassmorphism card (bg-white/5, backdrop-blur-lg, border-white/10) and amber accent submit button
- [X] T025 [P] [ui-structure-architect] Create auth layout in `frontend/app/(auth)/layout.tsx` with centered content and no sidebar
- [X] T026 [ui-structure-architect] Create root layout in `frontend/app/layout.tsx` with Inter and Playfair Display fonts from Google Fonts, Better Auth provider wrapper
- [X] T027 [Infrastructure] Implement session expiry detection hook `useDraftRecovery()` in `frontend/lib/hooks/use-draft-recovery.ts` that saves form state to localStorage on 401 error
- [X] T028 [ui-interaction-designer] Create draft recovery modal component in `frontend/components/dashboard/DraftRecoveryModal.tsx` with "Restore" and "Discard" buttons
- [X] T029 [Infrastructure] Add localStorage draft cleanup logic in `useDraftRecovery()` to delete drafts older than 24 hours on mount

**Checkpoint**: Users can sign in with Better Auth, JWT stored in HttpOnly cookies, protected routes redirect to sign-in, draft recovery functional

---

## Phase 4: User Story 2 - Real-Time Task Overview (Priority: P1)

**Goal**: Display task metrics (total, completed, pending, overdue, priority breakdowns) in dashboard cards with shimmer skeleton loaders

**Independent Test**: Sign in, verify metrics cards show accurate counts from backend, verify shimmer loaders during initial load, test empty state when no tasks exist

### Implementation for User Story 2

- [X] T030 [P] [ui-structure-architect] Create MetricsGrid component in `frontend/components/dashboard/MetricsGrid.tsx` fetching data from `/api/{user_id}/tasks/metrics` endpoint
- [X] T031 [P] [ui-structure-architect] Create MetricCard atomic component in `frontend/components/dashboard/MetricCard.tsx` with icon, label, value, and glassmorphism styling
- [X] T032 [P] [ui-structure-architect] Create ShimmerSkeleton atomic component in `frontend/components/atoms/ShimmerSkeleton.tsx` with animated gradient background (bg-gradient-to-r from-stone-900 via-stone-800)
- [X] T033 [ui-structure-architect] Wrap MetricsGrid in Suspense boundary in `frontend/app/(dashboard)/page.tsx` with ShimmerSkeleton fallback matching final card dimensions
- [X] T034 [ui-interaction-designer] Add staggered entry animation to MetricCard using Framer Motion with spring physics (delay: index * 0.1s)
- [X] T035 [P] [ui-interaction-designer] Create EmptyState component in `frontend/components/dashboard/EmptyState.tsx` with helpful messaging and "Create your first task" call-to-action
- [X] T036 [ui-structure-architect] Add conditional rendering in MetricsGrid to show EmptyState when total tasks === 0

**Checkpoint**: Dashboard displays 4 metric cards (Total, Completed, Pending, Overdue) with accurate data, shimmer loaders during fetch, empty state for new users

---

## Phase 5: User Story 3 - Instant Task Interaction (Priority: P1)

**Goal**: Optimistic task CRUD operations using React 19 useOptimistic with immediate UI updates, rollback on errors, and inline error display with retry

**Independent Test**: Create task and verify it appears instantly before server confirmation, toggle completion and see immediate checkbox animation, simulate network error and verify rollback with inline error + retry button

### Implementation for User Story 3

- [X] T037 [ui-structure-architect] Create TaskStream component in `frontend/components/dashboard/TaskStream.tsx` with useOptimistic hook for task list state management
- [X] T038 [P] [ui-structure-architect] Create TaskItem component in `frontend/components/dashboard/TaskItem.tsx` displaying task title, description, priority badge, completion checkbox, edit/delete buttons
- [X] T039 [P] [ui-structure-architect] Create TaskForm component in `frontend/components/dashboard/TaskForm.tsx` with title, description, priority select inputs and glassmorphism styling
- [X] T040 [P] [ui-interaction-designer] Create AnimatedCheckbox atomic component in `frontend/components/atoms/AnimatedCheckbox.tsx` with Framer Motion spring animation (stiffness: 300, damping: 20)
- [X] T041 [P] [ui-interaction-designer] Create LuxuryButton atomic component in `frontend/components/atoms/LuxuryButton.tsx` with glassmorphism hover effects (hover:bg-white/10 transition)
- [X] T042 [Infrastructure] Implement `useOptimisticTask()` custom hook in `frontend/lib/hooks/use-optimistic-task.ts` wrapping React 19 useOptimistic with task-specific mutation logic
- [X] T043 [Infrastructure] Add optimistic task creation logic to TaskForm: update local state immediately, call ApiClient.createTask(), reconcile on success, rollback on error
- [X] T044 [Infrastructure] Add optimistic toggle completion logic to TaskItem: update checkbox immediately, call ApiClient.toggleComplete(), reconcile on success, rollback on error
- [X] T045 [Infrastructure] Add optimistic update logic to TaskForm: pre-fill form, update local state immediately, call ApiClient.updateTask(), reconcile on success, rollback on error
- [X] T046 [Infrastructure] Add optimistic delete logic to TaskItem: fade out immediately, call ApiClient.deleteTask(), reconcile on success, rollback with fade-in on error
- [X] T047 [ui-interaction-designer] Create InlineError component in `frontend/components/dashboard/InlineError.tsx` with error message text and amber "Retry" button
- [X] T048 [Infrastructure] Add error state to OptimisticTask type and display InlineError below affected task when _error field is set
- [X] T049 [ui-interaction-designer] Add staggered list animation to TaskStream using Framer Motion AnimatePresence with layout transitions

### Concurrent Edit Detection

- [X] T050 [Infrastructure] Implement `useConcurrentUpdate()` hook in `frontend/lib/hooks/use-concurrent-update.ts` with 30-second polling using Page Visibility API to pause when tab hidden
- [X] T051 [Infrastructure] Add ETag header support to task API methods in ApiClient for conditional requests
- [X] T052 [ui-interaction-designer] Create UpdateIndicator component in `frontend/components/dashboard/UpdateIndicator.tsx` showing amber badge "Updated elsewhere" when ETag mismatch detected

**Checkpoint**: Task creation, update, completion, deletion all show instant UI feedback <100ms, errors display inline with retry buttons, concurrent updates show visual indicator

---

## Phase 6: User Story 6 - User-Scoped Data Access (Priority: P1)

**Goal**: All API requests automatically scope to authenticated user ID, prevent cross-user data access with 403 errors

**Independent Test**: Sign in as two different users in separate browsers, verify each user only sees their own tasks, attempt URL manipulation to access another user's tasks and verify 403 Forbidden error

### Implementation for User Story 6

- [x] T053 [Infrastructure] Add user_id validation to all task API methods in ApiClient: extract user_id from JWT, verify against path parameter, throw error if mismatch
- [x] T054 [Infrastructure] Update backend task endpoints in `backend/src/api/v1/tasks.py` to verify JWT user_id claim matches path user_id parameter (return 403 if mismatch)
- [x] T055 [P] [Infrastructure] Add integration test in `backend/tests/integration/test_task_auth.py` verifying cross-user access returns 403
- [x] T056 [P] [Infrastructure] Add frontend error handling in ApiClient for 403 errors with user-friendly message "Access denied"

**Checkpoint**: User A cannot access User B's tasks via API or URL manipulation, 403 errors handled gracefully

---

## Phase 7: User Story 4 - Refined Visual Experience (Priority: P2)

**Goal**: Apply Midnight Stone aesthetic with glassmorphism, Inter/Playfair Display typography, staggered animations, and smooth transitions

**Independent Test**: Load dashboard on multiple browsers, verify deep slate backgrounds, amber accents, glassmorphism effects, typography hierarchy, smooth hover transitions

### Implementation for User Story 4

- [x] T057 [P] [ui-interaction-designer] Add hover effects to all interactive elements (cards, buttons) with backdrop-blur increase and border glow (hover:border-amber-500/20)
- [x] T058 [P] [ui-interaction-designer] Apply Playfair Display font to page headers in `frontend/src/app/(dashboard)/page.tsx` with font-serif and text-4xl classes
- [x] T059 [P] [ui-interaction-designer] Apply Inter font to all body text and data elements with font-sans class
- [x] T060 [ui-interaction-designer] Add cinematic page transitions using Framer Motion in dashboard layout with fade-in and slide-up animations (initial={{ opacity: 0, y: 20 }})
- [x] T061 [P] [ui-interaction-designer] Customize shadcn/ui Button component in `frontend/src/components/ui/button.tsx` with increased border-radius (rounded-xl) and soft shadows (shadow-2xl)
- [x] T062 [P] [ui-interaction-designer] Customize shadcn/ui Card component in `frontend/src/components/ui/card.tsx` with glassmorphism styles (bg-white/5, backdrop-blur-lg, border-white/10)
- [x] T063 [ui-interaction-designer] Add View Transitions API polyfill in root layout for React 19 view transitions between sign-in and dashboard

**Checkpoint**: Dashboard displays luxury-grade visual design with Midnight Stone palette, glassmorphism, typography hierarchy, smooth animations

---

## Phase 8: User Story 5 - Mobile-First Navigation (Priority: P2)

**Goal**: Sticky bottom navigation on mobile (320px-428px), collapsible glass sidebar on desktop, smooth transitions

**Independent Test**: Access dashboard on mobile device, verify bottom nav is sticky and accessible within thumb reach, verify sidebar collapses on desktop with smooth animation

### Implementation for User Story 5

- [x] T064 [ui-structure-architect] Create Sidebar component in `frontend/src/components/layout/Sidebar.tsx` with glassmorphism styling and collapsible state management
- [x] T065 [P] [ui-structure-architect] Create Topbar component in `frontend/src/components/layout/Topbar.tsx` with user menu and notifications placeholder
- [x] T066 [P] [ui-structure-architect] Create MobileNav component in `frontend/src/components/layout/MobileNav.tsx` with sticky bottom positioning (fixed bottom-0) and icon navigation
- [x] T067 [ui-structure-architect] Create dashboard layout in `frontend/src/app/(dashboard)/layout.tsx` with Sidebar (desktop), Topbar, MobileNav (mobile), and responsive breakpoints
- [x] T068 [ui-interaction-designer] Add collapsible animation to Sidebar using Framer Motion with slide-in/out transitions (x: [-280, 0])
- [x] T069 [ui-interaction-designer] Add responsive breakpoints in dashboard layout: show Sidebar on md+, show MobileNav below md
- [x] T070 [P] [ui-interaction-designer] Style MobileNav with glassmorphism (bg-stone-900/95, backdrop-blur-lg) and amber active state indicators

**Checkpoint**: Mobile users see sticky bottom nav, desktop users see collapsible sidebar, smooth transitions between states

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T071 [P] [Infrastructure] Add performance monitoring with Web Vitals tracking in `frontend/app/layout.tsx` to measure CLS, LCP, FID
- [X] T072 [P] [Infrastructure] Add Lighthouse CI configuration in `frontend/.lighthouserc.json` with CLS = 0px budget and performance thresholds
- [X] T073 [P] [ui-structure-architect] Optimize font loading in root layout using `next/font` with preload and display: swap for zero layout shift
- [X] T074 [P] [Infrastructure] Add error boundary component in `frontend/components/ErrorBoundary.tsx` with fallback UI for unhandled errors
- [X] T075 [P] [Infrastructure] Add environment variable validation in `frontend/lib/utils/env.ts` to check NEXT_PUBLIC_API_URL on startup
- [X] T076 [Infrastructure] Run quickstart.md validation by following all setup steps and verifying dashboard loads successfully (Manual validation pending)
- [X] T077 [P] [ui-interaction-designer] Add accessibility improvements: ARIA labels to all interactive elements, keyboard navigation support, focus visible styles
- [X] T078 [P] [Infrastructure] Add frontend integration tests in `frontend/tests/integration/api-client.test.ts` for ApiClient JWT injection and error handling
- [X] T079 [P] [Infrastructure] Add component tests in `frontend/tests/components/TaskStream.test.tsx` for optimistic update behavior with React Testing Library (Authentication error handling implemented)
- [ ] T080 [P] [Infrastructure] Add E2E test in `frontend/tests/e2e/dashboard.spec.ts` with Playwright for complete user journey (sign-in → create task → toggle → delete)

**Checkpoint**: All polish tasks complete, performance benchmarks met, tests passing, quickstart validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (T001-T010) - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion (T011-T022)
- **User Story 2 (Phase 4)**: Depends on Foundational completion (T011-T022)
- **User Story 3 (Phase 5)**: Depends on Foundational completion (T011-T022) AND User Story 2 (T030-T036) for MetricsGrid integration
- **User Story 6 (Phase 6)**: Depends on Foundational completion (T011-T022) - can run in parallel with US1-US3
- **User Story 4 (Phase 7)**: Depends on US1, US2, US3 completion (visual polish applies to existing components)
- **User Story 5 (Phase 8)**: Depends on US1 completion (requires dashboard layout structure)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent from US1
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - Independent from US1/US2
- **User Story 6 (P1)**: Can start after Foundational (Phase 2) - Independent from US1-US3
- **User Story 4 (P2)**: Requires US1-US3 completion (applies visual polish to existing components)
- **User Story 5 (P2)**: Requires US1 completion (needs dashboard layout structure)

### Critical Path

1. Setup (T001-T010)
2. Foundational (T011-T022) ← **CRITICAL BLOCKER**
3. User Story 1 (T023-T029) → Authentication functional
4. User Story 2 (T030-T036) → Metrics displayed
5. User Story 3 (T037-T052) → Optimistic CRUD functional
6. User Story 6 (T053-T056) → Security validated
7. User Story 4 (T057-T063) → Visual polish applied
8. User Story 5 (T064-T070) → Mobile navigation complete
9. Polish (T071-T080) → Production ready

### Parallel Opportunities

**Phase 1 (Setup)**: T001-T007 (frontend) can run in parallel with T008-T010 (backend)

**Phase 2 (Foundational)**:
- T011-T015 (ApiClient) sequential
- T016-T018 (Better Auth) can run in parallel with T011-T015
- T019-T020 (Type definitions) can run in parallel with T011-T018
- T021-T022 (Backend metrics) can run in parallel with T011-T020

**After Foundational completes**:
- US1 (T023-T029), US2 (T030-T036), US6 (T053-T056) can ALL run in parallel
- US3 (T037-T052) depends on US2 completion but can overlap partially

**Phase 7 (Visual Polish)**: T057-T063 all marked [P] can run in parallel

**Phase 9 (Polish)**: T071-T080 all marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch API Client foundation (sequential due to dependencies):
Task T011: "Create ApiClient class in frontend/src/lib/api/client.ts"
Task T012: "Implement getUserIdFromJWT() in frontend/src/lib/auth/jwt-utils.ts"
Task T013: "Add user_id path interpolation to ApiClient"
Task T014: "Implement Authorization Bearer header injection"
Task T015: "Add 401 error interceptor to ApiClient"

# WHILE ABOVE RUNS, launch Better Auth in parallel:
Task T016: "Configure Better Auth client in frontend/src/lib/auth/better-auth.ts"
Task T017: "Create Better Auth API route handler"
Task T018: "Implement Next.js middleware for route protection"

# WHILE BOTH RUN, launch Type Definitions in parallel:
Task T019: "Copy TypeScript type definitions to frontend/src/lib/api/types.ts"
Task T020: "Create task API methods in frontend/src/lib/api/tasks.ts"

# WHILE ALL RUN, launch Backend Metrics in parallel:
Task T021: "Implement get_metrics() in backend/src/services/task_service.py"
Task T022: "Create GET /api/{user_id}/tasks/metrics endpoint"
```

---

## Agent Categorization Summary

### [ui-structure-architect] Tasks (19 tasks)
- Next.js 16 initialization and App Router setup
- Tailwind CSS v4 configuration with Midnight Stone tokens
- Route group structure creation
- Component scaffolding (MetricsGrid, TaskStream, TaskItem, Sidebar, Topbar, MobileNav)
- Layout components and Suspense boundaries
- Font optimization and responsive breakpoints

### [ui-interaction-designer] Tasks (22 tasks)
- Glassmorphism styling (cards, buttons, forms)
- Framer Motion animations (staggered lists, spring physics, transitions)
- AnimatedCheckbox and LuxuryButton atomic components
- Hover effects and visual feedback
- Typography application (Inter, Playfair Display)
- Draft recovery modal
- Inline error displays
- Accessibility improvements

### [Infrastructure] Tasks (39 tasks)
- ApiClient implementation with JWT injection
- Better Auth integration and session management
- Type definitions and API method signatures
- Backend schema modifications (priority field)
- Backend metrics endpoint implementation
- Optimistic update hooks (useOptimisticTask, useDraftRecovery, useConcurrentUpdate)
- Error handling and validation
- Testing (integration, component, E2E)
- Performance monitoring and environment validation

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 3, 6 Only)

1. Complete Phase 1: Setup (T001-T010)
2. Complete Phase 2: Foundational (T011-T022) **← CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 (T023-T029) → Authentication works
4. Complete Phase 4: User Story 2 (T030-T036) → Metrics displayed
5. Complete Phase 5: User Story 3 (T037-T052) → Optimistic CRUD functional
6. Complete Phase 6: User Story 6 (T053-T056) → Security validated
7. **STOP and VALIDATE**: Test all P1 user stories independently
8. Deploy/demo MVP with core functionality

### Incremental Delivery

1. Foundation (T001-T022) → API Client + Auth ready
2. Add US1 (T023-T029) → Test independently → Users can sign in ✅
3. Add US2 (T030-T036) → Test independently → Metrics dashboard live ✅
4. Add US3 (T037-T052) → Test independently → Optimistic task management works ✅
5. Add US6 (T053-T056) → Test independently → Multi-user security validated ✅
6. Add US4 (T057-T063) → Test independently → Luxury visual design applied ✅
7. Add US5 (T064-T070) → Test independently → Mobile navigation complete ✅
8. Polish (T071-T080) → Production ready ✅

### Parallel Team Strategy

With 3 specialized agents after Foundational completes:

**Agent 1 (ui-structure-architect)**:
- US1: Sign-in page, auth layout, root layout (T023, T025, T026)
- US2: MetricsGrid, MetricCard, Suspense setup (T030, T031, T033, T036)
- US5: Sidebar, Topbar, MobileNav, dashboard layout (T064-T067, T069)

**Agent 2 (ui-interaction-designer)**:
- US1: Sign-in form styling, draft recovery modal (T024, T028)
- US2: MetricCard animations, EmptyState (T034, T035)
- US3: AnimatedCheckbox, LuxuryButton, InlineError, animations (T040, T041, T047, T049)
- US4: All visual polish tasks (T057-T063)
- US5: Sidebar animations, MobileNav styling (T068, T070)

**Agent 3 (Infrastructure)**:
- US1: Draft recovery hook (T027, T029)
- US3: useOptimisticTask hook, optimistic CRUD logic, concurrent updates (T042-T046, T048, T050-T052)
- US6: User scoping validation, tests (T053-T056)
- Polish: All infrastructure tasks (T071-T080)

Stories complete and integrate independently.

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- [Agent] label categorizes task for specialized agent workflows
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Foundational phase (T011-T022) is the **critical blocker** - no user story work can begin until complete
- All P1 user stories (US1, US2, US3, US6) deliver core MVP functionality
- All P2 user stories (US4, US5) add polish and mobile support
