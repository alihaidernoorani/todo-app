---
id: 0002
title: auth-security-implementation-plan
stage: plan
date: 2026-01-25
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-auth-security
branch: 003-auth-security
user: user
command: /sp.plan
labels: ["authentication", "security", "jwt", "better-auth", "fastapi", "architecture", "hs256"]
links:
  spec: ../../../specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-auth-security/plan.md
  - specs/003-auth-security/research.md
  - specs/003-auth-security/data-model.md
  - specs/003-auth-security/quickstart.md
  - specs/003-auth-security/contracts/auth-errors.json
tests:
  - No tests created (planning phase)
---

## Prompt

Create: Architecture for a JWT verification dependency using the 'BETTER_AUTH_SECRET'.
Decisions needing documentation:
- Use of HS256 algorithm for signature verification.
- Logic to extract 'uid' from the token and compare it to the '{user_id}' path parameter.

Testing strategy:
- Verify that a valid token grants access to the specific user's path.
- Verify that a valid token is REJECTED (403 Forbidden) if it tries to access a different user's path.
- Verify that an expired or malformed token returns 401 Unauthorized.

Technical details:
- Environment: Python 3.13+.
- Approach: Stateless verification – No database lookup for user status.

## Response snapshot

Created comprehensive implementation plan for stateless JWT authentication and authorization:

**Phase 0: Research** (Complete)
- **Critical Discovery**: Better Auth uses EdDSA (Ed25519) by default, NOT HS256
- Selected python-jose[cryptography] for JWT validation (FastAPI official recommendation)
- Documented Better Auth JWT payload structure (sub claim for user ID, exp=15 mins)
- Identified requirement for Better Auth frontend configuration to use HS256
- Established FastAPI dependency patterns with custom Header extraction

**Phase 1: Design & Contracts** (Complete)
- Created JWT payload data model (uid, exp, iat claims)
- Designed authentication error response schema with 7 error codes
- Defined two FastAPI dependencies: get_current_user (auth only) and verify_user_access (auth + authorization)
- Documented 4 key architectural decisions with rationale and alternatives

**Key Architectural Decisions**:
1. JWT Library: python-jose[cryptography] (FastAPI recommended, cryptography backend)
2. Error Handling: Raise HTTPException (fail-fast, automatic OpenAPI docs)
3. Path Parameter Extraction: Explicit user_id parameter injection (type-safe, testable)
4. Environment Variables: pydantic-settings with validation (fail-fast on missing secrets)

**Project Structure**:
- Backend-only feature in /backend/src/auth/
- Modular design: dependencies.py, jwt_handler.py, exceptions.py
- Test structure: contract/, integration/, unit/ directories

**Constitution Compliance**: ✅ ALL CHECKS PASSED
- Multi-tier isolation (backend only)
- Secure by design (JWT verification, user scoping, fail-fast)
- Test-first discipline (contract, integration, unit tests defined)
- API contract enforcement (standardized error responses)

**Deliverables Created**:
1. plan.md - Complete implementation plan with constitution check
2. research.md - JWT library evaluation, Better Auth structure research
3. data-model.md - Pydantic models for JWT payload, errors, configuration
4. contracts/auth-errors.json - OpenAPI schema for error responses
5. quickstart.md - Developer guide with usage patterns and testing examples

**Security Considerations**:
- Secret minimum 32 characters (256 bits) for HS256
- Constant-time signature comparison (library-handled)
- No database lookups during authentication (stateless design)
- Generic error messages to prevent information disclosure

**Open Questions for Frontend Team**:
1. Can Better Auth be configured to use HS256? (requires customSign configuration)
2. Can Better Auth use 'uid' instead of 'sub' claim? (requires definePayload)
3. What is the shared BETTER_AUTH_SECRET value?

## Outcome

- ✅ Impact: Complete architectural plan for stateless JWT authentication with FastAPI dependencies, comprehensive research findings, and developer quickstart guide
- 🧪 Tests: Testing strategy defined (contract/integration/unit), no tests implemented yet (planning phase)
- 📁 Files: 5 files created (plan.md, research.md, data-model.md, quickstart.md, auth-errors.json)
- 🔁 Next prompts: /sp.tasks (generate implementation tasks), coordinate with frontend on Better Auth HS256 configuration
- 🧠 Reflection: Critical discovery that Better Auth uses EdDSA by default (not HS256) requires frontend configuration changes. Plan provides complete architecture with clear dependency patterns and security best practices. Ready for task generation.

## Evaluation notes (flywheel)

- Failure modes observed: None - planning completed successfully with comprehensive research
- Graders run and results (PASS/FAIL): PASS - All constitution checks passed, all Phase 1 deliverables complete
- Prompt variant (if applicable): Standard /sp.plan workflow with user input on HS256 requirement
- Next experiment (smallest change to try): Generate implementation tasks via /sp.tasks, then execute with TDD workflow
