---
id: 0018
title: Align auth spec with Better Auth session model
stage: spec
date: 2026-02-07
surface: agent
model: claude-sonnet-4-5
feature: 003-auth-security
branch: backup-before-auth-fix-20260207-033626
user: user
command: /sp.clarify
labels: ["authentication", "better-auth", "session-management", "spec-clarification", "architecture"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/spec.md
tests:
---

## Prompt

```text
"Align authentication spec with Better Auth session-based model"

Goal:
Update the existing authentication specification to remove the stateless JWT + RS256 + JWKS model and fully align it with Better Auth's native session-based architecture.

Context:

* The system currently has a redirect loop caused by conflicting custom JWT logic and Better Auth sessions.
* The architecture decision is to use Better Auth sessions as the single source of truth.
* Backend must validate sessions via Better Auth's `/api/auth/session` endpoint.
* All custom JWT validation logic must be removed.

Clarifications to apply:

1. Remove all references to:

   * Stateless JWT verification
   * RS256
   * JWKS
   * Better Auth JWT plugin
   * Manual token signature validation
2. Change the architecture to:

   * Delegated session validation via Better Auth
   * Backend calls `/api/auth/session`
   * No custom cookie or JWT parsing in backend
3. Update constraints to:

   * Backend delegates session validation to Better Auth
   * No custom JWT verification logic
4. Keep:

   * User ID path scoping logic
   * 401 vs 403 behavior
   * FastAPI dependency model
5. Ensure the spec has:

   * A single source of truth: Better Auth session
   * No mixed authentication strategies

Output:

* Updated and internally consistent spec
* No references to RS256, JWKS, or stateless JWT
```

## Response snapshot

Executed interactive clarification session with 5 critical architectural questions:

1. **Authentication Model**: Confirmed backend delegates ALL session validation to Better Auth's `/api/auth/session` endpoint, removing ALL custom JWT parsing/verification logic
2. **Transport Mechanism**: Clarified Better Auth uses session cookies (automatic) for authentication
3. **JWT Plugin**: Confirmed JWT plugin is NOT required for session cookie validation
4. **Cookie Forwarding**: Specified backend makes server-to-server HTTP calls to Better Auth session endpoint with cookies from original request
5. **Error Handling**: Established backend maps Better Auth responses to standardized backend error format

Updated spec to remove all references to:
- Stateless JWT verification
- RS256/JWKS cryptographic operations
- Better Auth JWT plugin
- Custom token parsing/validation
- "100% stateless backend" constraint

Updated 10 major sections of the spec including Input, User Stories, Functional Requirements, Success Criteria, Scope/Constraints, Dependencies, and Assumptions.

## Outcome

- ✅ Impact: Resolved architectural conflict between custom JWT verification and Better Auth session management; eliminated redirect loop root cause by establishing single source of truth
- 🧪 Tests: No tests run (specification phase)
- 📁 Files: specs/003-auth-security/spec.md (comprehensive update across 10 sections)
- 🔁 Next prompts: /sp.plan (ready for architectural planning with clarified spec)
- 🧠 Reflection: Successfully aligned spec with Better Auth's native session architecture; removed all obsolete JWT/RS256/JWKS references while preserving user ID scoping and authorization logic

## Evaluation notes (flywheel)

- Failure modes observed: None - all clarifications integrated successfully with internal consistency validated
- Graders run and results (PASS/FAIL): N/A (specification phase)
- Prompt variant (if applicable): Standard /sp.clarify interactive questioning workflow
- Next experiment (smallest change to try): Proceed to /sp.plan to generate implementation plan based on clarified session-based architecture
