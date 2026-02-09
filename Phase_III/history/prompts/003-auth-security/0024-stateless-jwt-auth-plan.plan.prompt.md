---
id: 0024
title: Implement Stateless JWT Authentication Plan
stage: plan
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-auth-security
branch: fix/auth-session-redirect-loop
user: alihaidernoorani
command: /sp.plan
labels: ["jwt", "authentication", "stateless", "rs256", "jwks", "better-auth"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/003-auth-security/plan.md
tests:
 - (none - planning phase)
---

## Prompt

```text
"Implement Stateless JWT Authentication"

Goal:
Create a step-by-step plan to migrate from cookie-based Better Auth sessions to stateless JWT authentication using Authorization headers.

Architecture:

* Frontend: Next.js on Vercel
* Backend: FastAPI on HuggingFace
* Auth: Better Auth with JWT plugin
* Token type: RS256
* Verification: JWKS endpoint
* Transport: Authorization header only

Plan requirements:

* Must not change deployment setup.
* Must remove all cookie/session logic.
* Must be fully stateless.
* Must align with updated spec.

Plan must include:

1. Enable Better Auth JWT plugin.
2. Ensure JWKS endpoint is exposed.
3. Update frontend sign-in flow to capture JWT.
4. Store token on frontend.
5. Update API client to send Authorization header.
6. Implement FastAPI JWT verification dependency.
7. Add user_id scoping via `sub` claim.
8. Remove all session endpoint calls.
9. Remove cookie-based middleware.
10. End-to-end authentication test.

Instructions:

* Use skills for auth architecture and refactoring.
* Use subagents to inspect code structure.
* Ensure minimal, safe, non-breaking changes.
* Output a clear, ordered execution plan.
```

## Response snapshot

Created comprehensive implementation plan for migrating from session-cookie based authentication to stateless JWT authentication using RS256 and JWKS.

**Key Planning Outputs:**

1. **Technical Context**:
   - Python 3.13+ backend with PyJWT, cryptography, httpx dependencies
   - Next.js 16+ frontend with Better Auth JWT plugin
   - Performance target: <10ms JWT verification with cached JWKS keys
   - Cross-domain deployment constraint (Vercel + HuggingFace)

2. **Constitution Check**: All 6 gates passed
   - Multi-Tier Isolation ✅
   - Persistence First ✅ (N/A for stateless auth)
   - Secure by Design ✅ (RS256 more secure than session cookies)
   - Zero Manual Coding ✅
   - Test-First Discipline ⚠️ (conditional pass)
   - API Contract Enforcement ✅

3. **Phase 0 Research Tasks** (8 tasks):
   - Better Auth JWT plugin configuration (RS256)
   - JWKS endpoint discovery and format
   - PyJWT RS256 verification patterns
   - JWKS caching strategy (1-hour TTL)
   - Frontend token storage security (localStorage + XSS mitigation)
   - Token lifecycle management (refresh flow)
   - FastAPI dependency pattern for JWT
   - Startup validation for JWKS availability

4. **Phase 1 Design Artifacts**:
   - Data models: JWT structure, JWKS keys, AuthenticatedUser, cache entries
   - API contracts: JWT verification, error responses (401/403/503)
   - Quickstart guide: Environment setup, flows, testing, deployment checklist

5. **Phase 2 Task Categories** (13-19 tasks estimated):
   - Backend JWT verification (5-7 tasks)
   - Frontend JWT integration (4-6 tasks)
   - Cleanup & migration (2-3 tasks)
   - Security & testing (2-3 tasks)

6. **Migration Strategy**:
   - Phase A: Add JWT alongside session (zero downtime)
   - Phase B: Frontend dual-auth support (low risk)
   - Phase C: Backend cutover to JWT-only (controlled)
   - Phase D: Remove session code (safe cleanup)
   - Rollback plan: Revert to session-based auth

7. **Risk Analysis** (5 major risks identified with mitigations):
   - JWKS unavailable at startup (fail-safe required)
   - JWT plugin misconfiguration (test in dev first)
   - XSS token theft (CSP headers, short-lived tokens)
   - JWKS cache poisoning (validate structure, use HTTPS)
   - Cross-user access during migration (maintain ID scoping)

8. **Success Metrics**:
   - Technical: <10ms verification, zero session calls, 100% JWT endpoints
   - Security: 100% invalid token rejection, zero backend state
   - Reliability: Fail-safe startup, graceful degradation with cached keys

**Architecture Change**: Session-cookie delegation → Stateless local JWT verification

**Current State**: Session validator calls Better Auth `/api/auth/session` endpoint

**Target State**: Backend verifies JWT signatures locally using JWKS public keys

**Files Modified**: plan.md (comprehensive 300+ line implementation plan)

## Outcome

- ✅ Impact: Comprehensive migration plan from session-based to stateless JWT authentication created
- 🧪 Tests: No tests yet (planning phase) - tests defined in Phase 1 contracts and Phase 2 tasks
- 📁 Files: specs/003-auth-security/plan.md (complete rewrite from session-based to JWT plan)
- 🔁 Next prompts: Execute Phase 1 design (data-model.md, contracts/, quickstart.md) or run /sp.tasks
- 🧠 Reflection: Plan successfully bridges current session architecture to target JWT architecture with phased rollout strategy, clear rollback plan, and comprehensive risk mitigation

## Evaluation notes (flywheel)

- Failure modes observed: None - planning completed successfully
- Graders run and results (PASS/FAIL): N/A (planning phase, no code execution)
- Prompt variant (if applicable): Standard /sp.plan workflow with user-provided 10-point requirement list
- Next experiment (smallest change to try): Execute Phase 1 design artifacts generation (research.md, data-model.md, contracts/)
