# Implementation Plan: Backend-Frontend Data Model Alignment

**Feature**: 005-backend-frontend-alignment
**Created**: 2026-02-05
**Status**: Draft
**Branch**: `005-backend-frontend-alignment`

## Executive Summary

This plan addresses 422 (Unprocessable Entity) and 401 (Unauthorized) errors by ensuring backend API models align with frontend TypeScript types, configuring CORS for Vercel deployments, and validating Better Auth JWT token handling. The implementation focuses on environment-driven configuration for CORS origins and Better Auth URLs using pydantic-settings (python-dotenv not needed).

**Primary Objectives**:
1. Fix 422 errors by verifying Pydantic schemas match frontend payload structure
2. Fix 401 errors by validating Better Auth JWT token extraction and validation
3. Configure CORS middleware with environment-driven allowed origins
4. Ensure session dependency correctly reads Better Auth tokens from Authorization headers

**Impact**: Zero frontend-backend integration failures due to field mismatches or authentication issues.

---

## Technical Context

### Current State Analysis

**Existing Implementation** (as of 2026-02-05):

1. **CORS Configuration** (`backend/src/main.py:33-51`):
   - ✅ Already has `CORSMiddleware` configured
   - ✅ `allow_credentials=True` already set
   - ⚠️ **ISSUE**: Origins are hardcoded, should use environment variable
   - ✅ Correct headers allowed: `Content-Type`, `Authorization`
   - ✅ Correct methods allowed: GET, POST, PUT, PATCH, DELETE, OPTIONS

2. **Pydantic Schemas** (`backend/src/schemas/task.py`):
   - ✅ TaskCreate, TaskUpdate, TaskRead models exist
   - ✅ Field names match frontend: `title`, `description`, `is_completed`, `priority`
   - ✅ Validation rules: title (1-255 chars), description (max 2000), priority enum
   - ✅ Serialization: UUIDs and datetimes handled by SQLModel/Pydantic

3. **Better Auth JWT Handling** (`backend/src/auth/jwt_handler.py`, `backend/src/auth/dependencies.py`):
   - ✅ JWT validation using RS256 with JWKS
   - ✅ Extracts `sub` claim for user ID
   - ✅ Authorization header extraction with Bearer prefix
   - ✅ Proper error handling: 401 for auth failures, 403 for authorization failures
   - ✅ `verify_user_access` dependency checks user_id matches JWT sub

4. **Environment Configuration** (`backend/src/config.py`):
   - ✅ Uses pydantic-settings for environment management
   - ✅ `BETTER_AUTH_URL` already configured
   - ✅ Constructs JWKS URL from base URL
   - ⚠️ **MISSING**: `ALLOWED_ORIGINS` environment variable for CORS

5. **Session Dependency** (`backend/src/api/deps.py`):
   - ✅ `UserIdDep` combines JWT auth + authorization
   - ✅ Extracts user_id from path parameter and validates against JWT
   - ✅ Properly uses `verify_user_access` from auth module

### Root Cause Analysis

**422 Errors (Unprocessable Entity)**:
- **Hypothesis**: Pydantic validation rejecting unknown fields or type mismatches
- **Evidence Needed**: Frontend request payload structure vs backend schema
- **Likely Status**: Already resolved - schemas align with frontend types

**401 Errors (Unauthorized)**:
- **Hypothesis 1**: CORS preflight failing → browser never sends Authorization header
- **Hypothesis 2**: JWT token not being extracted from Authorization header correctly
- **Hypothesis 3**: JWKS endpoint unreachable or Better Auth URL misconfigured
- **Resolution**: Verify BETTER_AUTH_URL and CORS configuration

### Technology Stack Confirmation

- **Backend Framework**: FastAPI with Pydantic 2.x
- **ORM**: SQLModel (Pydantic + SQLAlchemy)
- **Database**: Neon PostgreSQL
- **Auth**: Better Auth RS256 JWT with JWKS validation
- **Environment Management**: pydantic-settings (no python-dotenv needed)
- **CORS**: FastAPI CORSMiddleware

### Assumptions

1. Frontend sends JWT tokens in `Authorization: Bearer <token>` header
2. Better Auth JWKS endpoint is accessible at `${BETTER_AUTH_URL}/.well-known/jwks.json`
3. Frontend payload structure matches TaskCreate/TaskUpdate schemas
4. Vercel deployment URLs follow pattern `https://*.vercel.app`
5. Production frontend URL will be set via `ALLOWED_ORIGINS` environment variable

---

## Constitution Check

**Applicable Principles**:

### ✅ I. Multi-Tier Isolation
- **Status**: COMPLIANT
- **Evidence**: All changes confined to `/backend/src/` directory
- **Impact**: No cross-tier contamination

### ✅ II. Persistence First
- **Status**: COMPLIANT
- **Evidence**: No changes to persistence layer - configuration only
- **Impact**: SQLModel models remain unchanged

### ✅ III. Secure by Design
- **Status**: COMPLIANT - Enhancement
- **Evidence**:
  - JWT validation already implemented with RS256/JWKS
  - CORS restricts origins (moving from hardcoded to env-driven)
  - Authorization checks user_id matches JWT sub
- **Impact**: Environment-driven CORS improves security flexibility

### ✅ IV. Zero Manual Coding
- **Status**: COMPLIANT
- **Evidence**: This plan is AI-generated via `/sp.plan` command
- **Impact**: All implementation will be AI-generated via `/sp.tasks` and `/sp.implement`

### ⚠️ V. Test-First Discipline
- **Status**: SHOULD - Not blocking
- **Evidence**: Focus on fixing immediate errors, not TDD
- **Recommendation**: Add integration tests in tasks phase
- **Impact**: Tests added during implementation

### ✅ VI. API Contract Enforcement
- **Status**: COMPLIANT
- **Evidence**:
  - OpenAPI schema auto-generated by FastAPI
  - Pydantic schemas enforce request/response contracts
  - Field names match frontend TypeScript types
- **Impact**: Plan strengthens contract enforcement

**Overall Assessment**: ✅ **COMPLIANT** - All MUST requirements satisfied.

---

## Phase 0: Research & Resolution

### Research Topics

#### RT-001: CORS Wildcard Pattern Support

**Question**: Does FastAPI CORSMiddleware support `https://*.vercel.app` wildcards?

**Findings**:
- **Decision**: FastAPI CORSMiddleware does NOT support wildcards in `allow_origins`
- **Solution**: Use `allow_origin_regex=r"https://.*\.vercel\.app"` for Vercel previews
- **Rationale**: Starlette CORS middleware only supports exact matches or `["*"]`

**Implementation**: Add both `allow_origins` (exact) and `allow_origin_regex` (pattern).

#### RT-002: Python-dotenv with Pydantic Settings

**Question**: Is python-dotenv needed with pydantic-settings?

**Findings**:
- **Decision**: python-dotenv is NOT needed
- **Rationale**: `pydantic-settings` loads `.env` files natively with `SettingsConfigDict(env_file=".env")`
- **Solution**: Keep existing pydantic-settings, update `.env.example`

**Implementation**: No new dependencies. Document environment variables.

#### RT-003: Better Auth Token Transmission

**Question**: Does Better Auth send tokens in cookies or headers?

**Findings**:
- **Decision**: Better Auth uses BOTH cookies (web sessions) AND JWT (API auth)
- **Rationale**: HttpOnly cookies for XSS protection, JWT for stateless API calls
- **Solution**: Continue using Authorization header extraction (current implementation correct)

**Implementation**: No changes. Document that frontend must send JWT in Authorization header.

#### RT-004: Multiple CORS Origins Format

**Question**: How to support multiple origins in environment variable?

**Findings**:
- **Decision**: Comma-separated string: `ALLOWED_ORIGINS="origin1,origin2,origin3"`
- **Rationale**: Standard format for list-type env vars (Docker, Kubernetes)
- **Solution**: Use Pydantic field_validator to split and strip whitespace

**Implementation**: Add validator to Settings class.

---

## Phase 1: Design & Contracts

### Data Model

**No changes required** - SQLModel entities already align with frontend:
- ✅ Task: `id`, `title`, `description`, `is_completed`, `priority`, `created_at`, `user_id`
- ✅ User: `id`, `email`, `name` (Better Auth managed)

### API Contract

**No endpoint changes** - existing REST API:

```
POST   /api/{user_id}/tasks          → TaskCreate → TaskRead
GET    /api/{user_id}/tasks          → TaskList
GET    /api/{user_id}/tasks/{id}     → TaskRead
PUT    /api/{user_id}/tasks/{id}     → TaskUpdate → TaskRead
PATCH  /api/{user_id}/tasks/{id}/complete → TaskRead
DELETE /api/{user_id}/tasks/{id}     → 204
```

**Auth**: All require `Authorization: Bearer <jwt>`.

### Configuration Schema

**Updated Settings** (`backend/src/config.py`):

```python
class Settings(BaseSettings):
    # Existing...
    database_url: str = Field(..., alias="NEON_DATABASE_URL")
    better_auth_url: str = Field(..., alias="BETTER_AUTH_URL")

    # NEW
    allowed_origins: list[str] = Field(
        default=["http://localhost:3000"],
        alias="ALLOWED_ORIGINS"
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v
```

**Updated .env.example**:

```bash
ALLOWED_ORIGINS=http://localhost:3000,https://todo-app.vercel.app
BETTER_AUTH_URL=http://localhost:3000
```

### CORS Configuration

**Updated Middleware** (`backend/src/main.py`):

```python
from src.config import get_settings

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # From env
    allow_origin_regex=r"https://.*\.vercel\.app",  # Vercel previews
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Content-Type", "Authorization", "If-Match", "If-None-Match", "ETag"],
    expose_headers=["ETag", "Last-Modified"],
    max_age=600,
)
```

---

## Phase 2: Implementation Strategy

### Component Changes

#### 1. Configuration (`backend/src/config.py`)
- ✅ Add `allowed_origins` field with validator
- ✅ Parse comma-separated string
- ✅ Document CORS config

#### 2. Main App (`backend/src/main.py`)
- ✅ Import settings
- ✅ Replace hardcoded origins with `settings.allowed_origins`
- ✅ Add `allow_origin_regex` for Vercel

#### 3. Environment (`backend/.env.example`)
- ✅ Add `ALLOWED_ORIGINS` docs
- ✅ Update `BETTER_AUTH_URL` docs
- ✅ Add troubleshooting notes

#### 4. Quickstart Guide (`specs/005-backend-frontend-alignment/quickstart.md`)
- ✅ Environment setup steps
- ✅ Testing CORS and JWT
- ✅ Common error fixes
- ✅ Deployment checklist

---

## Phase 3: Validation & Testing

### Integration Tests

**Test Suite**: `backend/tests/integration/test_cors_auth.py`

1. `test_cors_preflight_allowed_origin` - OPTIONS from allowed origin
2. `test_cors_preflight_disallowed_origin` - OPTIONS from unknown origin
3. `test_cors_vercel_preview_regex` - Regex matches Vercel preview URLs
4. `test_jwt_valid_token` - Valid JWT authenticates
5. `test_jwt_expired_token` - Expired JWT returns 401
6. `test_jwt_missing_token` - No Authorization header returns 401
7. `test_jwt_user_mismatch` - user_id != JWT sub returns 403
8. `test_task_create_valid` - Valid TaskCreate payload
9. `test_task_invalid_priority` - Invalid priority returns 422

### Manual Testing

**Setup**:
- Set `ALLOWED_ORIGINS=http://localhost:3000`
- Set `BETTER_AUTH_URL=http://localhost:3000`

**CORS**:
- [ ] Preflight from localhost:3000 succeeds
- [ ] Preflight from unauthorized origin fails
- [ ] Response includes CORS headers

**JWT**:
- [ ] Signup/login generates valid JWT
- [ ] API call with JWT succeeds
- [ ] API call without JWT returns 401
- [ ] Expired JWT returns 401
- [ ] Mismatched user_id returns 403

**Schema**:
- [ ] POST with valid payload succeeds
- [ ] POST with missing title returns 422
- [ ] POST with invalid priority returns 422

---

## Phase 4: Deployment

### Environment Config

**Local**:
```bash
ALLOWED_ORIGINS=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
```

**Production**:
```bash
ALLOWED_ORIGINS=https://your-app.vercel.app
BETTER_AUTH_URL=https://your-app.vercel.app
```

### Deployment Checklist

**Backend**:
- [ ] Set `ALLOWED_ORIGINS`
- [ ] Set `BETTER_AUTH_URL`
- [ ] Verify `NEON_DATABASE_URL`
- [ ] Restart service
- [ ] Test JWKS: `curl $BETTER_AUTH_URL/.well-known/jwks.json`

**Frontend (Vercel)**:
- [ ] Set `NEXT_PUBLIC_API_URL`
- [ ] Set `BETTER_AUTH_URL`
- [ ] Set `BETTER_AUTH_SECRET`
- [ ] Deploy and test

---

## Risk Analysis

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Regex doesn't match all Vercel previews | High | Low | Document pattern, add tests |
| Missing env var → startup failure | High | Medium | Pydantic validation fails fast |
| JWKS unreachable → all 401s | High | Low | Health check for JWKS connectivity |
| Whitespace in comma-separated origins | Medium | Low | Validator strips whitespace |
| Regex too permissive | Medium | Low | Pattern anchored to `\.vercel\.app` |

---

## Success Criteria

- ✅ Zero 422 errors for valid payloads
- ✅ Zero 401 errors for valid JWT tokens
- ✅ Zero CORS errors in browser console
- ✅ 100% test coverage for CORS and JWT flows
- ✅ Environment-driven config (no hardcoded values)
- ✅ 50% faster developer onboarding

---

## Next Steps

1. Run `/sp.tasks` to generate actionable tasks
2. Review task dependencies
3. Run `/sp.implement` to execute
4. Manual validation
5. Create PHR

---

## ADR Candidates

### ADR-001: Regex for Vercel Preview Deployments

**Decision**: Use `allow_origin_regex=r"https://.*\.vercel\.app"`

**Rationale**: Vercel creates unique preview URLs per branch (unpredictable). Regex matches all automatically.

**Tradeoffs**: Slightly more permissive (any Vercel subdomain), but acceptable since we control the account.

**Alternatives**: List all URLs (not scalable), custom middleware (overengineering).

---

**Plan Status**: ✅ Ready for `/sp.tasks`
