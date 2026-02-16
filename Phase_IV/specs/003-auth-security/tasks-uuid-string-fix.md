# Tasks: Fix User ID UUID-to-String Mismatch

**Feature**: 003-auth-security (UUID String Migration)
**Priority**: P0 (BLOCKING - authentication broken)

**Problem**: Backend expects UUID user IDs, but Better Auth generates immutable string IDs. This causes "Invalid user ID format" (400) errors and blocks all authentication flows.

**Goal**: Align backend completely with Better Auth string user IDs and resolve all authentication issues end-to-end.

## Format: `- [ ] [ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Data Model Migration (CRITICAL)

**Purpose**: Change all user_id fields from UUID to string

**⚠️ BLOCKS ALL OTHER WORK**

- [X] T001 Update Task model in backend/src/models/task.py (change user_id from UUID to str)
- [X] T002 [P] Update all schemas in backend/src/schemas/task.py (TaskRead, TaskCreate, etc.) to use str for user_id
- [X] T003 [P] Remove unused UUID imports from models and schemas

**Checkpoint**: All Python models and schemas now use string user_id

---

## Phase 2: Database Migration

**Purpose**: Migrate database schema from UUID to TEXT

- [X] T004 Create Alembic migration backend/alembic/versions/003_migrate_user_id_to_string.py
- [X] T005 Implement upgrade() to convert tasks.user_id from UUID to TEXT with safe data conversion
- [X] T006 Implement downgrade() to rollback TEXT to UUID
- [X] T007 Test migration upgrade and downgrade in development database

**Checkpoint**: Database schema aligned with string user_id model

---

## Phase 3: API and Service Layer Updates

**Purpose**: Remove UUID validation and update all business logic

- [X] T008 Update backend/src/api/deps.py: Remove UUID() conversion, change UserIdDep to str type
- [X] T009 Update all service functions in backend/src/services/task_service.py (change all user_id: UUID → user_id: str)
- [X] T010 [P] Remove unused UUID imports from API and service layers

**Checkpoint**: API and service layers operate with string user IDs

---

## Phase 4: Authentication Integration Verification

**Purpose**: Ensure Better Auth JWT integration works correctly

- [X] T011 [P] Verify BETTER_AUTH_SECRET matches between frontend and backend
- [X] T012 [P] Verify JWT handler extracts 'uid' as string (backend/src/auth/jwt_handler.py) - Fixed to use 'sub' claim
- [X] T013 [P] Verify verify_user_access() dependency compares string IDs correctly
- [X] T014 Test JWT token extraction with real Better Auth token

**Checkpoint**: JWT authentication passes string user IDs correctly

---

## Phase 5: Test Suite Updates

**Purpose**: Update all tests to use string user IDs

- [ ] T015 Update test fixtures in backend/tests/conftest.py (replace uuid4() with string IDs)
- [ ] T016 [P] Update contract tests in backend/tests/contract/ to use string user IDs
- [ ] T017 [P] Update integration tests in backend/tests/integration/ to use string user IDs
- [ ] T018 [P] Update unit tests in backend/tests/unit/ to use string user IDs
- [ ] T019 Run full test suite and verify 100% pass rate

**Checkpoint**: All tests pass with string user IDs

---

## Phase 6: End-to-End Verification

**Purpose**: Validate complete authentication flow

- [ ] T020 Test user signup/login via Better Auth (generates string user ID)
- [ ] T021 Test authenticated API request to /api/{user_id}/tasks returns 200 (not 400)
- [ ] T022 Test all CRUD operations work for authenticated users
- [ ] T023 Test authorization: cross-user access blocked with 403
- [ ] T024 Test error cases: missing token (401), expired token (401), malformed token (401)

**Checkpoint**: Full authentication flow works end-to-end

---

## Phase 7: Production Deployment

**Purpose**: Deploy and stabilize in production

- [ ] T025 Run database migration in production
- [ ] T026 Deploy updated backend code to production
- [ ] T027 Monitor logs for "Invalid user ID format" errors (should be zero)
- [ ] T028 Verify production authentication flow with real users

**Checkpoint**: Production stable with string user IDs

---

## Phase 8: Cleanup

**Purpose**: Polish and documentation

- [ ] T029 [P] Run ruff linting and formatting on all modified files
- [ ] T030 [P] Update API documentation to reflect string user_id type

---

## Dependencies & Execution Order

### Critical Path
1. **Phase 1** (Models) → **BLOCKS everything**
2. **Phase 2** (Database) → **BLOCKS E2E testing**
3. **Phase 3** (API/Service) → Can run parallel to Phase 2
4. **Phase 4** (Auth verification) → Can run parallel to Phase 2/3
5. **Phase 5** (Tests) → Depends on Phases 1-3
6. **Phase 6** (E2E) → Depends on Phases 2-5
7. **Phase 7** (Production) → Depends on Phase 6
8. **Phase 8** (Cleanup) → Can run parallel to Phase 7

### Parallel Opportunities
- Phase 3 and Phase 4 can run in parallel after Phase 1
- T002, T003 can run in parallel within Phase 1
- T010 can run parallel within Phase 3
- T011, T012, T013 can run in parallel within Phase 4
- T016, T017, T018 can run in parallel within Phase 5
- T029, T030 can run in parallel within Phase 8

---

## Implementation Strategy

### Sequential (Single Developer)
1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
2. **Estimated Time**: 2-3 hours

### Parallel (2-3 Developers)
- **Dev A**: Phase 1 → Phase 2 (Critical path)
- **Dev B**: Wait for Phase 1 → Phase 3 (API/Service) parallel to A's Phase 2
- **Dev C**: Wait for Phase 1 → Phase 4 (Auth verification) parallel to A/B
- All converge: Phase 5 → Phase 6 → Phase 7 → Phase 8
- **Estimated Time**: 1-2 hours

---

## Success Criteria

- [ ] Backend accepts Better Auth string user IDs without "Invalid user ID format" errors
- [ ] Database stores user_id as TEXT/VARCHAR (not UUID)
- [ ] All tests pass (100%)
- [ ] End-to-end authentication flow works in production
- [ ] No 400 errors in production logs
- [ ] CRUD operations work for authenticated users

---

## Total Task Count: 30 Tasks

- **Phase 1 (Data Model)**: 3 tasks - CRITICAL BLOCKER
- **Phase 2 (Database)**: 4 tasks - CRITICAL for E2E
- **Phase 3 (API/Service)**: 3 tasks
- **Phase 4 (Auth Verification)**: 4 tasks
- **Phase 5 (Test Updates)**: 5 tasks
- **Phase 6 (E2E Testing)**: 5 tasks
- **Phase 7 (Production)**: 4 tasks
- **Phase 8 (Cleanup)**: 2 tasks

**Parallel Opportunities**: 12 tasks marked [P] can run in parallel

**Critical Path**: T001 → T004-T007 → T020-T024 → T025-T028 (17 tasks, ~2 hours)

---

## Current Error Context

**Error**: `400 Bad Request - Invalid user ID format`

**Root Cause**: `UUID(user_id)` validation in backend/src/api/deps.py:44 fails on Better Auth string IDs

**Fix Summary**:
1. Change `user_id: UUID` → `user_id: str` everywhere
2. Migrate database UUID → TEXT
3. Remove UUID validation in API
4. Update tests to use strings
5. Deploy and verify
