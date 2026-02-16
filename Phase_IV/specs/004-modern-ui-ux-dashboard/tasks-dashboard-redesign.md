---
description: "Task list for Dashboard Redesign - Remove sidebar, add top bar, create two-column responsive layout"
---

# Tasks: Dashboard Redesign

**Input**: Design documents from `/specs/004-modern-ui-ux-dashboard/`
**Prerequisites**: plan-dashboard-redesign.md (required), spec.md (user stories)

**Tests**: Not explicitly requested - focus on implementation and manual validation

**Organization**: Tasks are organized by functional area to enable efficient implementation

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/src/` for all frontend code
- Paths relative to repository root

---

## Phase 1: Preparation & Analysis

**Purpose**: Understand current implementation and prepare for refactoring

- [x] T001 Audit current Sidebar component (frontend/src/components/dashboard/Sidebar.tsx) to identify any authentication or state logic that needs migration
- [x] T002 Audit current MobileNav component (frontend/src/components/navigation/MobileNav.tsx) to identify any authentication or state logic that needs migration
- [x] T003 Audit current AccountSheet component (frontend/src/components/navigation/AccountSheet.tsx) to extract sign-out logic
- [x] T004 [P] Analyze landing page color palette in frontend/src/app/page.tsx and frontend/src/styles/globals.css
- [x] T005 [P] Document current MetricsGrid, TaskList, and TaskModal component interfaces to ensure compatibility

---

## Phase 2: Color Palette & Styling Foundation

**Purpose**: Extract and apply landing page colors to dashboard styling

- [x] T006 Extract color variables from landing page (gradients, vibrant accents, shadows) and document in frontend/src/styles/dashboard-colors.css
- [x] T007 Update frontend/src/styles/globals.css to include landing page color palette variables
- [x] T008 [P] Define responsive breakpoint utilities in frontend/src/styles/globals.css (mobile: <768px, tablet: 768-1023px, desktop: ≥1024px)

---

## Phase 3: Top Bar Components

**Purpose**: Create new top navigation bar with logo and profile menu

- [x] T009 [P] Create TopBar component in frontend/src/components/dashboard/TopBar.tsx with sticky positioning, Taskflow logo (left), and profile button (right)
- [x] T010 [P] Create ProfileMenu component in frontend/src/components/dashboard/ProfileMenu.tsx using shadcn/ui DropdownMenu with Sign Out option
- [x] T011 Integrate sign-out logic from AccountSheet into ProfileMenu component (use Better Auth signOut function)
- [x] T012 [P] Add Avatar component (if not exists) in frontend/src/components/ui/Avatar.tsx for profile button display

---

## Phase 4: Layout Container Components

**Purpose**: Create new layout structure components

- [x] T013 [P] Create OverviewSection component in frontend/src/components/dashboard/OverviewSection.tsx as container for MetricsGrid and TaskList
- [x] T014 [P] Create AddTaskPanel component in frontend/src/components/dashboard/AddTaskPanel.tsx as dedicated add task area with TaskModal trigger

---

## Phase 5: Dashboard Layout Restructuring

**Purpose**: Modify dashboard layout to implement two-column responsive design

- [x] T015 Update dashboard layout in frontend/src/app/(dashboard)/layout.tsx to remove Sidebar and add TopBar
- [x] T016 Update dashboard page in frontend/src/app/(dashboard)/page.tsx to implement CSS Grid two-column layout (Overview left 60%, AddTaskPanel right 40%)
- [x] T017 Add responsive breakpoint styles to dashboard page for mobile stacking (<768px: single column, ≥1024px: two columns)
- [x] T018 Ensure generous spacing preserved (p-8 to p-10 main layout, gap-6 between sections)

---

## Phase 6: Component Integration

**Purpose**: Integrate existing components into new layout structure

- [x] T019 Integrate MetricsGrid component into OverviewSection in frontend/src/components/dashboard/OverviewSection.tsx
- [x] T020 Integrate TaskList component into OverviewSection below MetricsGrid
- [x] T021 Integrate TaskModal trigger into AddTaskPanel in frontend/src/components/dashboard/AddTaskPanel.tsx
- [x] T022 Verify task refresh logic preserved in ApiClient (frontend/src/services/api/ApiClient.ts) after task create/update/delete operations

---

## Phase 7: Component Removal

**Purpose**: Remove deprecated sidebar and mobile navigation components

**⚠️ CRITICAL**: Only execute after TopBar and ProfileMenu are fully functional

- [x] T023 Remove Sidebar component import and usage from frontend/src/app/(dashboard)/layout.tsx
- [x] T024 Delete Sidebar component file at frontend/src/components/dashboard/Sidebar.tsx
- [x] T025 Remove MobileNav component import and usage (if present in layout) - KEPT for mobile navigation
- [x] T026 Delete MobileNav component file at frontend/src/components/navigation/MobileNav.tsx (if exists) - KEPT for mobile navigation
- [x] T027 Delete AccountSheet component file at frontend/src/components/navigation/AccountSheet.tsx (if exists)

---

## Phase 8: Visual Polish & Color Application

**Purpose**: Apply landing page color palette and enhance visual design

- [x] T028 [P] Apply landing page gradient backgrounds to TopBar component
- [x] T029 [P] Apply vibrant accent colors to metric cards in MetricsGrid (preserve existing component, update via CSS classes)
- [x] T030 [P] Apply colorful hover states and transitions to AddTaskPanel using Framer Motion
- [x] T031 Update button styles in frontend/src/components/ui/Button.tsx to match landing page colorful aesthetic (if needed)
- [x] T032 Verify color contrast ratios meet WCAG AA standards for accessibility

---

## Phase 9: Responsive Behavior & Animations

**Purpose**: Ensure smooth responsive transitions and animations

- [ ] T033 [P] Add Framer Motion layout animations to OverviewSection and AddTaskPanel for smooth responsive transitions
- [ ] T034 [P] Test and fix mobile stacked layout (<768px) to ensure proper spacing and stacking order
- [ ] T035 [P] Test and fix desktop two-column layout (≥1024px) to ensure 60/40 split and proper alignment
- [ ] T036 Add sticky top bar behavior with proper z-index layering (TopBar stays visible on scroll)
- [ ] T037 Verify 0px CLS score maintained during layout rendering with min-height constraints

---

## Phase 10: Authentication & Functionality Validation

**Purpose**: Verify authentication flow and existing functionality preserved

- [ ] T038 Test sign-out functionality in ProfileMenu dropdown (should log out and redirect to /login)
- [ ] T039 Verify unauthenticated users are redirected to /login when accessing dashboard
- [ ] T040 Test task creation flow in AddTaskPanel (should open modal, create task, refresh list)
- [ ] T041 Test task completion toggle in TaskList (should update optimistically, preserve refresh logic)
- [ ] T042 Test task deletion flow (should remove from list, refresh metrics)
- [ ] T043 Verify MetricsGrid updates correctly after task operations (total, completed, pending counts)

---

## Phase 11: Cross-Browser & Device Testing

**Purpose**: Validate layout and functionality across browsers and devices

- [ ] T044 [P] Test layout in Chrome (desktop and mobile viewport)
- [ ] T045 [P] Test layout in Firefox (desktop and mobile viewport)
- [ ] T046 [P] Test layout in Safari (desktop and mobile viewport)
- [ ] T047 [P] Test layout in Edge (desktop and mobile viewport)
- [ ] T048 Test keyboard navigation for TopBar and ProfileMenu (Tab, Enter, Escape)
- [ ] T049 Verify ARIA labels on ProfileMenu dropdown for accessibility

---

## Phase 12: Performance & Final Polish

**Purpose**: Optimize performance and apply final refinements

- [ ] T050 Verify optimistic updates maintain <100ms perceived latency for task operations
- [ ] T051 Test animations run at 60fps using browser DevTools Performance panel
- [ ] T052 Verify layout does not shift during responsive breakpoint transitions
- [ ] T053 Test with 100+ tasks to ensure layout handles large data volumes
- [ ] T054 Final visual review - ensure landing page color palette consistently applied across all components

---

## Dependencies & Execution Strategy

### Dependency Graph

```text
Phase 1 (Preparation) → Phase 2 (Color Foundation)
                      ↓
Phase 3 (Top Bar) + Phase 4 (Layout Containers)
                      ↓
Phase 5 (Layout Restructuring) + Phase 6 (Component Integration)
                      ↓
Phase 7 (Component Removal) ← ⚠️ ONLY after Phase 5 & 6 complete
                      ↓
Phase 8 (Visual Polish) + Phase 9 (Responsive Behavior)
                      ↓
Phase 10 (Authentication Validation)
                      ↓
Phase 11 (Cross-Browser Testing) + Phase 12 (Performance)
```

### Parallel Execution Opportunities

**Phase 2 (Color Palette)**:
- T006, T007, T008 can run in parallel (different files)

**Phase 3 (Top Bar Components)**:
- T009, T010, T012 can run in parallel (independent components)

**Phase 4 (Layout Containers)**:
- T013, T014 can run in parallel (independent components)

**Phase 8 (Visual Polish)**:
- T028, T029, T030, T031 can run in parallel (different components)

**Phase 9 (Responsive)**:
- T033, T034, T035 can run in parallel (independent testing/fixes)

**Phase 11 (Cross-Browser)**:
- T044, T045, T046, T047 can run in parallel (independent browser testing)

### Critical Path

The following tasks MUST be completed in order (no parallelization):

1. T001-T005 (Audit current components)
2. T015-T017 (Layout restructuring)
3. T019-T022 (Component integration)
4. T023-T027 (Component removal - ONLY after integration complete)
5. T038-T043 (Authentication and functionality validation)

### Implementation Strategy

**Recommended Approach**: Incremental delivery with validation at each phase

1. **Phase 1-2**: Complete preparation and color foundation (1-2 hours)
2. **Phase 3-4**: Create new components (2-3 hours)
3. **Phase 5-6**: Restructure layout and integrate (2-3 hours)
4. **⚠️ VALIDATION CHECKPOINT**: Test that new layout works before removing old components
5. **Phase 7**: Remove deprecated components (30 minutes)
6. **Phase 8-9**: Apply polish and responsive behavior (2-3 hours)
7. **Phase 10-12**: Validate, test, and optimize (2-3 hours)

**Total Estimated Effort**: 10-15 hours

---

## Success Criteria

### Layout Structure
- ✅ No Sidebar component rendered in dashboard
- ✅ TopBar with Taskflow logo (left) and profile button (right) present on all authenticated pages
- ✅ ProfileMenu dropdown contains Sign Out option and works correctly
- ✅ Dashboard page shows two sections: Overview (MetricsGrid + TaskList) and AddTaskPanel

### Responsive Behavior
- ✅ Desktop (≥1024px): Two-column layout with 60/40 split (Overview left, AddTaskPanel right)
- ✅ Mobile (<768px): Stacked layout with Overview on top, AddTaskPanel below
- ✅ Smooth transitions between breakpoints without layout shift (0px CLS)

### Component Reuse
- ✅ MetricsGrid renders correctly in OverviewSection with existing functionality
- ✅ TaskList renders correctly in OverviewSection with optimistic updates
- ✅ TaskModal trigger works in AddTaskPanel
- ✅ Task refresh logic preserved after create/update/delete operations

### Visual Consistency
- ✅ Landing page color palette applied (gradients, vibrant accents)
- ✅ Clean Light Mode base maintained (white backgrounds, slate secondary)
- ✅ Generous spacing preserved (p-8 to p-10 layout, gap-6 sections)

### Authentication & Functionality
- ✅ Sign Out in ProfileMenu correctly logs user out and redirects to /login
- ✅ Unauthenticated users redirected to /login
- ✅ All task operations work (create, update, delete, complete)
- ✅ Metrics update correctly after task operations

### Performance
- ✅ Optimistic updates provide <100ms perceived latency
- ✅ Animations run at 60fps
- ✅ 0px CLS score maintained

### Accessibility
- ✅ Keyboard navigation works (Tab, Enter for ProfileMenu)
- ✅ ARIA labels present on interactive elements
- ✅ Color contrast meets WCAG AA standards

---

## Risk Mitigation

### Risk 1: Breaking Authentication During Sidebar Removal

**Mitigation**: Tasks T001-T003 audit existing components for auth logic before removal. Task T011 explicitly migrates sign-out logic to ProfileMenu BEFORE removing AccountSheet (T027).

### Risk 2: Layout Shift During Implementation

**Mitigation**: Task T037 verifies CLS score with min-height constraints. Task T052 validates no layout shift during responsive transitions.

### Risk 3: Component Integration Failures

**Mitigation**: Tasks T005 documents component interfaces. Tasks T019-T022 carefully integrate existing components. Validation checkpoint before Phase 7 ensures integration works before removing old components.

### Risk 4: Color Palette Clashing

**Mitigation**: Tasks T006-T007 extract exact landing page colors. Task T032 validates contrast ratios. Incremental application in Phase 8 allows visual review before finalizing.

---

## Notes for Implementation

**Important Reminders**:

1. **Do NOT delete Sidebar/MobileNav/AccountSheet until TopBar and ProfileMenu are fully functional** (validated in Phase 10)
2. **Preserve all existing component logic** - MetricsGrid, TaskList, TaskModal should not be modified internally
3. **Extract exact landing page colors** - do not guess or approximate gradients
4. **Test authentication flow thoroughly** - sign-out is critical functionality
5. **Verify responsive behavior on real devices** - browser DevTools viewports may not catch all edge cases
6. **Maintain 0px CLS score** - add min-height constraints where needed
7. **Keep ApiClient refresh logic intact** - do not modify task refresh behavior

**File Paths to Watch**:
- frontend/src/app/(dashboard)/layout.tsx (main layout file)
- frontend/src/app/(dashboard)/page.tsx (dashboard page)
- frontend/src/components/dashboard/* (all dashboard components)
- frontend/src/styles/globals.css (color palette)
- frontend/src/services/api/ApiClient.ts (refresh logic)

---

## Quick Reference: Task Count Summary

- **Phase 1 (Preparation)**: 5 tasks
- **Phase 2 (Color Foundation)**: 3 tasks
- **Phase 3 (Top Bar)**: 4 tasks
- **Phase 4 (Layout Containers)**: 2 tasks
- **Phase 5 (Layout Restructuring)**: 4 tasks
- **Phase 6 (Component Integration)**: 4 tasks
- **Phase 7 (Component Removal)**: 5 tasks
- **Phase 8 (Visual Polish)**: 5 tasks
- **Phase 9 (Responsive Behavior)**: 5 tasks
- **Phase 10 (Validation)**: 6 tasks
- **Phase 11 (Cross-Browser)**: 6 tasks
- **Phase 12 (Performance)**: 5 tasks

**Total: 54 tasks**

**Parallel Opportunities**: 18 tasks marked [P] can run in parallel within their phases

**Critical Path**: 15 tasks must run sequentially (audit → layout → integration → removal → validation)