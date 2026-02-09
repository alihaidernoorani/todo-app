---
id: 0019
title: Fix auth redirect loop planning
stage: plan
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: backup-before-auth-fix-20260207-033626
user: user
command: /sp.plan
labels: ["authentication", "better-auth", "session-validation", "redirect-loop", "planning"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/plan.md
  - specs/003-auth-security/plan-jwt-deprecated.md.bak
tests:
---

## Prompt

```text
"Fix authentication redirect loop using Better Auth session model"

Objective:
Implement the updated authentication spec using Better Auth sessions as the single source of truth and remove all conflicting custom auth logic. Use better-auth skill while updating the plan

Scope:

* Frontend session handling
* Middleware or server-side session checks
* Removal of custom auth-token logic
* Backend session validation via Better Auth endpoint

Success criteria:

* Login redirects correctly to dashboard
* No redirect loop
* Dashboard loads when session is valid
* Unauthorized users are redirected to login
* Backend correctly validates session via Better Auth

Output:

* A small, ordered task list
* Each task must be isolated and reversible
* No unrelated refactors
```

## Response snapshot

Created comprehensive implementation plan (`specs/003-auth-security/plan.md`) for fixing authentication redirect loop using Better Auth session-based validation.

**Key architectural decisions**:
1. Backend delegates ALL session validation to Better Auth `/api/auth/session` endpoint (no custom JWT parsing)
2. Frontend removes middleware (causing redirect loop), uses server-side session checks in pages
3. Session cookies only (no Bearer tokens)
4. Error responses mapped to standardized backend format (hide Better Auth implementation details)
5. httpx for async HTTP client with cookie support
6. Fail closed (503) when Better Auth unavailable

**Plan structure**:
- Summary: Delegated session validation architecture
- Technical Context: Python 3.13+/TypeScript, FastAPI/Next.js, <50ms P95 latency target
- Constitution Check: 6/6 gates pass (one wording update recommended, non-blocking)
- Phase 0 Research: 6 research questions on Better Auth session endpoint, cookie forwarding, error handling
- Phase 1 Design: Data models (BetterAuthSessionResponse, AuthenticatedUser, SessionValidationError), API contracts (dependencies), quickstart guide
- Phase 2 Implementation: 18 tasks (backend P0, frontend P1, validation P2)
- Decision Log: 5 key architectural decisions with rationale
- Risk Analysis: 7 risks with probability/impact/mitigation
- Success Criteria: Spec + user input validation methods

**Files created**:
- `specs/003-auth-security/plan.md` (new comprehensive plan)
- Backed up old JWT-based plan to `plan-jwt-deprecated.md.bak`

**Better Auth skill used**: Consulted Better Auth best practices for session validation patterns, cookie handling, and configuration.

## Outcome

- ✅ Impact: Comprehensive implementation plan for fixing redirect loop; clear architectural direction (delegated session validation); removes all custom JWT logic
- 🧪 Tests: No tests run (planning phase)
- 📁 Files: specs/003-auth-security/plan.md (new), plan-jwt-deprecated.md.bak (backup of old plan)
- 🔁 Next prompts: Continue Phase 0 research or run /sp.tasks to generate detailed implementation tasks after Phase 1 design artifacts
- 🧠 Reflection: Plan successfully integrates Better Auth session-based architecture with FastAPI backend and Next.js frontend; identifies 18 implementation tasks with clear priorities; constitutional compliance verified with one non-blocking wording recommendation

## Evaluation notes (flywheel)

- Failure modes observed: None - plan created successfully with comprehensive risk analysis
- Graders run and results (PASS/FAIL): N/A (planning phase)
- Prompt variant (if applicable): Standard /sp.plan workflow with Better Auth skill integration
- Next experiment (smallest change to try): Proceed to Phase 0 research (document Better Auth session endpoint behavior) or jump to /sp.tasks for task generation if design artifacts already clear
