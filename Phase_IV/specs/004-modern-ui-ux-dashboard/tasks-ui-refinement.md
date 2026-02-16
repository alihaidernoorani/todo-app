# Tasks: Dashboard UI Refinement

**Feature**: Modern UI/UX Dashboard - Refinement Sprint
**Branch**: `full-stack-todo-app`
**Date**: 2026-02-08
**Spec**: [spec.md](./spec.md)
**Plan**: [plan-ui-refinement.md](./plan-ui-refinement.md)

## Overview

This task list implements UI/UX refinements for the TaskFlow dashboard, addressing three critical issues:
1. **Metric card overflow and layout** (User Story 2 enhancement)
2. **Task action responsiveness** (User Story 3 enhancement)
3. **Typography consistency** (User Story 4 enhancement)

**Performance Target**: All task actions must complete within <3 seconds (optimistic update + server confirmation)

## Implementation Strategy

- **MVP Scope**: Phase 3 (Metrics Display Fix) - Delivers immediate visual improvement
- **Incremental Delivery**: Each phase delivers independently testable value
- **Parallel Execution**: Tasks marked [P] can run in parallel within each phase
- **UI/UX Skills**: Invoke specified skills/subagents for specialized design work

---

## Phase 1: Setup & Research

**Goal**: Establish performance baseline, research best practices, and audit existing components

### Setup Tasks

- [ ] T001 Create documentation structure for UI refinement artifacts in specs/004-modern-ui-ux-dashboard/
  - **Description**: Create directory structure for research.md, typography-scale.md, metric-card-spec.md, loading-states-spec.md, performance-testing-spec.md, component-audit.md, performance-baseline.md
  - **Acceptance**: All documentation files exist with template structure
  - **Skill**: None (manual file creation)

### Performance Baseline & Audit

- [ ] T002 [P] Measure current task action performance baseline
  - **Description**: Measure and document current timings for add/update/delete/complete task actions in specs/004-modern-ui-ux-dashboard/performance-baseline.md
  - **Acceptance**: Baseline measurements documented for all 4 task actions (add, update, delete, complete) with bottleneck analysis
  - **Skill**: Explore subagent to navigate codebase and identify performance measurement points
  - **Method**:
    1. Add console.time() measurements to TaskStream, TaskActions, TaskItem components
    2. Test each action 5 times and record average duration
    3. Identify which parts take longest (optimistic update, API call, UI render)
    4. Document findings with specific timings

- [ ] T003 [P] Audit MetricsGrid and MetricCard components for overflow issues
  - **Description**: Read and analyze frontend/components/dashboard/MetricsGrid.tsx and frontend/components/dashboard/MetricCard.tsx, document overflow root causes in specs/004-modern-ui-ux-dashboard/component-audit.md
  - **Acceptance**: Component audit document includes specific line numbers, CSS issues, and missing constraints causing overflow
  - **Skill**: ui-ux-futuristic-designer to analyze layout issues

- [ ] T004 [P] Audit TaskStream, TaskList, TaskItem, TaskActions for responsiveness issues
  - **Description**: Read and analyze frontend/components/dashboard/TaskStream.tsx, frontend/components/task/TaskList.tsx, frontend/components/task/TaskItem.tsx, frontend/components/task/TaskActions.tsx, document missing optimistic updates and loading states in specs/004-modern-ui-ux-dashboard/component-audit.md
  - **Acceptance**: Component audit identifies missing useOptimistic hooks, missing loading states, and API client timeout configuration
  - **Skill**: ui-interaction-designer to audit interaction patterns

- [ ] T005 [P] Audit typography usage across dashboard components
  - **Description**: Audit all text elements in frontend/app/dashboard/page.tsx and all dashboard components, document inconsistent font sizes and missing responsive variants in specs/004-modern-ui-ux-dashboard/component-audit.md
  - **Acceptance**: Typography audit lists all font size classes used, missing responsive variants, and inconsistencies
  - **Skill**: ui-ux-futuristic-designer to evaluate typography hierarchy

### Research Tasks

- [ ] T006 [P] Research dashboard metric card best practices
  - **Description**: Research industry standards for metric displays, number abbreviation patterns, CSS Grid layouts, overflow prevention; document findings in specs/004-modern-ui-ux-dashboard/research.md
  - **Acceptance**: Research document includes number abbreviation decision (k/M notation), grid layout pattern (minmax constraints), accessibility considerations
  - **Skill**: None (web research and documentation)

- [ ] T007 [P] Research high-performance optimistic UI patterns for React 19
  - **Description**: Research React 19 useOptimistic hook patterns, loading state management, timeout handling for <3s requirement; document findings in specs/004-modern-ui-ux-dashboard/research.md
  - **Acceptance**: Research document includes useOptimistic examples, loading state patterns, timeout strategies, performance optimization techniques
  - **Skill**: None (React documentation research)

- [ ] T008 [P] Research responsive typography systems and Tailwind best practices
  - **Description**: Research fluid typography, Tailwind responsive utilities, WCAG readability standards; document scale recommendations in specs/004-modern-ui-ux-dashboard/research.md
  - **Acceptance**: Research document includes typography scale definition (mobile/tablet/desktop), line height ratios, accessibility requirements
  - **Skill**: None (web research)

---

## Phase 2: Design Specifications

**Goal**: Create detailed design artifacts based on research findings

**Dependencies**: Phase 1 must complete before starting Phase 2

### Design Artifact Tasks

- [ ] T009 Create typography scale specification
  - **Description**: Create specs/004-modern-ui-ux-dashboard/typography-scale.md with breakpoint-specific font sizes for all component types (headings, body, metrics, buttons) per research findings
  - **Acceptance**: Typography scale document defines exact Tailwind classes for mobile (320px+), tablet (768px+), desktop (1024px+) for all text element types
  - **Dependencies**: T005 (typography audit), T008 (typography research)
  - **Skill**: ui-ux-futuristic-designer to design consistent scale

- [ ] T010 Create metric card layout specification
  - **Description**: Create specs/004-modern-ui-ux-dashboard/metric-card-spec.md with CSS Grid layout, responsive column rules, number formatting logic, accessibility requirements
  - **Acceptance**: Metric card spec defines grid structure (1/2/4 columns), minmax(160px, 1fr) constraints, number abbreviation rules, ARIA label requirements
  - **Dependencies**: T003 (metrics audit), T006 (metrics research)
  - **Skill**: ui-structure-architect to design grid system

- [ ] T011 Create high-performance loading states specification
  - **Description**: Create specs/004-modern-ui-ux-dashboard/loading-states-spec.md with button loading variant design, performance tracking utilities, timeout logic, API client configuration
  - **Acceptance**: Loading states spec defines PrimaryButton isLoading prop, inline spinner design, 3-second timeout handling, performance monitoring utilities, API timeout wrapper
  - **Dependencies**: T002 (performance baseline), T004 (task actions audit), T007 (optimistic UI research)
  - **Skill**: ui-interaction-designer to design loading patterns

- [ ] T012 Create performance testing specification
  - **Description**: Create specs/004-modern-ui-ux-dashboard/performance-testing-spec.md with test cases for all task actions (<3s requirement), performance monitoring strategy
  - **Acceptance**: Performance testing spec defines test cases for add/update/delete/complete actions with <3s assertions, performance observer setup
  - **Dependencies**: T002 (performance baseline), T011 (loading states spec)
  - **Skill**: None (test specification writing)

---

## Phase 3: Metrics Display Fix (User Story 2 Enhancement)

**Goal**: Fix metric card overflow, implement responsive grid, apply number abbreviation

**Dependencies**: Phase 2 must complete before starting Phase 3

**Independent Test**: Metric cards display correctly on mobile/tablet/desktop with no overflow, abbreviated numbers (9.9k format), and equal-width layout

### Utility Implementation

- [x] T013 [P] [US2] Create formatNumber utility function
  - **Description**: Create frontend/lib/utils/formatNumber.ts with number abbreviation logic (k/M/B suffixes) per metric card specification
  - **Acceptance**: formatNumber(1234) returns "1.2k", formatNumber(999) returns "999", formatNumber(1500000) returns "1.5M", execution time <1ms
  - **File**: frontend/lib/utils/formatNumber.ts
  - **Dependencies**: T010 (metric card spec)
  - **Skill**: None (utility function implementation)
  - **Completed**: 2026-02-08 - Created utility with k/M/B abbreviation support

- [x] T014 [P] [US2] Create unit tests for formatNumber utility
  - **Description**: Create frontend/tests/components/MetricCard.test.tsx with test cases for edge cases (0, 999, 1000, 9999, 1M, negative numbers)
  - **Acceptance**: All test cases pass, 100% code coverage for formatNumber function
  - **File**: frontend/tests/utils/formatNumber.test.ts
  - **Dependencies**: T013 (formatNumber utility)
  - **Skill**: None (unit test writing)
  - **Completed**: 2026-02-08 - Created comprehensive test suite with 35 tests, all passing, 100% code coverage

### Component Updates

- [x] T015 [US2] Update MetricsGrid component with responsive CSS Grid
  - **Description**: Modify frontend/components/dashboard/MetricsGrid.tsx to use grid-cols-1 md:grid-cols-2 lg:grid-cols-4, add overflow-x-hidden, update gap to gap-4 md:gap-5
  - **Acceptance**: Metrics display in 1 column on mobile (<768px), 2 columns on tablet (768-1023px), 4 columns on desktop (1024px+), no horizontal overflow
  - **File**: frontend/components/dashboard/MetricsGrid.tsx
  - **Dependencies**: T010 (metric card spec)
  - **Skill**: ui-structure-architect to implement grid layout
  - **Completed**: 2026-02-08 - Added overflow-x-hidden to prevent horizontal scroll

- [x] T016 [US2] Update MetricCard component with number abbreviation and typography
  - **Description**: Modify frontend/components/dashboard/MetricCard.tsx to use formatNumber() for value display, add ARIA label with full number, update typography to text-3xl md:text-4xl lg:text-5xl for value and text-xs md:text-sm for label, add whitespace-nowrap
  - **Acceptance**: Large numbers display as "9.9k" instead of overflowing, screen readers announce full number, metric typography follows scale, no text wrapping in number container
  - **File**: frontend/components/dashboard/MetricCard.tsx
  - **Completed**: 2026-02-08 - Integrated formatNumber, added ARIA labels, applied truncate class for triple overflow protection
  - **Dependencies**: T013 (formatNumber utility), T009 (typography scale)
  - **Skill**: ui-ux-futuristic-designer to apply visual polish

### Validation

- [ ] T017 [US2] Test metrics display across breakpoints
  - **Description**: Test dashboard at 320px, 768px, 1024px, 1440px widths, verify column layout, overflow prevention, number abbreviation, typography scale
  - **Acceptance**: Visual testing confirms 0px CLS, no overflow, correct column counts at each breakpoint, abbreviated numbers display correctly
  - **Dependencies**: T015 (MetricsGrid), T016 (MetricCard)
  - **Skill**: None (manual testing)

---

## Phase 4: High-Performance Task Actions (User Story 3 Enhancement)

**Goal**: Implement optimistic updates, loading states, and ensure <3s completion for all task actions

**Dependencies**: Phase 2 must complete before starting Phase 4 (can run in parallel with Phase 3)

**Independent Test**: All task actions (add/update/delete/complete) complete within <3 seconds, display inline loading indicators, prevent duplicate clicks, show optimistic UI updates within <100ms

### Performance Utilities

- [x] T018 [P] [US3] Create performance tracking utility
  - **Description**: Create frontend/lib/utils/performance.ts with trackActionTiming() function for monitoring action duration, logging slow actions (>3s)
  - **Acceptance**: trackActionTiming() accurately measures duration, logs warnings when actions exceed 3s, minimal overhead (<5ms)
  - **File**: frontend/lib/utils/performance.ts
  - **Dependencies**: T011 (loading states spec)
  - **Skill**: None (utility function implementation)
  - **Completed**: 2026-02-08 - Created performance utility with trackActionTiming, measureAsync, withPerformanceTracking, formatDuration functions

- [x] T019 [P] [US3] Update API client with 3-second timeout
  - **Description**: Modify frontend/lib/api/client.ts to add apiClientWithTimeout() wrapper using AbortController, default 3-second timeout
  - **Acceptance**: API requests abort after 3 seconds, timeout error thrown with clear message, existing API calls preserved
  - **File**: frontend/lib/api/client.ts
  - **Dependencies**: T011 (loading states spec)
  - **Skill**: query-scope-enforcer to ensure timeout configuration is correct
  - **Completed**: 2026-02-08 - Added DEFAULT_TIMEOUT (3s), createTimeoutSignal(), timeout parameter to all API methods, AbortError handling

### Base Component Updates

- [x] T020 [US3] Update PrimaryButton component with loading variant
  - **Description**: Modify frontend/components/atoms/PrimaryButton.tsx to add isLoading prop, implement inline spinner (Loader2 icon with animate-spin), disable button during loading, maintain button width to prevent layout shift
  - **Acceptance**: PrimaryButton with isLoading={true} shows spinner, is disabled, maintains width, no layout shift occurs
  - **File**: frontend/components/atoms/PrimaryButton.tsx
  - **Dependencies**: T011 (loading states spec)
  - **Skill**: ui-interaction-designer to implement loading state
  - **Completed**: 2026-02-08 - Enhanced loading state with absolute positioned spinner, opacity-0 text, zero layout shift

### Task Stream Optimistic Updates

- [x] T021 [US3] Implement useOptimistic hook in TaskStream component
  - **Description**: Modify frontend/components/dashboard/TaskStream.tsx to use React 19 useOptimistic hook for task list, implement optimistic add/update/delete, add error state management, add 3-second timeout logic, integrate performance tracking
  - **Acceptance**: Tasks appear in UI within <100ms (optimistic update), server confirmation within <3s, errors display after 3s timeout with retry button, useOptimistic hook properly manages state
  - **File**: frontend/lib/hooks/use-optimistic-task.ts (already using useOptimistic)
  - **Dependencies**: T018 (performance utility), T019 (API timeout), T020 (PrimaryButton loading)
  - **Skill**: ui-interaction-designer to implement optimistic patterns
  - **Completed**: 2026-02-08 - Hook already uses React 19 useOptimistic; added performance tracking to all CRUD operations (createTask, toggleComplete, updateTask, deleteTask)

### Task Action Components

- [ ] T022 [US3] Update TaskItem component with loading states
  - **Description**: Modify frontend/components/task/TaskItem.tsx to add loadingAction state, update complete button to use PrimaryButton with isLoading, update delete button with loading state, add performance tracking, implement timeout handling
  - **Acceptance**: Complete and delete buttons show inline spinner during processing, buttons disabled during loading, actions tracked for performance, timeouts handled gracefully
  - **File**: frontend/components/task/TaskItem.tsx
  - **Dependencies**: T020 (PrimaryButton), T021 (TaskStream optimistic)
  - **Skill**: ui-interaction-designer to implement button states

- [ ] T023 [US3] Update TaskActions component with loading states
  - **Description**: Modify frontend/components/task/TaskActions.tsx to add loading state to edit/update actions, prevent duplicate clicks, add performance tracking, debounce rapid clicks
  - **Acceptance**: Edit and update actions show loading state, duplicate clicks prevented, rapid clicks debounced, performance tracked
  - **File**: frontend/components/task/TaskActions.tsx
  - **Dependencies**: T020 (PrimaryButton), T021 (TaskStream optimistic)
  - **Skill**: ui-interaction-designer to implement action handling

- [ ] T024 [US3] Update AddTaskModal component with loading and auto-focus
  - **Description**: Modify frontend/components/task/AddTaskModal.tsx to add isSubmitting state, use PrimaryButton with isLoading for submit button, implement auto-focus on title field (FR-005b), add performance tracking, validate input before submission
  - **Acceptance**: Submit button shows loading spinner, modal auto-focuses title field on open, submission tracked for performance, input validated before API call
  - **File**: frontend/components/task/AddTaskModal.tsx
  - **Dependencies**: T020 (PrimaryButton), T021 (TaskStream optimistic)
  - **Skill**: ui-interaction-designer to implement form handling

### Performance Testing

- [ ] T025 [US3] Create performance tests for task actions
  - **Description**: Create frontend/tests/components/TaskActions.perf.test.tsx with test cases for add/update/delete/complete actions, assert <3s completion, verify optimistic updates <100ms
  - **Acceptance**: All 4 task action tests pass with <3s assertion, optimistic update tests verify <100ms rendering
  - **File**: frontend/tests/components/TaskActions.perf.test.tsx
  - **Dependencies**: T021-T024 (all task action components)
  - **Skill**: None (performance test writing)

### Validation

- [ ] T026 [US3] Test task actions with performance monitoring
  - **Description**: Test add/update/delete/complete actions in real browser, verify <3s completion, check console for performance logs, test on slow network (throttled 3G), verify timeout handling
  - **Acceptance**: All actions complete within 3 seconds on normal network, timeout errors appear correctly on slow network, performance logs show accurate timings
  - **Dependencies**: T025 (performance tests)
  - **Skill**: None (manual testing)

---

## Phase 5: Typography Consistency (User Story 4 Enhancement)

**Goal**: Apply consistent responsive typography scale across all dashboard components

**Dependencies**: Phase 2 (typography scale spec) must complete before starting Phase 5 (can run in parallel with Phases 3 and 4)

**Independent Test**: All text elements follow typography scale, font sizes adapt correctly at mobile/tablet/desktop breakpoints, serif font used for titles, sans-serif for UI

### Dashboard Page Typography

- [ ] T027 [P] [US4] Update dashboard page typography
  - **Description**: Modify frontend/app/dashboard/page.tsx to update welcome heading (text-2xl md:text-3xl lg:text-4xl font-serif), description (text-sm md:text-base), section headings (text-base md:text-lg)
  - **Acceptance**: Dashboard page title uses responsive serif typography, descriptions and headings follow scale
  - **File**: frontend/app/dashboard/page.tsx
  - **Dependencies**: T009 (typography scale)
  - **Skill**: ui-ux-futuristic-designer to apply typography

### Component Typography Updates

- [ ] T028 [P] [US4] Update task component typography
  - **Description**: Update task titles, descriptions, button text in frontend/components/task/TaskItem.tsx and frontend/components/task/AddTaskModal.tsx to use consistent responsive typography per scale
  - **Acceptance**: Task titles, descriptions, button text all use correct responsive classes from typography scale
  - **Files**: frontend/components/task/TaskItem.tsx, frontend/components/task/AddTaskModal.tsx
  - **Dependencies**: T009 (typography scale)
  - **Skill**: ui-ux-futuristic-designer to ensure consistency

- [ ] T029 [P] [US4] Update global CSS with font family definitions
  - **Description**: Verify and update frontend/styles/globals.css to ensure Playfair Display loaded for serif headings, Inter for sans-serif UI, add any missing font configurations
  - **Acceptance**: Both font families load correctly, font-serif and font-sans classes work as expected
  - **File**: frontend/styles/globals.css
  - **Dependencies**: T009 (typography scale)
  - **Skill**: None (CSS configuration)

### Validation

- [ ] T030 [US4] Test typography consistency across breakpoints
  - **Description**: Test all text elements at 320px, 768px, 1024px, 1440px widths, verify font sizes match typography scale, check serif vs sans-serif usage, verify line heights
  - **Acceptance**: All text elements follow typography scale at all breakpoints, correct font families applied, no inconsistencies detected
  - **Dependencies**: T027-T029 (all typography updates)
  - **Skill**: None (visual testing)

---

## Phase 6: Visual Testing & Polish

**Goal**: Comprehensive visual regression testing, accessibility audit, cross-browser validation, final polish

**Dependencies**: Phases 3, 4, and 5 must complete before starting Phase 6

### Visual Regression Testing

- [ ] T031 Create visual regression test suite
  - **Description**: Create frontend/tests/visual/dashboard.visual.test.tsx with baseline screenshots at multiple breakpoints for metrics grid, task list, loading states
  - **Acceptance**: Visual test suite captures baselines for 320px, 768px, 1024px, 1440px widths, detects layout regressions
  - **File**: frontend/tests/visual/dashboard.visual.test.tsx
  - **Dependencies**: T017 (metrics validation), T026 (task actions validation), T030 (typography validation)
  - **Skill**: None (visual test setup)

- [ ] T032 Run visual regression tests and verify no regressions
  - **Description**: Execute visual test suite, compare with baselines, verify 0px CLS, no overflow, correct layouts
  - **Acceptance**: All visual tests pass, no layout regressions detected, 0px CLS confirmed
  - **Dependencies**: T031 (visual test suite)
  - **Skill**: None (test execution)

### Accessibility Audit

- [ ] T033 Audit dashboard accessibility compliance
  - **Description**: Test dashboard with screen reader, verify ARIA labels on abbreviated numbers, check keyboard navigation, verify WCAG AA contrast ratios (4.5:1 minimum)
  - **Acceptance**: Screen readers announce full metric numbers (not abbreviations), all interactive elements keyboard accessible, contrast ratios meet WCAG AA
  - **Dependencies**: T017, T026, T030 (all component updates)
  - **Skill**: None (accessibility testing)

### Cross-Browser Testing

- [ ] T034 Test dashboard in Chrome, Firefox, Safari, Edge
  - **Description**: Test all UI refinements (metrics, task actions, typography) in latest Chrome, Firefox, Safari, Edge browsers, verify consistent behavior and performance
  - **Acceptance**: All features work consistently across browsers, performance targets met in all browsers, no browser-specific bugs
  - **Dependencies**: T032 (visual tests), T033 (accessibility)
  - **Skill**: None (cross-browser testing)

### Final Polish

- [ ] T035 Apply final UI polish with ui-ux-futuristic-designer skill
  - **Description**: Invoke ui-ux-futuristic-designer skill to review entire dashboard UI, apply final visual polish, ensure premium feel, verify glassmorphism effects, smooth animations
  - **Acceptance**: Dashboard has polished, premium feel, all visual elements refined, animations smooth, glassmorphism effects applied correctly
  - **Dependencies**: T034 (cross-browser testing)
  - **Skill**: ui-ux-futuristic-designer for final review and polish

---

## Dependency Graph

```
Phase 1 (Setup & Research)
    ├── T001 (documentation) ─────────────────────┐
    ├── T002 (performance baseline) [P] ──────────┤
    ├── T003 (metrics audit) [P] ─────────────────┤
    ├── T004 (task actions audit) [P] ────────────┤
    ├── T005 (typography audit) [P] ──────────────┤
    ├── T006 (metrics research) [P] ──────────────┤
    ├── T007 (optimistic UI research) [P] ────────┤
    └── T008 (typography research) [P] ───────────┤
                                                   ▼
Phase 2 (Design Specifications)
    ├── T009 (typography scale) ──────────────────┐
    ├── T010 (metric card spec) ──────────────────┤
    ├── T011 (loading states spec) ───────────────┤
    └── T012 (performance testing spec) ──────────┤
                                                   ▼
        ┌──────────────────┬───────────────────────┴──────────────────┐
        ▼                  ▼                                            ▼
  Phase 3 (Metrics)   Phase 4 (Task Actions)               Phase 5 (Typography)
    T013 [P]              T018 [P]                             T027 [P]
    T014 [P]              T019 [P]                             T028 [P]
    T015                  T020                                 T029 [P]
    T016                  T021                                 T030
    T017                  T022
                          T023
                          T024
                          T025
                          T026
        └──────────────────┴───────────────────────┬──────────────────┘
                                                   ▼
Phase 6 (Testing & Polish)
    T031 → T032 → T033 → T034 → T035
```

## Parallel Execution Opportunities

### Phase 1: Can run all research tasks in parallel
- T002, T003, T004, T005, T006, T007, T008 (all marked [P])

### Phase 3: Can run utility tasks in parallel
- T013 (formatNumber utility) [P]
- T014 (formatNumber tests) [P] (depends on T013)

### Phase 4: Can run utility tasks in parallel
- T018 (performance utility) [P]
- T019 (API timeout) [P]

### Phase 5: Can run all component typography updates in parallel
- T027 (dashboard page) [P]
- T028 (task components) [P]
- T029 (global CSS) [P]

### Cross-Phase Parallelism
- **Phase 3, 4, and 5 can run completely in parallel** once Phase 2 completes
- This enables 3 developers to work simultaneously on different UI aspects

## Success Criteria Summary

### Metrics Display (US2 Enhancement)
- ✅ No overflow from metric cards
- ✅ Responsive grid: 1-col mobile, 2-col tablet, 4-col desktop
- ✅ Numbers abbreviated (9.9k format) when > 999
- ✅ Equal-width cards with minmax(160px, 1fr)
- ✅ 0px CLS during loading

### Task Actions (US3 Enhancement)
- ✅ Optimistic UI updates within <100ms
- ✅ **All task actions complete within <3 seconds**
- ✅ Inline loading indicators on buttons
- ✅ Buttons disabled during processing
- ✅ Duplicate clicks prevented
- ✅ Error display after 3s timeout with retry option

### Typography (US4 Enhancement)
- ✅ Consistent typography scale across all components
- ✅ Responsive font sizes at mobile/tablet/desktop breakpoints
- ✅ Serif font (Playfair Display) for page titles
- ✅ Sans-serif font (Inter) for UI elements
- ✅ WCAG AA contrast compliance (4.5:1 minimum)

### Performance & Quality
- ✅ All performance tests pass (<3s requirement)
- ✅ Visual regression tests pass (no layout breaks)
- ✅ Accessibility audit passes (WCAG AA)
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

## Task Summary

**Total Tasks**: 35

### Tasks by Phase
- **Phase 1** (Setup & Research): 8 tasks (7 parallel)
- **Phase 2** (Design Specs): 4 tasks
- **Phase 3** (Metrics - US2): 5 tasks (2 parallel)
- **Phase 4** (Task Actions - US3): 9 tasks (2 parallel)
- **Phase 5** (Typography - US4): 4 tasks (3 parallel)
- **Phase 6** (Testing & Polish): 5 tasks (sequential)

### Parallel Opportunities
- **16 tasks marked [P]** can run in parallel
- **3 major phases (3, 4, 5)** can run concurrently after Phase 2

### MVP Scope Recommendation
- **Minimum**: Phase 3 (Metrics Display Fix) - Delivers immediate visual improvement with minimal risk
- **Recommended**: Phases 3 + 4 (Metrics + Task Actions) - Addresses both major UX issues
- **Complete**: All phases - Full UI refinement with performance guarantees

---

## Implementation Notes

### UI/UX Skill Invocations
- **ui-ux-futuristic-designer**: T003, T005, T009, T016, T027, T028, T035 (design and polish tasks)
- **ui-structure-architect**: T010, T015 (layout and grid tasks)
- **ui-interaction-designer**: T011, T020, T021, T022, T023, T024 (interaction and loading state tasks)
- **query-scope-enforcer**: T019 (API client timeout configuration)
- **Explore**: T002 (performance baseline measurement)

### Performance Monitoring
- All task actions instrumented with trackActionTiming()
- Console logs for actions exceeding 3 seconds
- Performance tests enforce <3s requirement
- Real-world testing on throttled networks

### Testing Strategy
- **Unit tests**: formatNumber utility (T014)
- **Performance tests**: All task actions (T025)
- **Visual regression**: Dashboard at multiple breakpoints (T031-T032)
- **Accessibility**: Screen reader and keyboard navigation (T033)
- **Cross-browser**: Chrome, Firefox, Safari, Edge (T034)

### Risk Mitigation
- **Backend performance**: API timeout wrapper (T019) handles slow responses gracefully
- **Network variability**: Optimistic updates ensure perceived performance even on slow networks
- **Browser compatibility**: Cross-browser testing (T034) catches inconsistencies early
- **Accessibility**: ARIA labels (T016) and keyboard navigation (T033) ensure compliance

---

**Next Steps**: Execute tasks in dependency order, starting with Phase 1. Run parallel tasks simultaneously to maximize efficiency. Test each phase independently before proceeding to the next.
