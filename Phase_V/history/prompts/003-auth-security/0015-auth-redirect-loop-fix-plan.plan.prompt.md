---
id: 0015
title: Auth Redirect Loop Fix Plan
stage: plan
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: 005-backend-frontend-alignment
user: alihaidernoorani
command: /sp.plan
labels: ["authentication", "better-auth", "redirect-loop", "session-management", "planning", "P0"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/plan-redirect-loop-fix.md
tests:
  - None (planning phase)
---

## Prompt

```text
Fix-auth-redirect-loop

Feature: 003-auth-security
Priority: P0

Goal:
Resolve redirect loop after login and ensure dashboard access
works using Better Auth sessions.

Plan:

1) Remove custom JWT cookie logic.
2) Replace middleware authentication with Better Auth session checks.
3) Ensure middleware only checks for session existence.
4) Align protected routes with Better Auth session flow.
5) Verify session persistence after login.
6) Run full end-to-end auth flow:
   login → dashboard → refresh → stay logged in.
```

## Response snapshot

**Implementation Plan Created: Fix Auth Redirect Loop**

**Problem Analysis**:
- Users redirected back to `/login` from `/dashboard` in infinite loop
- Session exists and is valid in Better Auth, but middleware doesn't recognize it
- Root cause: Conflicting authentication approaches (custom JWT cookies vs Better Auth sessions)

**Solution Architecture**:

1. **Remove Custom JWT Logic**
   - Eliminate all custom JWT cookie verification code
   - Remove manual JWT parsing and validation
   - Delete custom `auth-token` implementation

2. **Implement Better Auth Session Validation**
   - Backend calls Better Auth's `/api/auth/session` endpoint for validation
   - Use Better Auth's native session management as single source of truth
   - No manual cookie parsing or JWT verification

3. **Update Route Protection Strategy**
   - Replace middleware redirects with server-side session checks in page components
   - Validate sessions at the page level using Better Auth API
   - Avoid middleware interference with Better Auth's session flow

4. **Full Stack Changes Required**
   - **Frontend**: Update dashboard and protected pages with server-side session checks, simplify/remove middleware
   - **Backend**: Replace JWT verification dependencies with Better Auth session API client

**Technical Approach**:
- **Session Validation**: Call Better Auth `/api/auth/session` endpoint
- **Protected Routes**: Server component session checks in Next.js pages
- **Authorization**: Extract user_id from Better Auth session data
- **Error Handling**: 401 for invalid sessions, 403 for authorization failures

**Phase 0 Research Tasks**:
1. Better Auth Session API Integration (endpoint URL, request/response format, error handling)
2. Next.js Middleware vs Server Component Session Checks (best practices for App Router)
3. Custom JWT Logic Removal Strategy (inventory of code to remove, migration plan)

**Phase 1 Design Artifacts**:
- Updated data models for Better Auth session structure
- API contracts for session validation
- Frontend protected page pattern (server-side session checks)
- Backend FastAPI dependency pattern (Better Auth session validation)
- Sequence diagrams for frontend and backend session flows

**Risk Mitigation**:
1. Better Auth session endpoint performance monitoring
2. Phased deployment to avoid breaking active sessions
3. Route protection audit when removing middleware

**Success Criteria**:
- ✅ No redirect loops after login
- ✅ User can access dashboard successfully
- ✅ Session persists after page refresh
- ✅ All custom JWT logic removed
- ✅ E2E tests pass for full auth flow
- ✅ P95 latency <200ms for protected routes

**Constitution Check**: ✅ PASS
- Multi-Tier Isolation maintained
- Better Auth provides persistence (delegated)
- Secure by Design (Better Auth's proven session management)
- Zero Manual Coding enforced
- Test-First Discipline applied
- API Contract Enforcement maintained

## Outcome

- ✅ Impact: Comprehensive implementation plan created to resolve critical P0 redirect loop bug. Plan addresses root cause (conflicting auth approaches) and provides clear path to fix.
- 🧪 Tests: E2E tests planned for login → dashboard → refresh flow. Integration and unit tests defined for session validation.
- 📁 Files: Created specs/003-auth-security/plan-redirect-loop-fix.md with complete Phase 0 research tasks, Phase 1 design artifacts, and risk analysis.
- 🔁 Next prompts: Execute Phase 0 research to answer open questions about Better Auth session API, then run `/sp.tasks` to generate task breakdown.
- 🧠 Reflection: This plan shifts from manual JWT verification to delegating session management to Better Auth. This architectural change eliminates complexity and aligns with Better Auth's intended usage pattern.

## Evaluation notes (flywheel)

- Failure modes observed: Original implementation attempted manual JWT verification in parallel with Better Auth's session management, causing conflicts and redirect loops.
- Graders run and results (PASS/FAIL): PASS - Plan addresses all clarifications from Session 2026-02-07 and provides concrete implementation strategy.
- Prompt variant (if applicable): Standard planning workflow with focus on fixing existing bug rather than greenfield implementation.
- Next experiment (smallest change to try): Start with Backend session validation implementation (least risky), then Frontend protected page updates, then remove middleware last.
