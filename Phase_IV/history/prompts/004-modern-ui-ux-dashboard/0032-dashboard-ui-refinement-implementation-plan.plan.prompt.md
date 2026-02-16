---
id: 0032
title: Dashboard UI Refinement Implementation Plan
stage: plan
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5
feature: 004-modern-ui-ux-dashboard
branch: full-stack-todo-app
user: alihaidernoorani
command: /sp.plan
labels: ["ui-ux", "plan", "performance", "metrics", "typography", "responsiveness", "dashboard"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/004-modern-ui-ux-dashboard/plan-ui-refinement.md
tests:
 - Performance tests for <3s task action completion
---

## Prompt

Context:
The Todo application is fully implemented with:
- Next.js frontend
- FastAPI backend
- Better-auth authentication
- NeonDB database

Goal:
Improve the frontend design and ensure the task manager behaves smoothly, responsively, and predictably.
Focus on visual polish, consistent layout, responsive typography, and reliable task actions
(add, update, delete, complete).

Use available **UI/UX skills and subagents** wherever appropriate.

Primary problem areas:

1) System Status / Metrics Display
- Metric values overflow outside their containers.
- Cards must use a responsive CSS Grid layout with equal-width metric cards.
- Layout must adapt across breakpoints:
  - Desktop: horizontal grid
  - Tablet: two columns
  - Mobile: vertical stack

2) Task Action Responsiveness
- Task actions (add, update, delete, complete) feel unresponsive.
- UI does not update immediately after interactions.
- System must provide clear, immediate visual feedback.
- Buttons must prevent duplicate clicks and reflect loading states.
- All task actions must function reliably.
- **CRITICAL**: All task actions must complete within **less than 3 seconds** (optimistic update + server confirmation).

3) Typography and Layout Consistency
- Text must remain readable and visually balanced across all screen sizes.
- Font sizes must follow a consistent scale.
- Spacing and component sizing must follow a unified design system.

Instructions:
- Use the clarified UI/UX Dashboard spec and constitution as the source of truth.
- Produce a step-by-step, high-level implementation plan.
- Focus on layout structure, responsiveness, interaction feedback, and visual consistency.
- Indicate where specific **UI/UX skills or subagents** should be invoked.

## Response snapshot

Created comprehensive 3-phase implementation plan for dashboard UI refinement with integrated <3-second performance requirement:

**Plan Structure:**
- **Technical Context**: TypeScript/Next.js 16, React 19, performance targets (<100ms optimistic, <3s total)
- **Constitution Check**: ✅ All gates pass (Multi-Tier Isolation, Zero Manual Coding, etc.)
- **Project Structure**: 10 files to modify, 5 new utilities to create

**Phase 0: Research & Discovery**
- **Performance Baseline**: Measure current task action timings (P1)
- **Research Tasks**: Dashboard metrics (R1), High-performance optimistic UI (R2), Typography (R3), API timeout config (R4)
- **Component Audit**: Metrics overflow (A1), Task interaction performance (A2), Typography consistency (A3)
- **Deliverables**: research.md, performance-baseline.md, component-audit.md

**Phase 1: Design & Specifications**
- **Typography Scale** (D1): Mobile/Tablet/Desktop breakpoint-specific sizes
- **Metric Card Layout** (D2): CSS Grid minmax(160px, 1fr), responsive 1/2/4 columns
- **High-Performance Loading States** (D3): <100ms optimistic, <3s total, timeout handling
- **Performance Testing Spec** (D4): Test cases for all task actions <3s requirement

**Phase 2: Implementation (5 Waves)**
1. **Wave 1**: Utilities (formatNumber, performance tracking, API timeout wrapper)
2. **Wave 2**: Metrics display fix (grid layout, number abbreviation, 0px CLS)
3. **Wave 3**: High-performance task actions (useOptimistic, loading states, <3s completion)
4. **Wave 4**: Typography consistency (responsive scale application)
5. **Wave 5**: Visual testing & performance validation (verify <3s requirement)

**Critical Performance Requirements:**
- Optimistic UI update: <100ms
- Total task action completion: <3 seconds (add/update/delete/complete)
- API client timeout: 3 seconds with AbortController
- Error display: After 3s if server doesn't respond
- Performance monitoring: Track all action durations

**Key Design Decisions:**
- Number abbreviation: formatNumber() utility with k/M notation
- Grid layout: CSS Grid with responsive columns (1/2/4)
- Loading states: Inline spinners + disabled buttons
- API timeout: AbortController with 3s limit
- Optimistic updates: React 19 useOptimistic hook
- Performance tracking: trackActionTiming() utility

**Skill/Subagent Invocations:**
- Phase 0: ui-ux-futuristic-designer, Explore (audit + baseline)
- Phase 1: schema-designer, ui-structure-architect
- Phase 2: ui-interaction-designer, ui-ux-futuristic-designer, query-scope-enforcer

**Files to Create:**
- /frontend/lib/utils/formatNumber.ts
- /frontend/lib/utils/performance.ts
- /frontend/lib/utils/typography.ts
- /frontend/tests/components/TaskActions.perf.test.tsx
- specs/004-modern-ui-ux-dashboard/typography-scale.md
- specs/004-modern-ui-ux-dashboard/metric-card-spec.md
- specs/004-modern-ui-ux-dashboard/loading-states-spec.md
- specs/004-modern-ui-ux-dashboard/performance-testing-spec.md
- specs/004-modern-ui-ux-dashboard/performance-baseline.md

**Files to Modify:**
- /frontend/components/dashboard/MetricsGrid.tsx
- /frontend/components/dashboard/MetricCard.tsx
- /frontend/components/dashboard/TaskStream.tsx
- /frontend/components/task/TaskList.tsx
- /frontend/components/task/TaskItem.tsx
- /frontend/components/task/TaskActions.tsx
- /frontend/components/task/AddTaskModal.tsx
- /frontend/components/atoms/PrimaryButton.tsx
- /frontend/lib/api/client.ts
- /frontend/app/dashboard/page.tsx
- /frontend/styles/globals.css

## Outcome

- ✅ Impact: Created actionable 3-phase implementation plan addressing all three UI issues (metrics overflow, task responsiveness, typography) with integrated <3-second performance requirement; plan includes research, design, and implementation phases with clear deliverables and acceptance criteria
- 🧪 Tests: Performance tests specified for all task actions (<3s requirement), visual regression tests, interaction tests, accessibility audit
- 📁 Files: Created specs/004-modern-ui-ux-dashboard/plan-ui-refinement.md (comprehensive implementation plan with performance monitoring)
- 🔁 Next prompts: `/sp.tasks` to generate actionable task list from plan, then `/sp.implement` to execute implementation
- 🧠 Reflection: Successfully integrated user's <3-second performance requirement throughout all phases; plan emphasizes both perceived performance (optimistic updates <100ms) and actual completion time (<3s total); includes performance baseline measurement, monitoring utilities, timeout handling, and comprehensive testing strategy; risk analysis identifies API response time and network latency as key challenges with appropriate mitigations

## Evaluation notes (flywheel)

- Failure modes observed: Initial setup-plan.sh script failed due to non-standard branch naming; proceeded with manual plan creation using template; user interrupted initial file write to request performance requirement addition, successfully integrated <3s constraint throughout plan
- Graders run and results (PASS/FAIL): N/A (planning stage)
- Prompt variant (if applicable): Standard /sp.plan workflow with user-requested performance enhancement
- Next experiment (smallest change to try): Consider pre-defining common performance thresholds in constitution or templates; potentially create reusable performance monitoring patterns for future features; explore automated performance regression testing in CI/CD
