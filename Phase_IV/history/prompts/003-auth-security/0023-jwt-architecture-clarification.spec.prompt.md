---
id: 0023
title: JWT Architecture Clarification
stage: spec
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: fix/auth-session-redirect-loop
user: alihaidernoorani
command: /sp.clarify
labels: ["architecture", "jwt", "stateless", "cross-domain", "better-auth"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/003-auth-security/spec.md
tests:
 - N/A (specification clarification)
---

## Prompt

"Update Authentication Spec to Stateless JWT Architecture"

Goal:
Refactor the current Authentication and Security specification to support a stateless JWT-based architecture that works across different domains (Vercel frontend and HuggingFace backend) without using cookies or session endpoints.

Context:

* Current deployment cannot be changed.
* Frontend is deployed on Vercel.
* Backend is deployed on HuggingFace Spaces.
* Cookie-based sessions are failing due to cross-domain restrictions.
* Need a stateless solution using Authorization headers.

Required changes to spec:

* Remove all cookie-based session logic.
* Remove `/api/auth/session` dependency.
* Replace session validation with JWT verification.
* Use Better Auth JWT plugin.
* Use RS256 with JWKS.
* Backend must verify JWT using JWKS endpoint.
* Frontend must store token and send:
  Authorization: Bearer <token>

Key clarifications needed:

1. Confirm single source of truth is JWT token, not session cookies.
2. Confirm backend verifies tokens using JWKS endpoint.
3. Confirm user identity is taken from `sub` claim.
4. Confirm frontend stores token in memory or localStorage.
5. Confirm all API calls use Authorization header.

Constraints:

* 100% stateless backend.
* No cookies allowed.
* No session endpoint calls.
* Must work across different domains.
* Must align with Better Auth best practices.

Instructions:

* Use relevant skills for authentication architecture.
* Use subagents to analyze the existing spec.
* Identify all sections that contradict stateless JWT flow.
* Produce clear clarifications before planning.

## Response snapshot

Executed systematic clarification workflow with 5 targeted questions:

1. **Architectural approach**: Complete pivot from session-cookie to stateless JWT (RS256 + JWKS)
2. **Token storage**: localStorage with secure flags on frontend
3. **User identity extraction**: JWT `sub` claim
4. **Public key source**: Better Auth JWKS endpoint (`/.well-known/jwks.json`) with local caching
5. **JWKS failure handling**: Cached fallback with startup check

Updated 11 major sections of spec.md:
- Input (changed focus to JWT-based stateless architecture)
- Clarifications (added Session 2026-02-07 Architectural Refactor)
- User Stories 1-3 (replaced session cookies with JWT tokens)
- Edge Cases (added JWT-specific scenarios)
- Functional Requirements FR-001 to FR-017 (local JWT verification)
- Key Entities (JWT, JWKS, claims-based)
- Success Criteria (10ms validation, startup checks)
- Scope and Constraints (JWT verification in scope, sessions removed)
- Assumptions (Authorization headers, localStorage)
- Dependencies (PyJWT, cryptography, pyjwks-client)
- Environment Configuration (JWKS endpoint)

## Outcome

- ✅ Impact: Complete architectural specification refactor from session-based to stateless JWT authentication. Resolves cross-domain deployment constraints (Vercel + HuggingFace).
- 🧪 Tests: Specification-level work. Test scenarios updated in User Stories to reflect JWT validation instead of session validation.
- 📁 Files: specs/003-auth-security/spec.md (11 major sections updated)
- 🔁 Next prompts: Ready for `/sp.plan` to generate implementation plan based on JWT architecture
- 🧠 Reflection: The original spec was fundamentally incompatible with cross-domain deployment requirements. Systematic clarification identified the architectural conflict and resolved it through 5 focused questions that cover storage, verification, identity extraction, key management, and error handling.

## Evaluation notes (flywheel)

- Failure modes observed: None. All clarifications integrated successfully into spec.
- Graders run and results (PASS/FAIL): N/A (specification work)
- Prompt variant (if applicable): Standard /sp.clarify workflow with architectural refactor context
- Next experiment (smallest change to try): Proceed to /sp.plan to validate that the JWT architecture translates into implementable technical design
