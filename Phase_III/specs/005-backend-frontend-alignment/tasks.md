# Tasks: Backend-Frontend Data Model Alignment

**Feature**: 005-backend-frontend-alignment
**Created**: 2026-02-05
**Prerequisites**: plan.md ✅, spec.md ✅, quickstart.md ✅

**Organization**: Streamlined atomic tasks focusing on configuration, middleware, and verification.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Environment Configuration

**Purpose**: Setup environment variable templates and documentation

- [X] T001 Update backend/.env.example to add ALLOWED_ORIGINS with comma-separated format documentation and examples
- [X] T002 [P] Add comment block in backend/.env.example explaining CORS origin format and Vercel preview pattern

**Checkpoint**: Environment template ready for configuration

---

## Phase 2: Pydantic Settings Model Update

**Purpose**: Add environment-driven CORS origins support to configuration model

- [X] T003 Add allowed_origins field to Settings class in backend/src/config.py with Field(default=["http://localhost:3000"], alias="ALLOWED_ORIGINS")
- [X] T004 Add @field_validator decorator for allowed_origins in backend/src/config.py to parse comma-separated strings and strip whitespace
- [X] T005 Add docstring to parse_cors_origins validator in backend/src/config.py explaining comma-separated format

**Checkpoint**: Configuration model updated and can parse ALLOWED_ORIGINS

---

## Phase 3: CORS Middleware Configuration

**Purpose**: Update FastAPI middleware to use environment-driven origins

- [X] T006 Add "from src.config import get_settings" import at top of backend/src/main.py
- [X] T007 Add "settings = get_settings()" line before app.add_middleware in backend/src/main.py
- [X] T008 Replace hardcoded allow_origins list with settings.allowed_origins in CORSMiddleware config in backend/src/main.py
- [X] T009 Add allow_origin_regex=r"https://.*\.vercel\.app" parameter to CORSMiddleware config in backend/src/main.py

**Checkpoint**: CORS middleware configured with environment variables

---

## Phase 4: Database Connection Verification

**Purpose**: Verify database connection works with updated configuration

- [X] T010 Test Settings model loads correctly: run "python -c 'from src.config import get_settings; s = get_settings(); print(s.allowed_origins)'" from backend directory
- [X] T011 Test database connection with new settings: run "python -c 'from src.config import get_settings; from src.database import create_db_and_tables; import asyncio; asyncio.run(create_db_and_tables())'" from backend directory
- [X] T012 Start backend with uvicorn and verify no startup errors: "uvicorn src.main:app --reload" and check logs for config/database errors

**Checkpoint**: Database connection verified working with configuration changes

---

## Phase 5: Integration Testing

**Purpose**: Validate CORS and JWT authentication work correctly

- [X] T013 Set ALLOWED_ORIGINS=http://localhost:3000 in backend/.env and restart backend
- [X] T014 Test CORS preflight from allowed origin: "curl -X OPTIONS http://localhost:8000/api/test-user-id/tasks -H 'Origin: http://localhost:3000' -v" and verify access-control-allow-origin header
- [X] T015 Test CORS rejection from unauthorized origin: "curl -X OPTIONS http://localhost:8000/api/test-user-id/tasks -H 'Origin: https://malicious.com' -v" and verify no CORS headers

**Checkpoint**: CORS configuration tested and working

---

## Execution Strategy

### Dependencies Graph

```
Phase 1 (Environment)
    ↓
Phase 2 (Config Model)
    ↓
Phase 3 (Middleware)
    ↓
Phase 4 (Database Verify)
    ↓
Phase 5 (Testing)
```

**Critical Path**: All phases must run sequentially (each depends on previous)

**Parallel Opportunities**:
- Within Phase 1: T001 and T002 can run in parallel (same file, different sections)
- Within Phase 5: T014 and T015 can run after T013 completes

### Incremental Delivery

**MVP**: Phases 1-3 (Configuration + Middleware)
- Fixes CORS configuration with environment variables

**Complete**: All phases
- Includes database verification and integration testing

---

## Task Summary

**Total Tasks**: 15 tasks across 5 phases

**Breakdown by Phase**:
- Phase 1 (Environment): 2 tasks
- Phase 2 (Config Model): 3 tasks
- Phase 3 (Middleware): 4 tasks
- Phase 4 (Database Verify): 3 tasks
- Phase 5 (Testing): 3 tasks

**Parallel Opportunities**: 2 tasks marked [P]

**Key Changes**:
1. **Configuration Model** (`backend/src/config.py`): Add `allowed_origins` field with comma-separated parsing validator
2. **Middleware** (`backend/src/main.py`): Replace hardcoded origins with `settings.allowed_origins`, add Vercel regex pattern
3. **Environment** (`backend/.env.example`): Document ALLOWED_ORIGINS format and examples

**Files Modified**:
- `backend/src/config.py` (3 tasks)
- `backend/src/main.py` (4 tasks)
- `backend/.env.example` (2 tasks)

**Verification Steps**:
- Settings model test (T010)
- Database connection test (T011)
- Backend startup test (T012)
- CORS preflight tests (T014, T015)
