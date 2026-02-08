# Tasks: Modern UI/UX Dashboard - UI Improvements & CRUD Fixes

**Input**: User request for UI/UX improvements and CRUD functionality fixes
**Prerequisites**: plan.md (revised 2026-02-08), spec.md (clarifications 2026-02-08), data-model.md
**Focus**: Spacing, styling, responsive design, task CRUD functionality, mobile navigation

**UI/UX Agent Assignments**:
- `ui-structure-architect`: Layout spacing and responsive structure
- `ui-interaction-designer`: Forms, inputs, CRUD operations, mobile navigation
- `ui-ux-futuristic-designer`: Visual polish and premium feel

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` for Next.js, `backend/` for FastAPI
- All paths relative to repository root

---

## Phase 1: Layout Spacing & Premium Feel (Foundational)

**Purpose**: Establish generous spacing system per FR-008a for luxury-grade experience
**Agent**: `ui-structure-architect`

**⚠️ CRITICAL**: These spacing standards must be complete before UI component work begins

### Dashboard Layout Spacing

- [X] T001 Update main dashboard container in `frontend/app/(dashboard)/page.tsx`:
  - Apply p-8 to p-10 (32-40px) padding to main content area
  - Ensure consistent spacing between metrics grid and task list
  - Add max-width constraint for readability on large screens

- [X] T002 [P] Update metrics grid spacing in `frontend/components/dashboard/MetricsGrid.tsx`:
  - Apply gap-5 to gap-6 (20-24px) between metric cards
  - Ensure responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
  - Apply generous top/bottom margins for breathing room

- [X] T003 [P] Update task list spacing in `frontend/components/dashboard/TaskStream.tsx`:
  - Apply space-y-4 to space-y-5 (16-20px) vertical spacing between task items
  - Add generous padding to task list container (p-6 to p-8)
  - Ensure proper spacing between "Add Task" button and task list

### Card & Component Spacing

- [X] T004 Update task card padding in `frontend/components/dashboard/TaskItem.tsx`:
  - Apply p-5 to p-6 (20-24px) internal padding per FR-008a
  - Ensure consistent spacing between checkbox, title, and action buttons
  - Add adequate margin between task cards for visual separation

- [X] T005 [P] Update metric card padding in `frontend/components/dashboard/MetricCard.tsx`:
  - Apply p-5 to p-6 (20-24px) internal padding
  - Ensure icon, label, and value have proper spacing hierarchy
  - Apply subtle shadow for depth: `shadow-sm hover:shadow-md transition-shadow`

**Checkpoint**: Spacing system established - all components have premium spacing

---

## Phase 2: Responsive Typography (Foundational)

**Purpose**: Implement responsive typography per FR-009b for optimal readability across devices
**Agent**: `ui-interaction-designer`

### Typography Scale Implementation

- [X] T006 Create responsive typography utility classes in `frontend/app/globals.css`:
  - Mobile heading sizes: `text-xl md:text-2xl lg:text-3xl` for page titles
  - Mobile body sizes: `text-sm md:text-base` for standard text
  - Mobile card titles: `text-base md:text-lg` for task titles
  - Add font-weight variations for hierarchy

- [X] T007 [P] Update page title typography in `frontend/components/layout/Topbar.tsx`:
  - Apply responsive sizing to "My Tasks" title
  - Use Playfair Display with responsive scale
  - Ensure readable on both mobile (smaller) and desktop (larger)

- [X] T008 [P] Update task item typography in `frontend/components/dashboard/TaskItem.tsx`:
  - Task title: `text-base md:text-lg font-semibold`
  - Task description: `text-sm md:text-base text-slate-600`
  - Metadata (dates, priority): `text-xs md:text-sm text-slate-500`

- [X] T009 [P] Update metric card typography in `frontend/components/dashboard/MetricCard.tsx`:
  - Metric value: `text-2xl md:text-3xl lg:text-4xl font-bold`
  - Metric label: `text-sm md:text-base text-slate-600`

**Checkpoint**: Responsive typography working - optimal readability on all devices

---

## Phase 3: User Story 3 - Task CRUD Functionality Fix (Priority: P1) 🎯

**Goal**: Fix task manager CRUD operations with proper API integration and optimistic updates
**Agent**: `ui-interaction-designer`

**Independent Test**: Create, edit, delete tasks and verify API calls work correctly with immediate UI feedback

### Task Form Implementation (Modal Pattern per FR-005a)

- [X] T010 [US3] Create TaskModal component in `frontend/components/dashboard/TaskModal.tsx`:
  - shadcn/ui Dialog component with modal overlay
  - Form with floating labels per FR-005b
  - Fields: title (required, auto-focus), description (optional), priority dropdown (High/Medium/Low), due date picker
  - Minimum button height 48px for touch-friendly interaction
  - Inline validation with error messages below fields

- [X] T011 [US3] Implement floating label pattern in `frontend/components/ui/FloatingInput.tsx`:
  - Label floats up on focus with smooth transition
  - Focus states with blue ring: `focus:ring-2 focus:ring-blue-500`
  - Error states with red border: `border-red-500 focus:ring-red-500`
  - Placeholder text only when input is empty

- [X] T012 [US3] Update Add Task button in `frontend/components/dashboard/TaskStream.tsx`:
  - Clicking "Add Task" opens TaskModal (not inline form)
  - Button styled with PrimaryButton component
  - Modal state managed with useState hook

### Task CRUD API Integration

- [X] T013 [US3] Fix task creation in `frontend/lib/api/tasks.ts`:
  - Ensure createTask() uses correct endpoint: `POST ${BACKEND_URL}/{user_id}/tasks`
  - BACKEND_URL must include `/api` prefix (e.g., `http://localhost:8000/api`)
  - Construct full URL as: `{BACKEND_URL}/{user_id}/tasks` (not `{BACKEND_URL}/api/{user_id}/tasks`)
  - Include credentials: `'include'` for HttpOnly cookies
  - Return TaskRead response from server

- [X] T014 [US3] Fix task update in `frontend/lib/api/tasks.ts`:
  - Ensure updateTask() uses: `PUT ${BACKEND_URL}/{user_id}/tasks/{id}`
  - Send full TaskUpdate payload (title, description, is_completed, priority)
  - Handle 404 errors gracefully (task may have been deleted)

- [X] T015 [US3] Fix task deletion in `frontend/lib/api/tasks.ts`:
  - Ensure deleteTask() uses: `DELETE ${BACKEND_URL}/{user_id}/tasks/{id}`
  - Return void on success
  - Show user-friendly confirmation before delete

- [X] T016 [US3] Fix task toggle completion in `frontend/lib/api/tasks.ts`:
  - Ensure toggleComplete() uses: `PATCH ${BACKEND_URL}/{user_id}/tasks/{id}/complete`
  - Optimistic update via useOptimistic hook
  - Rollback on failure with inline error message

### Optimistic Update Implementation

- [X] T017 [US3] Implement useOptimistic integration in `frontend/components/dashboard/TaskStream.tsx`:
  - Use React 19 `useOptimistic` hook for immediate UI feedback
  - On create: Add task with `_optimistic: true` flag, show pending indicator
  - On success: Merge server response, remove pending flag
  - On failure: Rollback optimistic change, show InlineError with retry button

- [X] T018 [US3] Create InlineError component in `frontend/components/dashboard/InlineError.tsx`:
  - Display below affected task item
  - User-friendly error message per FR-016a (not raw server errors)
  - Retry button with ghost styling
  - Error translation map: 500 → "Something went wrong", 503 → "Service unavailable", network error → "Check connection"

### Form UX Patterns (FR-005b)

- [X] T019 [US3] Implement touch-friendly buttons in TaskModal:
  - All buttons min-height 48px for mobile accessibility
  - Primary submit button: `bg-blue-600 text-white h-12 rounded-lg`
  - Cancel button: `bg-slate-100 text-slate-700 h-12`
  - Delete button (in edit mode): `bg-red-50 text-red-700 h-12`

- [X] T020 [US3] Implement auto-focus behavior in TaskModal:
  - On modal open, auto-focus title input field
  - Use `useEffect` with input ref
  - Trap focus within modal (keyboard navigation stays in modal)

**Checkpoint**: US3 Complete - Task CRUD fully functional with optimistic updates

---

## Phase 4: User Story 5 - Mobile Navigation Enhancement (Priority: P2)

**Goal**: Implement mobile-friendly bottom navigation with Account menu and Sign Out
**Agent**: `ui-interaction-designer`

**Independent Test**: Access dashboard on mobile, verify bottom nav sticky, Account menu opens bottom sheet with Sign Out

### Mobile Bottom Navigation

- [X] T021 [US5] Update MobileNav component in `frontend/components/layout/MobileNav.tsx`:
  - Sticky bottom navigation: `fixed bottom-0 left-0 right-0 z-50`
  - Navigation items: Dashboard, Tasks, Account (3 items minimum)
  - Active state with blue accent: `text-blue-600` when active, `text-slate-600` when inactive
  - Icon-only display with labels on tap/long-press

- [X] T022 [US5] Implement Account menu bottom sheet in `frontend/components/layout/AccountSheet.tsx`:
  - shadcn/ui Sheet component sliding from bottom
  - Triggered by tapping "Account" in bottom navigation
  - Menu items: Profile, Settings (hidden per FR-013a), Sign Out
  - Settings item hidden with CSS: `hidden` class or conditional rendering

- [X] T023 [US5] Implement Sign Out functionality in AccountSheet:
  - Clicking "Sign Out" calls Better Auth signOut() method
  - Clear localStorage drafts on sign out
  - Redirect to `/login` after successful sign out
  - Show loading spinner during sign out process

### Mobile Safe Area & Bottom Padding

- [X] T024 [US5] Apply mobile safe area padding per FR-012b in `frontend/app/(dashboard)/page.tsx`:
  - Base padding: `pb-28` (112px) to clear bottom navigation
  - Add CSS environment variable for dynamic safe area:
    ```css
    padding-bottom: calc(7rem + env(safe-area-inset-bottom));
    ```
  - Ensure content doesn't hide behind bottom nav on devices with notches

- [X] T025 [US5] Update MobileNav to respect safe area in `frontend/components/layout/MobileNav.tsx`:
  - Apply padding: `pb-safe` or `pb-[env(safe-area-inset-bottom)]`
  - Ensure nav buttons remain accessible on all devices

### Desktop Sidebar Enhancement

- [X] T026 [US5] Fix sidebar toggle mechanism per FR-013 in `frontend/components/layout/Sidebar.tsx`:
  - Single toggle button that both collapses AND expands sidebar
  - When expanded: Show ChevronLeft icon (collapse action)
  - When collapsed: Show ChevronRight icon (expand action)
  - Smooth animation with Framer Motion: `transition-all duration-300 ease-in-out`
  - Tooltips added for all icons when collapsed ("Dashboard", "Tasks", "Expand sidebar")
  - Persist collapsed state in localStorage

- [X] T027 [US5] Hide Settings button per FR-013a in Sidebar:
  - Conditionally hide Settings nav item: `{isSettingsEnabled && <SettingsButton />}`
  - Set `isSettingsEnabled = false` as feature flag
  - Preserve nav layout structure for future implementation

**Checkpoint**: US5 Complete - Mobile navigation with Account menu and Sign Out working

---

## Phase 5: Visual Polish & Premium Details (Priority: P2)

**Purpose**: Apply subtle glassmorphism, generous spacing, and premium feel per Clean Light Mode
**Agent**: `ui-ux-futuristic-designer`

### Glassmorphism Effects (Subtle, Professional)

- [X] T028 [P] [US4] Apply subtle glassmorphism to sidebar in `frontend/components/layout/Sidebar.tsx`:
  - Background: `bg-slate-50/95` (semi-transparent)
  - Backdrop blur: `backdrop-blur-sm`
  - Border: `border-r border-slate-200/80` (translucent)
  - Maintain high contrast text for readability

- [X] T029 [P] [US4] Add glassmorphism hover states to metric cards in `frontend/components/dashboard/MetricCard.tsx`:
  - Default: `bg-white border border-slate-200 shadow-sm`
  - Hover: `hover:shadow-md hover:border-slate-300 transition-all duration-200`
  - No backdrop blur on cards (too subtle for content area)

- [X] T030 [P] [US4] Apply glass borders to task items in `frontend/components/dashboard/TaskItem.tsx`:
  - Border: `border border-slate-200/80`
  - On hover: `hover:border-slate-300 hover:shadow-sm`
  - Smooth transition: `transition-all duration-150`

### Spacing Audit & Refinement

- [X] T031 [US4] Audit all spacing against FR-008a requirements:
  - Main layout: ✓ p-8 to p-10 (32-40px)
  - Task cards: ✓ p-5 to p-6 (20-24px)
  - Task lists: ✓ space-y-4 to space-y-5 (16-20px)
  - Metrics grids: ✓ gap-5 to gap-6 (20-24px)
  - All components verified and meeting requirements

- [X] T032 [P] [US4] Add breathing room to empty states in `frontend/components/dashboard/EmptyState.tsx`:
  - Container padding: `p-12` (48px) for spacious feel
  - Icon-to-text margin: `mb-6` (24px)
  - Text-to-CTA margin: `mt-8` (32px)

### Animation Polish

- [X] T033 [US4] Add spring animation to checkbox in `frontend/components/atoms/AnimatedCheckbox.tsx`:
  - On toggle: Scale animation `{ scale: [0, 1.2, 1] }`
  - Spring physics: `{ type: "spring", stiffness: 300, damping: 20 }`
  - Color transition: unchecked (slate) → checked (green-600) with background pop effect

- [X] T034 [P] [US4] Add staggered entrance animation to task list in `frontend/components/dashboard/TaskStream.tsx`:
  - Use Framer Motion `stagger` with 50ms delay
  - Fade-in: `{ opacity: [0, 1], y: [10, 0] }`
  - Only on initial load (not on every re-render)

**Checkpoint**: US4 Complete - Premium visual polish with subtle glassmorphism

---

## Phase 6: Responsive Breakpoints & Mobile Optimization

**Purpose**: Ensure dashboard is fully responsive on all screen sizes (320px - 2560px)
**Agent**: `ui-structure-architect`

### Responsive Grid Systems

- [X] T035 Implement responsive metrics grid in `frontend/components/dashboard/MetricsGrid.tsx`:
  - Mobile (< 640px): `grid-cols-1` (stacked)
  - Tablet (640px - 1024px): `grid-cols-2` (2 columns)
  - Desktop (>= 1024px): `grid-cols-4` (4 columns)
  - Cards maintain aspect ratio and readability at all sizes

- [X] T036 [P] Implement responsive task list in `frontend/components/dashboard/TaskStream.tsx`:
  - Mobile: Action buttons below content (stacked layout)
  - Tablet: Side-by-side task content and actions
  - Desktop: Task content with right-aligned actions
  - Touch targets meet 48px minimum on mobile

### Mobile-Specific Optimizations

- [X] T037 Add mobile-optimized task form in `frontend/components/dashboard/TaskModal.tsx`:
  - Mobile: Full-screen modal (85vh) with slide-up animation
  - Desktop: Centered modal with max-width (2xl)
  - Touch-friendly inputs (h-14 / 56px)
  - Slide-up animation with cubic-bezier easing

- [X] T038 [P] Optimize sidebar behavior in `frontend/components/layout/Sidebar.tsx`:
  - Sidebar hidden on mobile: `hidden md:flex`
  - MobileNav shown on mobile: `md:hidden`
  - No overlap on tablet sizes
  - Smooth Framer Motion transitions

### Accessibility & Touch Targets

- [X] T039 Audit touch target sizes across all interactive elements:
  - All primary buttons: 48x48px ✅
  - Icon buttons: 44x44px (WCAG AAA compliant) ✅
  - Checkbox: 20px visual + parent button provides touch target ✅
  - Navigation items: 48px+ height ✅
  - Mobile nav: 64px height (exceeds requirement) ✅
  - All interactive elements meet WCAG 2.1 Level AAA standards

**Checkpoint**: Fully responsive - dashboard works on all device sizes

---

## Phase 7: Error Handling & User Feedback

**Purpose**: Implement user-friendly error messages per FR-016, FR-016a
**Agent**: `ui-interaction-designer`

### Error Translation System

- [X] T040 Create error translation utility in `frontend/lib/utils/errorMessages.ts`:
  - Map technical errors to user-friendly messages
  - 500 → "Something went wrong on our end. Please try again."
  - 503 → "Service temporarily unavailable. Please try again in a moment."
  - Network error → "Unable to connect. Check your internet connection and try again."
  - 401 → "Your session has expired. Please sign in again."
  - 403 → "You don't have permission to perform this action."

- [X] T041 Integrate error translation in ApiClient in `frontend/lib/api/client.ts`:
  - Intercept all error responses
  - Apply error translation before throwing
  - Include retry callback for transient errors
  - Log original error to console for debugging
  - **NOTE**: Verified existing implementation already handles user-friendly errors

### Inline Validation & Feedback

- [X] T042 Implement inline validation in TaskForm in `frontend/components/dashboard/TaskModal.tsx`:
  - Title required: Shows error below field on blur validation
  - Title max length: Character count with warning at 90% (229/255)
  - Description max length: Character count with warning at 90% (1800/2000)
  - Red border states for invalid fields
  - Validation triggers on blur and on change after touched
  - Field errors clear when fixed

- [X] T043 [P] Add success feedback for task actions:
  - Task created/updated/deleted: Toast notification (2s duration, auto-dismiss)
  - Task completed: Checkbox animation with green checkmark ✅
  - Task deleted: Fade-out animation before removal ✅
  - All feedback under 2 seconds duration ✅

**Checkpoint**: Error handling complete - user-friendly messages throughout

---

## Phase 8: Performance & Polish

**Purpose**: Optimize performance for luxury-grade experience per success criteria
**Agent**: `ui-structure-architect`

### Performance Optimizations

- [X] T044 Implement skeleton loaders in `frontend/components/atoms/ShimmerSkeleton.tsx`:
  - Metrics grid skeleton: 4 shimmer cards matching MetricCard dimensions ✅
  - Task list skeleton: 5 shimmer rows matching TaskItem dimensions ✅
  - Light theme: `bg-slate-200 animate-pulse` ✅
  - Maintain layout structure to prevent CLS (SC-003) ✅

- [X] T045 [P] Add Suspense boundaries in `frontend/app/(dashboard)/page.tsx`:
  - Wrap MetricsGrid with `<Suspense fallback={<MetricsGridSkeleton />}` ✅
  - TaskStream uses client-side loading state (optimal for optimistic updates) ✅
  - Prevent entire page re-render on data fetch ✅
  - Achieve 0px CLS score per SC-003 ✅

- [X] T046 Optimize API calls in `frontend/lib/api/tasks.ts` and `frontend/components/dashboard/MetricsGrid.tsx`:
  - Created debounce utility hook in `frontend/lib/hooks/use-debounce.ts` ✅
  - Implemented metrics polling every 30 seconds (only when tab active) ✅
  - Added `visibilitychange` event to fetch fresh data when tab becomes visible ✅
  - Ready for future search/filter debouncing implementation ✅

### Final Polish

- [X] T047 Apply consistent transitions across all interactive elements:
  - Duration: `duration-150` for most interactions, `duration-200` for complex animations ✅
  - Easing: `ease-in-out` for natural feel ✅
  - Properties: `transition-colors`, `transition-shadow`, `transition-all` applied ✅
  - `will-change` hints added via `.gpu-accelerated` utility class ✅

- [X] T048 [P] Add loading states to all async actions:
  - Sign In button: Spinner replaces text on submit ✅
  - Add Task button: PrimaryButton component with `isLoading` prop ✅
  - Delete button: Confirmation dialog already present ✅
  - Toggle completion: Immediate optimistic update (no spinner) ✅

**Checkpoint**: Performance optimized - smooth 60fps interactions

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Spacing) ──────────┐
                            ├──→ Phase 3 (CRUD)
Phase 2 (Typography) ───────┘      │
                                   ├──→ Phase 5 (Polish)
Phase 4 (Mobile Nav) ──────────────┘      │
                                          ├──→ Phase 8 (Performance)
Phase 6 (Responsive) ─────────────────────┘
Phase 7 (Errors) ← can parallelize with Phase 3
```

### User Story Dependencies

- **Phase 1-2 (Foundational)**: MUST complete before any UI component work
- **Phase 3 (US3 - CRUD)**: Can start after Phase 1-2; BLOCKS Phase 5
- **Phase 4 (US5 - Mobile Nav)**: Can parallelize with Phase 3
- **Phase 5 (US4 - Polish)**: Depends on Phase 3 (needs working components to polish)
- **Phase 6 (Responsive)**: Can parallelize with Phase 3-4
- **Phase 7 (Errors)**: Can parallelize with Phase 3
- **Phase 8 (Performance)**: Final phase, depends on all component work

### Parallel Opportunities

**Phase 1**: T002, T003, T005 can run in parallel
**Phase 2**: T007, T008, T009 can run in parallel
**Phase 5**: T028, T029, T030, T032, T034 can run in parallel
**Phase 6**: T036, T038 can run in parallel

---

## Implementation Strategy

### MVP First (Phases 1-3)

1. Complete Phase 1: Spacing system
2. Complete Phase 2: Responsive typography
3. Complete Phase 3: Task CRUD functionality
4. **STOP and VALIDATE**: Test task creation, editing, deletion with proper spacing
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1-2 → Foundation ready (spacing + typography)
2. Add Phase 3 (US3) → CRUD working → Deploy/Demo (MVP!)
3. Add Phase 4 (US5) → Mobile nav working → Deploy/Demo
4. Add Phase 5 (US4) → Visual polish complete → Deploy/Demo
5. Add Phase 6 → Fully responsive → Deploy/Demo
6. Add Phase 7 → Error handling complete → Deploy/Demo
7. Add Phase 8 → Performance optimized → Production ready

---

## Summary

**Total Tasks**: 48
**By User Story**:
- US3 (Task CRUD): 11 tasks
- US4 (Visual Polish): 8 tasks
- US5 (Mobile Navigation): 7 tasks
- Foundational (Spacing + Typography): 9 tasks
- Responsive & Accessibility: 5 tasks
- Error Handling: 4 tasks
- Performance: 4 tasks

**MVP Scope**: Phases 1-3 (20 tasks) - Core spacing, typography, and CRUD functionality
**Full Implementation**: All phases (48 tasks) - Production-ready responsive dashboard

**Key Improvements Delivered**:
1. ✅ Generous spacing per FR-008a (luxury-grade feel)
2. ✅ Responsive typography per FR-009b (mobile + desktop optimized)
3. ✅ Fixed task CRUD with API integration per FR-005, FR-016
4. ✅ Mobile-friendly bottom nav with Account menu per FR-012a, FR-012b
5. ✅ Touch-friendly form patterns per FR-005b (48px buttons, floating labels, auto-focus)
6. ✅ User-friendly error messages per FR-016a (no raw server errors)
7. ✅ Desktop sidebar toggle fix per FR-013 (bidirectional collapse/expand)
8. ✅ Subtle glassmorphism per FR-008 (professional, not overdone)
9. ✅ Safe area support per FR-012b (devices with notches/home indicators)
