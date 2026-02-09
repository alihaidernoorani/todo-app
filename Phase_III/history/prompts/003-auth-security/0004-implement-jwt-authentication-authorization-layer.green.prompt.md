---
id: 0004
title: Implement JWT Authentication and Authorization Layer
stage: green
date: 2026-01-25
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-auth-security
branch: 003-auth-security
user: user
command: sp.implement
labels: ["authentication", "jwt", "security", "fastapi", "better-auth"]
links:
  spec: specs/003-auth-security/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/pyproject.toml
  - backend/.env.example
  - backend/.gitignore
  - backend/.env
  - backend/src/config.py
  - backend/src/models/auth.py
  - backend/src/auth/__init__.py
  - backend/src/auth/jwt_handler.py
  - backend/src/auth/exceptions.py
  - backend/src/auth/dependencies.py
  - backend/src/api/deps.py
  - backend/src/api/v1/auth.py
  - backend/src/api/v1/router.py
  - specs/003-auth-security/tasks.md
tests:
  - Manual: Missing token → 401 "Missing authentication token"
  - Manual: Invalid header format → 401 "Invalid authorization header format"
  - Manual: Malformed token → 401 "Invalid token signature"
  - Manual: Expired token → 401 "Token expired"
  - Manual: Valid token, correct user_id → 200 (success)
  - Manual: Valid token, different user_id → 403 "Access denied"
  - Manual: BETTER_AUTH_SECRET validation on startup
---

## Prompt

Action: Implement Authentication and Security layer

Requirements:
- All code in backend/ directory
- Use shared secret from environment variables (BETTER_AUTH_SECRET)
- Enforce path-based isolation (/api/{user_id}/tasks)
- No manual coding, Claude Code only
- Final check: Ensure the server starts and returns 401 when the 'Authorization' header is missing

## Response snapshot

Successfully implemented the JWT authentication and authorization system for the FastAPI backend:

### Phase 1: Setup (6/7 tasks completed)
- Created backend/src/auth/ directory structure
- Added python-jose[cryptography]>=3.3.0 dependency
- Added pydantic-settings>=2.0.0 dependency
- Created .env.example with BETTER_AUTH_SECRET template
- Updated .gitignore to prevent .env commits
- Created tests/ directory structure

### Phase 2: Foundational Infrastructure (6/6 tasks completed)
- Refactored backend/src/config.py to use pydantic-settings with BETTER_AUTH_SECRET validation (minimum 32 characters)
- Created backend/src/models/auth.py with JWTPayload, AuthErrorCode, and AuthErrorResponse models
- Implemented backend/src/auth/jwt_handler.py with extract_bearer_token() and decode_jwt() functions
- Created backend/src/auth/exceptions.py with AuthenticationError and AuthorizationError classes
- Created backend/src/auth/__init__.py to export dependencies

### Phase 3: User Story 1 - JWT Authentication (8/14 tasks completed)
- Implemented extract_bearer_token() to parse Authorization: Bearer <token> headers
- Implemented get_current_user() FastAPI dependency for JWT validation
- Added HTTPException handlers with 401 status codes and WWW-Authenticate headers
- Validated all error scenarios:
  - Missing Authorization header
  - Invalid header format
  - Invalid JWT signature
  - Expired tokens
  - Missing/malformed uid claim

### Phase 4: User Story 2 - User Identity Scoping (6/11 tasks completed)
- Implemented verify_user_access() dependency with user_id parameter injection
- Added user ID comparison logic (authenticated_user != user_id → 403)
- Enforced "Access denied: cannot access another user's resources" error message
- Verified dependency composition (verify_user_access calls get_current_user)

### Phase 5: User Story 3 - Reusable Dependencies (4/11 tasks completed)
- Created test endpoint /api/me using get_current_user() dependency
- Exported both dependencies from backend/src/auth/__init__.py
- Added comprehensive docstrings with usage examples

### API Integration
- Updated backend/src/api/deps.py to integrate authentication into all task endpoints
- Modified UserIdDep to use validate_and_authorize_user() combining JWT auth + UUID validation + authorization
- All /api/{user_id}/tasks/* routes now protected

### Manual Verification Results
All authentication scenarios tested successfully:
✅ Missing token → 401 "Missing authentication token"
✅ Invalid header format → 401 "Invalid authorization header format"
✅ Malformed token → 401 "Invalid token signature"
✅ Expired token → 401 "Token expired"
✅ Valid token, correct user_id → 200 (tasks returned)
✅ Valid token, different user_id → 403 "Access denied: cannot access another user's resources"
✅ Server fails to start if BETTER_AUTH_SECRET is missing or < 32 characters

## Outcome

- ✅ Impact: Stateless JWT authentication fully operational. All task endpoints protected with user-scoped authorization. Horizontal privilege escalation prevention enforced.
- 🧪 Tests: 7 manual verification tests passed. Automated test suite (contract, integration, unit) still needs to be written (31/65 tasks completed).
- 📁 Files: 13 files created/modified across authentication module, configuration, API integration, and documentation.
- 🔁 Next prompts: Write comprehensive test suite (T014-T017, T026-T031, T037-T042), add logging (T050-T051), run linting/formatting (T055-T057), verify OpenAPI docs (T048).
- 🧠 Reflection: Implementation followed TDD principles conceptually (verified failures before implementation) but manual testing instead of automated tests. Core authentication infrastructure is solid and production-ready except for missing automated test coverage.

## Evaluation notes (flywheel)

- Failure modes observed: None. All authentication scenarios worked as expected on first implementation.
- Graders run and results (PASS/FAIL): Manual verification: PASS (7/7 scenarios). Automated tests: NOT RUN (tests not written yet).
- Prompt variant (if applicable): Standard sp.implement workflow
- Next experiment (smallest change to try): Write one contract test for valid token authentication (T014) to establish testing pattern, then replicate for other scenarios.
