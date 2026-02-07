# Implementation Plan: Authentication with Better Auth Sessions

**Branch**: `003-auth-security` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-auth-security/spec.md` (updated 2026-02-07)

## Summary

Implement Better Auth session-based authentication as the single source of truth. Backend validates sessions by forwarding cookies to Better Auth's `/api/auth/session` endpoint. Frontend relies on Better Auth's native session management via HTTP-only cookies. This eliminates custom JWT verification logic and prevents redirect loops caused by conflicting authentication strategies.

**Architectural principle**: Delegated session validation - no custom cryptographic operations.

## Technical Context

**Language/Version**: Python 3.13+ (backend), TypeScript (frontend Next.js 16+)
**Primary Dependencies**: FastAPI, httpx, Pydantic (backend); Better Auth client, Next.js App Router (frontend)
**Storage**: Neon PostgreSQL (via SQLModel)
**Testing**: pytest (backend), Jest/Vitest (frontend)
**Target Platform**: Linux server (backend), Web browsers (frontend)
**Project Type**: Web application
**Performance Goals**: <50ms session validation P95 latency
**Constraints**:
- Backend MUST delegate all session validation to Better Auth `/api/auth/session`
- Backend MUST NOT parse JWT or verify signatures
- Session cookies only (no Bearer tokens)
**Scale/Scope**: Multi-user todo app with user-scoped access control

## Constitution Check

### ✅ I. Multi-Tier Isolation - PASS
Backend changes in `/backend/`, frontend in `/frontend/`

### ✅ II. Persistence First - PASS
Authentication state persisted via Better Auth (delegates to Better Auth's DB)

### ⚠️ III. Secure by Design - PASS (wording update recommended)
**Current constitution** (line 60): "validated via Better Auth JWT tokens"
**This plan**: Backend validates via Better Auth `/api/auth/session` endpoint
**Analysis**: Spec (2026-02-07) clarifies session endpoint validation is correct approach, not custom JWT parsing.
**Justification**: Session delegation provides MORE security:
- Better Auth handles lifecycle/revocation/rotation
- No cryptographic implementation bugs
- Consistent with Better Auth design
- Eliminates custom verification attack surface

**Resolution**: Plan implements security intent fully. Recommend constitution amendment: change "JWT tokens" to "sessions" for accuracy.

### ✅ IV. Zero Manual Coding - PASS
All implementation via Claude Code, traced via PHR

### ✅ V. Test-First Discipline - PASS
Contract tests created before implementation

### ✅ VI. API Contract Enforcement - PASS
REST API with explicit authentication requirements

**Summary**: 6/6 gates pass. One wording update recommended (non-blocking).

## Project Structure

### Documentation

```text
specs/003-auth-security/
├── spec.md                      # Updated 2026-02-07
├── plan.md                      # This file
├── research.md                  # Phase 0: Session validation patterns
├── data-model.md                # Phase 1: Data structures
├── quickstart.md                # Phase 1: Setup guide
├── contracts/
│   └── session-validation.yaml  # Phase 1: API contracts
└── tasks.md                     # Phase 2: Via /sp.tasks
```

### Source Code

```text
backend/src/auth/
├── session_validator.py      # ✨ NEW: Better Auth API client
├── dependencies.py            # ✨ UPDATE: Session-based deps
└── jwt_handler.py             # ❌ REMOVE: Custom JWT (deprecated)

backend/tests/
├── test_session_validator.py  # ✨ NEW
└── test_auth_dependencies.py  # ✨ UPDATE

frontend/lib/auth/
├── better-auth.ts             # ✨ UPDATE: Remove custom token logic
├── jwt-utils.ts               # ❌ REMOVE: Deprecated
└── diagnostic-logger.ts       # ❌ REMOVE: Temp file

frontend/
├── middleware.ts              # ❌ REMOVE: Causes redirect loop
└── app/dashboard/page.tsx     # ✨ UPDATE: Server-side session check
```

## Phase 0: Research

### Research Questions

1. **Better Auth Session Endpoint**
   - Request/response format for `/api/auth/session`
   - HTTP method, headers, cookie names, schema

2. **FastAPI Cookie Forwarding**
   - How to extract cookies from Request
   - How to forward with httpx

3. **Session Response Schema**
   - Fields Better Auth returns
   - User and session object structure

4. **Error Handling**
   - Failure scenarios and error mapping
   - Better Auth status → Backend status

5. **Next.js Server Component Validation**
   - Pattern for page-level session checks
   - Avoiding middleware issues

6. **Session Cookie Details**
   - Cookie name(s), path, domain, flags
   - Browser inspection

**Output**: `research.md` with all findings

## Phase 1: Design

### Data Models (`data-model.md`)

```python
class User(BaseModel):
    id: str
    email: str
    name: Optional[str]

class Session(BaseModel):
    expiresAt: datetime

class BetterAuthSessionResponse(BaseModel):
    user: User
    session: Session

class AuthenticatedUser(BaseModel):
    user_id: str
    email: str
    name: Optional[str]

class SessionValidationError(BaseModel):
    error_code: str
    message: str
    detail: Optional[str]
```

### API Contracts (`contracts/session-validation.yaml`)

**Dependencies**:
1. `get_current_user(request: Request) -> AuthenticatedUser`
   - Extract cookies, call Better Auth, validate, return user
   - Errors: 401 (invalid), 503 (unavailable), 500 (unexpected)

2. `require_user_id_match(user_id: str, current_user: AuthenticatedUser) -> AuthenticatedUser`
   - Compare session user_id with path user_id
   - Error: 403 (mismatch)

### Quickstart (`quickstart.md`)

- Environment variables
- Start frontend/backend
- Test authentication flow
- Debugging tips

## Phase 2: Implementation (Overview)

**Backend (P0)**:
1. Create session validator
2. Implement FastAPI dependencies
3. Update config
4. Update protected endpoints
5. Remove JWT handler
6-7. Write tests

**Frontend (P1)**:
8. Remove middleware
9. Update dashboard (server-side check)
10. Clean up JWT utilities
11. Update Better Auth config
12. Update SignIn form
13. Update API client
14. Write tests

**Validation (P2)**:
15. E2E test
16. Error handling validation
17. Performance test
18. Documentation

**Note**: Detailed tasks via `/sp.tasks`

## Decision Log

### D1: Session Validation Approach
**Chosen**: Forward cookies to Better Auth endpoint (not custom JWT parsing)
**Rationale**: Spec requirement, eliminates custom crypto, Better Auth handles lifecycle

### D2: Frontend Auth Strategy
**Chosen**: Server-side checks in pages (not middleware)
**Rationale**: Middleware caused redirect loop, page checks more explicit

### D3: Error Response Format
**Chosen**: Map Better Auth errors to standardized backend format
**Rationale**: Spec FR-017, hide implementation details, consistent API

### D4: HTTP Client
**Chosen**: httpx (not requests)
**Rationale**: Async support, better cookies, FastAPI compatible, spec mentions it

### D5: Better Auth Downtime
**Chosen**: Fail closed with 503 (not fail open or cache)
**Rationale**: Security principle, spec edge case requires 503

## Risk Analysis

| Risk | P | I | Mitigation |
|------|---|---|------------|
| Better Auth unreachable | M | H | Retry logic, clear errors, health checks |
| Cookie forwarding fails | M | H | Unit tests, debug logging |
| Schema changes | L | M | Pydantic validation, version pinning |
| User ID mismatch | L | H | Document format, validation tests |
| Manual token handling remains | L | M | Remove utilities, audit imports |
| Middleware removal breaks routes | L | M | Review all routes, test individually |
| Latency > 50ms | M | M | Measure, optimize timeout |

## Success Criteria

From spec + user input:

| Criterion | Validation |
|-----------|------------|
| Login → Dashboard redirect | Manual test, URL check |
| No redirect loop | Manual test, page loads |
| Dashboard loads with valid session | Manual test, content renders |
| Unauthorized → Login redirect | Manual test, no session |
| Backend calls Better Auth | Unit test, mock endpoint |
| Session validation <50ms P95 | Performance test |
| Reject 100% invalid sessions | Unit tests, all return 401 |
| Prevent 100% cross-user access | Integration tests, all return 403 |

## Next Steps

1. ✅ Phase 0 Planning: Complete (this file)
2. 🔄 Phase 0 Research: Execute research tasks → `research.md`
3. 🔄 Phase 1 Design: Create `data-model.md`, `contracts/`, `quickstart.md`
4. 🔄 Phase 1 Context: Run `.specify/scripts/bash/update-agent-context.sh claude`
5. ⏳ Phase 2 Tasks: Run `/sp.tasks`

**Command to proceed**: Continue with research or `/sp.tasks` after Phase 1

## Notes

- Better Auth cookie: typically `better-auth.session_token`
- CORS: Frontend origin must be allowed by backend
- HTTP (dev) vs HTTPS (prod) affects cookie `Secure` flag
- Session expiry: 7 days default, validate on every request (no caching)
- Never log session cookies in production
- Monitor latency to ensure <50ms P95 target
