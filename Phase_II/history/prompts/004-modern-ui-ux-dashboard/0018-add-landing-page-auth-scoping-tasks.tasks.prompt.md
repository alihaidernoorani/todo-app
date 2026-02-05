---
id: 0018
title: Add landing page and auth scoping tasks
stage: tasks
date: 2026-02-03
surface: agent
model: claude-sonnet-4-5
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: alihaidernoorani
command: /sp.tasks
labels: ["landing-page", "auth-scoping", "public-routes", "task-generation"]
links:
  spec: /mnt/c/Users/DELL/Desktop/The_Evolution_of_todo/Phase_II/specs/004-modern-ui-ux-dashboard/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - /mnt/c/Users/DELL/Desktop/The_Evolution_of_todo/Phase_II/specs/004-modern-ui-ux-dashboard/tasks.md
tests:
  - Manual: Visit / while logged out, verify landing page displays
  - Manual: Visit /dashboard while logged out, verify redirect to /login
  - Manual: Visit /login and /signup while logged out, verify public access
---

## Prompt

Add tasks to create public landing page and scope auth protection

Task description

1) Add a public / frontpage for TaskFlow

2) Include Login and Sign Up entry points

3) Ensure unauthenticated users are not redirected from /

4) Scope auth middleware to /dashboard/** only

5) Do not alter auth flow or JWT handling

Acceptance criteria

1) Visiting / while logged out shows landing page

2) /login and /signup remain public

3) /dashboard/** still redirects to /login when unauthenticated

4) No JWT access on client

5) All auth invariants remain intact

## Response snapshot

Added Phase 10 to tasks.md with 10 new tasks (T061-T070) organized into three groups:

1. **Public Landing Page** (T061-T064):
   - Created public root route at `frontend/app/page.tsx`
   - Added `LandingHero` and `FeaturesSection` components
   - Optional `LandingLayout` for minimal header/footer
   - All styled with Clean Light Mode palette

2. **Auth Middleware Scoping** (T065-T067):
   - Updated `(dashboard)/layout.tsx` to ensure AuthGuard only applies to dashboard routes
   - Audited route structure to confirm public access to /, /login, /signup
   - Added manual testing tasks for auth scoping verification

3. **Landing Page Enhancements** (T068-T070):
   - Added smooth scroll interactions
   - Framer Motion animations for hero and features
   - Updated Topbar navigation to adapt based on route and auth state

Updated task counts:
- Total tasks: 60 → 70
- US1 tasks: 9 → 19 (added landing page tasks)
- US4 tasks: 9 → 11 (added landing animations)

Updated dependency graph to show Phase 10 can parallelize with Phase 3+ after Phase 1-2 complete.

## Outcome

- ✅ Impact: Added 10 new tasks for public landing page and auth scoping without breaking existing auth flow
- 🧪 Tests: Manual testing tasks added for auth route scoping verification
- 📁 Files: Updated tasks.md with new Phase 10
- 🔁 Next prompts: /sp.implement to execute tasks; review landing page design requirements
- 🧠 Reflection: Tasks properly scoped to preserve existing authentication invariants (HttpOnly cookies, server-side user_id extraction, JWT validation)

## Evaluation notes (flywheel)

- Failure modes observed: None - tasks added incrementally without modifying existing auth implementation
- Graders run and results (PASS/FAIL): Format validation PASS (all tasks follow `[ID] [P?] [Story?] Description` format with file paths)
- Prompt variant (if applicable): Standard task generation with incremental addition
- Next experiment (smallest change to try): Consider extracting landing page components to a shared library if reused across features
