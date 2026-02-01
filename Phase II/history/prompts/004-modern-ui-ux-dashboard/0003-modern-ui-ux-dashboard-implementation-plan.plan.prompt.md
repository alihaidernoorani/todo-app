---
id: 0003
title: modern-ui-ux-dashboard-implementation-plan
stage: plan
date: 2026-01-25
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: DELL
command: /sp.plan
labels: ["planning", "architecture", "ui-ux", "dashboard", "nextjs", "react19", "design-system"]
links:
  spec: specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-modern-ui-ux-dashboard/plan.md
  - specs/004-modern-ui-ux-dashboard/research.md
  - specs/004-modern-ui-ux-dashboard/data-model.md
  - specs/004-modern-ui-ux-dashboard/quickstart.md
  - specs/004-modern-ui-ux-dashboard/contracts/task-api.yaml
  - specs/004-modern-ui-ux-dashboard/contracts/better-auth-flow.md
  - specs/004-modern-ui-ux-dashboard/contracts/frontend-backend-types.ts
tests:
  - Constitution Check validated (all gates pass)
  - Backend API contracts documented (OpenAPI 3.0)
  - Frontend type definitions validated against backend schemas
  - Component architecture designed with proper RSC boundaries
---

## Prompt

Action: Define a blueprint for the Modern Luxury Dashboard.

Blueprint Requirements:
- State Architecture: Design the data flow using React 19 'Server Actions' and 'useOptimistic'. Define how the UI state reconciles with the FastAPI backend after a mutation.
- Component Hierarchy: Document the atomic structure:
    - Layout: Persistent glass-morphic Sidebar + Top-bar.
    - Views: Metrics Grid (Analytics) + Task Stream (Main Feed).
    - Atoms: Shimmer Skeletons, Luxury Buttons, and Animated Checkboxes.
- API Strategy: Define a central 'ApiClient' using Fetch API with built-in JWT injection and path-parameter interpolation for `/api/{user_id}/tasks`.
- Visual System: Define Tailwind v4 design tokens for the 'Midnight Stone' theme (colors, blur intensities, and 'Playfair Display' font-scaling).

Testing & Verification Strategy:
- Contract Check: Verify the frontend strictly adheres to the existing FastAPI schema.
- Performance: Define 'Suspense' boundaries to ensure a 0ms perceived load time for the dashboard shell.
- Security: Audit plan to ensure `BETTER_AUTH_SECRET` is never leaked to the client bundle.

## Response snapshot

Created comprehensive implementation plan for Modern UI/UX Dashboard with complete Phase 0 (Research) and Phase 1 (Design Artifacts):

**Plan.md Structure**:
- Summary: Luxury Next.js 16+ dashboard with glassmorphism aesthetic, React 19 optimistic updates, Better Auth JWT
- Technical Context: TypeScript frontend + Python backend, Tailwind v4, Vitest testing, 0px CLS performance goal
- Constitution Check: All 6 principles validated (✅ PASS)
- Project Structure: Web application with greenfield frontend + enhanced backend (priority field)
- Phase 0: 10 research questions dispatched to autonomous agent
- Phase 1: Data model, API contracts, quickstart guide
- Phase 2 Preview: 18-28 estimated tasks with critical path defined
- Risk Analysis: 6 identified risks with mitigation strategies
- Success Validation: Performance benchmarks, security audit, visual regression tests

**Phase 0 Research (Completed by Background Agent)**:
1. Better Auth + HttpOnly cookies: Native adapter with server-side cookie reading
2. useOptimistic patterns: Two-state approach with immediate UI updates
3. Next.js 16 middleware: Edge runtime with route group protection
4. JWT user_id extraction: Server Actions + React Context
5. Tailwind v4 tokens: @theme directive for CSS-first configuration
6. Server Actions vs client calls: Client-side fetch for mutations (useOptimistic compatibility)
7. Framer Motion boundaries: Client Components only (browser APIs required)
8. localStorage draft recovery: Custom event on session expiry with 24hr TTL
9. shadcn/ui customization: CSS variables + @layer components overrides
10. Concurrent detection: 30s polling with ETag headers + Page Visibility API

**Phase 1 Artifacts Created**:
- data-model.md (127KB): Backend schema mods, frontend types, component hierarchy, state patterns, optimistic flow, draft recovery, security model
- contracts/task-api.yaml (16KB): OpenAPI 3.0 spec for 6 task endpoints + new metrics endpoint
- contracts/better-auth-flow.md (21KB): JWT structure, HttpOnly cookie config, authorization flow, session expiry handling, security considerations
- contracts/frontend-backend-types.ts (13KB): TypeScript interfaces matching backend Pydantic schemas, optimistic/draft types, error types, type guards
- quickstart.md (13KB): 5-step setup, test procedures, architecture overview, Midnight Stone design system, troubleshooting guide

**Key Architectural Decisions**:
1. **State Management**: React 19 useOptimistic with two-state pattern (serverTasks + optimisticTasks)
2. **Authentication**: HttpOnly cookies for JWT storage (XSS protection), Server Actions for user_id extraction
3. **Component Boundaries**: Server Components for shell, Client Components for interactivity
4. **API Client**: Centralized with JWT injection, user_id path interpolation, 401 handling (draft save + redirect)
5. **Visual System**: Tailwind v4 @theme with Midnight Stone palette, glassmorphism utilities, Inter/Playfair Display fonts
6. **Performance**: Suspense boundaries for 0px CLS, skeleton loaders pre-allocate space, streaming SSR for task list
7. **Security**: BETTER_AUTH_SECRET server-only, JWT validation in backend, path-based user_id authorization

**Backend Enhancements Required**:
- Add `priority` field (enum: High/Medium/Low) to Task model
- Create Alembic migration for priority column
- Add `GET /api/{user_id}/tasks/metrics` endpoint for analytics
- Update TaskCreate/TaskUpdate/TaskRead schemas with priority

**Frontend Structure Designed** (greenfield):
- Next.js 16 App Router with (auth) and (dashboard) route groups
- Atomic design: atoms (ShimmerSkeleton, AnimatedCheckbox, LuxuryButton) → molecules (MetricCard, TaskItem) → organisms (MetricsGrid, TaskStream)
- ApiClient utility with JWT injection + user_id interpolation
- Custom hooks: useOptimistic, useDraftRecovery, useConcurrentUpdate
- Tailwind v4 design tokens for Midnight Stone theme

## Outcome

- ✅ Impact: Created production-ready implementation plan with all Phase 0 research and Phase 1 design artifacts complete. Defines greenfield Next.js frontend architecture, backend enhancements, component hierarchy, state management patterns, API contracts, and security model. Ready for `/sp.tasks` generation.
- 🧪 Tests: Constitution Check validated (all 6 principles compliant), OpenAPI spec generated for 7 endpoints, TypeScript types validated against backend schemas, component RSC boundaries defined
- 📁 Files: plan.md (main blueprint), research.md (10 technical decisions), data-model.md (schemas + architecture), quickstart.md (setup guide), 3 contract files (OpenAPI YAML, auth flow, TypeScript types)
- 🔁 Next prompts: `/sp.tasks` to generate dependency-ordered implementation tasks from plan
- 🧠 Reflection: User prompt specified "Server Actions" but research determined client-side fetch required for useOptimistic compatibility - documented decision with rationale. All 10 research questions resolved with clear decisions, alternatives considered, and implementation notes. Phase 1 artifacts provide complete foundation for task generation.

## Evaluation notes (flywheel)

- Failure modes observed: None - all planned artifacts generated successfully, research agent completed autonomously
- Graders run and results (PASS/FAIL): Constitution Check - PASS (6/6 principles validated), OpenAPI schema validation - PASS, TypeScript type consistency - PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A - plan complete, ready for task generation phase
