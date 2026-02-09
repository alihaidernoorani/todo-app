---
id: 0014
title: resolve-arch-decisions
stage: spec
date: 2026-02-02
surface: agent
model: claude-opus-4-5-20251101
feature: 004-modern-ui-ux-dashboard
branch: 004-modern-ui-ux-dashboard
user: unknown
command: "/sp.clarify"
labels: ["architecture", "decision", "spec", "clarification"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - /specs/004-modern-ui-ux-dashboard/spec.md
tests:
 - null
---

## Prompt

"Resolve architectural inconsistencies and lock decisions.
The specification (spec.md) is the single source of truth.

Explicitly decide and document the following:

1) Authentication routes:
   - /login and /signup are the only public authentication routes.
   - Legacy routes such as (auth)/sign-in are deprecated.
   - Legacy routes may temporarily redirect to /login for soft migration and must be removed after stabilization.

2) JWT handling and user scoping:
   - JWT is stored exclusively in HttpOnly cookies.
   - Client-side JavaScript must never access JWT payload or user_id.
   - Client must never construct API paths containing user_id.
   - All user scoping and user_id extraction is enforced server-side in FastAPI using JWT dependencies.
   - Client calls generic endpoints only (e.g., /api/tasks).

3) API client responsibility:
   - ApiClient handles centralized fetch logic, credentials inclusion, error handling, and 401 redirects.
   - ApiClient does NOT perform user_id interpolation or JWT decoding.

4) Design system terminology:
   - Canonical design system name is 'Clean Light Mode'.
   - All other names are deprecated.

5) Component naming:
   - 'PrimaryButton' is the canonical button component name.

Clarify decisions only. Do not generate plans or tasks yet."

## Response snapshot

Architectural decisions have been successfully clarified and documented in the specification. Key changes made to spec.md:

1. Added new clarifications session (Session 2026-02-02) with 5 key decisions:
   - Authentication routes (/login and /signup as canonical routes)
   - JWT handling (client never accesses JWT payload or user_id)
   - API path construction (server-side scoping, client calls generic endpoints)
   - Design system name (Clean Light Mode as canonical)
   - Component naming (PrimaryButton as canonical)

2. Updated functional requirements:
   - FR-003: Changed from dynamic API path construction to server-side scoping
   - FR-002: Updated ApiClient responsibilities to exclude JWT decoding
   - FR-007, FR-008, FR-010: Updated design system from "Midnight Stone" to "Clean Light Mode"

3. Updated user stories:
   - User Story 1: Updated to reference /login instead of generic sign-in
   - User Story 6: Updated to reflect server-side user scoping
   - User Story 4: Updated design system terminology

4. Updated dependencies, edge cases, and assumptions to align with decisions

## Outcome

- ✅ Impact: Critical architectural inconsistencies resolved in specification
- 🧪 Tests: Manual verification of spec changes
- 📁 Files: Updated /specs/004-modern-ui-ux-dashboard/spec.md
- 🔁 Next prompts: Ready to proceed with /sp.plan
- 🧠 Reflection: Specification now serves as single source of truth with resolved architectural decisions

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Proceed with planning phase