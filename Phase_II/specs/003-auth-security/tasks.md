# Tasks: Stateless JWT Authentication Migration

**Feature**: 003-auth-security
**Generated**: 2026-02-07
**Status**: Ready for implementation

**Input**: Design documents from `/specs/003-auth-security/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks organized by phase and user story for systematic implementation
**Tests**: Included per user requirements

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Parallelizable (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3)

---

## Phase 1: Backend Setup (JWT Infrastructure)

**Purpose**: Add JWT dependencies and configuration

- [X] T001 Add JWT dependencies to backend/requirements.txt (PyJWT>=2.8.0, cryptography>=41.0.0)
- [X] T002 Add JWT configuration fields to backend/src/config.py (better_auth_secret, better_auth_jwks_url property)
- [X] T003 Create backend/.env.example entries for BETTER_AUTH_SECRET and document RS256 vs HS256

**Checkpoint**: JWT dependencies and config ready

---

## Phase 2: Backend JWT Verification Core (Foundational)

**Purpose**: Implement complete JWT verification with JWKS

- [X] T004 Enhance backend/src/auth/jwt_handler.py decode_jwt() to validate issuer and audience claims
- [X] T005 Update backend/src/auth/jwt_handler.py to require ["sub", "exp", "iat", "iss"] claims in both RS256 and HS256
- [X] T006 Add JWT exception classes to backend/src/auth/exceptions.py (JWTExpiredError, JWTInvalidSignatureError, JWTMissingClaimError, JWKSUnavailableError)

**Checkpoint**: JWT verification validates all claims and signatures

---

## Phase 3: Backend Startup Validation (JWKS)

**Purpose**: Ensure JWKS endpoint reachable before accepting traffic

- [X] T007 Add lifespan event to backend/src/main.py that validates JWKS endpoint on startup
- [X] T008 Initialize PyJWKClient in lifespan and cache in app.state.jwks_client
- [X] T009 Add RuntimeError on startup if JWKS endpoint unavailable or returns no keys

**Checkpoint**: Application fails fast if JWKS unreachable

---

## Phase 4: User Story 1 - JWT Token Validation (Priority: P1) 🎯 MVP

**Goal**: Replace session validation with JWT signature verification

**Independent Test**: Login → get JWT → make request with Authorization header → verify 200

### Backend JWT Authentication

- [X] T010 [US1] Replace session_validator imports with jwt_handler and HTTPBearer in backend/src/auth/dependencies.py
- [X] T011 [US1] Update get_current_user() in backend/src/auth/dependencies.py to extract JWT from Authorization header using HTTPBearer
- [X] T012 [US1] Replace validate_session() call with decode_jwt() call in get_current_user()
- [X] T013 [US1] Update AuthenticatedUser instantiation to use JWT payload (sub, email, name claims)
- [X] T014 [US1] Replace session error handlers with JWT exception handlers (JWTExpiredError, JWKSUnavailableError)
- [X] T015 [US1] Update error messages in backend/src/api/v1/auth.py /me endpoint to reference JWT tokens

### Frontend JWT Integration

- [X] T016 [US1] Enable JWT plugin in frontend/lib/auth/better-auth.ts with RS256, 15min expiry, issuer/audience config
- [X] T017 [US1] Create frontend/lib/auth/token-storage.ts with TokenStorage class (set, get, clear, isExpired, decode methods)
- [X] T018 [US1] Update frontend/lib/auth/useSession.ts to extract JWT from Better Auth session and store in localStorage
- [X] T019 [US1] Update frontend/lib/api/client.ts to inject Authorization Bearer header with JWT from TokenStorage
- [X] T020 [US1] Add 401 error handler in frontend/lib/api/client.ts to clear expired tokens from localStorage
- [X] T021 [US1] Update error mapping in frontend/lib/api/client.ts for JWT-specific errors (expired, invalid signature)

**Checkpoint**: US1 complete - JWT authentication working end-to-end

---

## Phase 5: User Story 2 - User Identity Scoping (Priority: P1)

**Goal**: Enforce user_id path validation using JWT sub claim

**Independent Test**: User A tries /users/{user_b_id}/tasks → verify 403

- [X] T022 [US2] Update error detail in backend/src/auth/dependencies.py get_current_user_with_path_validation() to clarify JWT-based validation
- [X] T023 [US2] Add debug logging for user_id mismatch cases in backend/src/auth/dependencies.py
- [X] T024 [US2] Verify all task endpoints in backend/src/api/v1/tasks.py use get_current_user_with_path_validation dependency
- [X] T025 [US2] Update frontend/lib/api/tasks.ts error handling to catch 403 with user-friendly message

**Checkpoint**: US2 complete - Cross-user access blocked

---

## Phase 6: User Story 3 - Centralized Authentication (Priority: P2)

**Goal**: Ensure all endpoints use consistent JWT authentication

**Independent Test**: Add new endpoint with Depends(get_current_user) → verify JWT works

- [X] T026 [US3] Audit all endpoints in backend/src/api/v1/ to verify consistent authentication dependency usage
- [X] T027 [US3] Create backend/docs/authentication.md documenting JWT authentication flow and dependency usage patterns
- [X] T028 [US3] Add code examples to backend/docs/authentication.md for protecting new endpoints with JWT dependencies

**Checkpoint**: US3 complete - All endpoints use standardized JWT auth

---

## Phase 7: Cleanup & Migration (Remove Session Logic)

**Purpose**: Remove obsolete session-based code

### Backend Cleanup

- [X] T029 Delete backend/src/auth/session_validator.py file entirely
- [X] T030 Remove better_auth_session_url field and session_endpoint_url property from backend/src/config.py
- [X] T031 Remove BETTER_AUTH_SESSION_URL from backend/.env and .env.example

### Frontend Cleanup

- [X] T032 [P] Remove credentials: 'include' from frontend/lib/api/client.ts (JWT-only mode)
- [X] T033 [P] Update frontend/lib/hooks/use-auth-redirect.ts to use TokenStorage.getAccessToken() for token presence check
- [X] T034 [P] Delete frontend/app/api/auth/session/route.ts if it exists

### Documentation

- [X] T035 Create specs/003-auth-security/ARCHITECTURE.md documenting complete JWT flow with diagrams
- [X] T036 Add before/after comparison in ARCHITECTURE.md showing session vs JWT migration

**Checkpoint**: Cleanup complete - Session logic removed

---

## Phase 8: Testing (Validation & Quality)

**Purpose**: Comprehensive JWT authentication testing

### Backend Tests

- [X] T037 [P] Create backend/tests/test_jwt_authentication.py with valid token, expired token, invalid signature, missing token tests
- [X] T038 [P] Create backend/tests/test_jwt_authorization.py with cross-user access and user_id scoping tests
- [X] T039 [P] Add backend/tests/test_jwks_startup.py to verify startup validation with unreachable JWKS endpoint

### Frontend Tests

- [X] T040 [P] Create frontend/tests/token-storage.test.ts testing TokenStorage set, get, clear, isExpired methods
- [X] T041 [P] Create frontend/tests/api-client-jwt.test.ts testing JWT header injection in API client

### Integration Tests

- [X] T042 Add end-to-end test: signup → login → get JWT → authenticated request → verify 200
- [X] T043 Add end-to-end test: expired token → request → verify 401 → token cleared from localStorage

**Checkpoint**: All JWT flows validated with tests

---

## Phase 9: Production Hardening & Polish

**Purpose**: Security hardening and deployment readiness

### Security

- [X] T044 [P] Add CSP headers to frontend/next.config.js (default-src 'self', script-src with trusted domains, connect-src with API URL)
- [X] T045 [P] Add security headers to frontend/next.config.js (X-Frame-Options: DENY, X-Content-Type-Options: nosniff)

### Environment Validation

- [X] T046 Create backend/scripts/validate-jwt-config.sh to check BETTER_AUTH_SECRET length and JWKS endpoint reachability
- [X] T047 Add colored output and error reporting to validation script

### Deployment Documentation

- [X] T048 [P] Create deployment/JWT_DEPLOYMENT.md with environment checklist and JWKS endpoint requirements
- [X] T049 [P] Add troubleshooting guide for common JWT errors to deployment documentation
- [X] T050 [P] Document rollback procedure if JWT migration fails

### Quickstart Update

- [X] T051 Update specs/003-auth-security/quickstart.md with JWT-specific setup steps
- [X] T052 Add "Testing JWT Authentication" section with curl examples to quickstart.md
- [X] T053 Run through complete quickstart guide and verify all steps work

**Checkpoint**: Production-ready deployment

---

## Dependencies & Execution Order

### Phase Dependencies (Critical Path)

```
Phase 1 (Setup) → Phase 2 (JWT Core) → Phase 3 (Startup) →
Phase 4 (US1: JWT Auth) → Phase 5 (US2: Scoping) → Phase 6 (US3: Audit) →
Phase 7 (Cleanup) → Phase 8 (Testing) → Phase 9 (Production)
```

### Within-Phase Dependencies

**Phase 1**: T001 → T002 → T003 (sequential)

**Phase 2**:
- T004, T005 can run in parallel
- T006 can run in parallel with T004-T005

**Phase 3**: T007 → T008 → T009 (sequential, lifespan setup)

**Phase 4 (US1)**:
- Backend (T010-T015) must complete before frontend (T016-T021)
- Backend sequence: T010 (imports) → T011-T014 (implementation) → T015 (endpoints)
- Frontend sequence: T016 (JWT plugin) → T017 (storage) → T018-T021 (integration)
- Parallel within backend: T014, T015
- Parallel within frontend: T017, T018

**Phase 5 (US2)**:
- T022-T023 (backend) must complete before T024-T025
- T024 (backend audit) can run in parallel with T025 (frontend)

**Phase 6 (US3)**:
- T026 (audit) → T027-T028 (docs can run in parallel)

**Phase 7 (Cleanup)**:
- Backend (T029-T031) independent of Frontend (T032-T034)
- Documentation (T035-T036) can run in parallel with cleanup
- Parallel: T029, T030, T031, T032, T033, T034, T035, T036

**Phase 8 (Testing)**:
- All tests can run in parallel except integration (T042-T043 need prior phases complete)
- Parallel: T037, T038, T039, T040, T041

**Phase 9 (Production)**:
- Security (T044-T045) can run in parallel
- Validation (T046-T047) can run in parallel with security
- Docs (T048-T050) can run in parallel with security and validation
- Quickstart (T051-T053) should run last for final verification

### Parallel Opportunities Summary

- **Phase 2**: 2-3 tasks parallel
- **Phase 4**: Backend (2 parallel) + Frontend (2 parallel)
- **Phase 5**: 2 tasks parallel
- **Phase 6**: 2 tasks parallel
- **Phase 7**: 8 tasks parallel
- **Phase 8**: 5 tasks parallel
- **Phase 9**: 10 tasks parallel

**Total parallel opportunities**: 29 tasks (marked with [P])

---

## Implementation Strategy

### MVP Approach (Fastest to Working JWT)

1. **Phases 1-3** (T001-T009): Infrastructure → 9 tasks, ~3 hours
2. **Phase 4** (T010-T021): JWT Authentication → 12 tasks, ~6 hours 🎯
3. **VALIDATE**: Test complete authentication flow
4. **Phase 5** (T022-T025): User Scoping → 4 tasks, ~2 hours
5. **Phase 6** (T026-T028): Audit & Document → 3 tasks, ~2 hours
6. **Phase 7** (T029-T036): Cleanup → 8 tasks, ~2 hours
7. **Phase 8** (T037-T043): Testing → 7 tasks, ~4 hours
8. **Phase 9** (T044-T053): Production → 10 tasks, ~4 hours

**Total**: 53 focused tasks, ~23 hours (with parallelization: ~15 hours)

### Incremental Milestones

- **M1** (T001-T009): JWT infrastructure ready
- **M2** (T010-T015): Backend JWT validation working
- **M3** (T016-T021): Frontend JWT integration complete ✅ **MVP**
- **M4** (T022-T025): User scoping enforced
- **M5** (T026-T028): Consistent auth across all endpoints
- **M6** (T029-T036): Session code removed
- **M7** (T037-T043): All tests passing
- **M8** (T044-T053): Production-ready

### Risk Mitigation

**Dual Auth Phase (T010-T021)**:
- Both JWT and session work during Phase 4 implementation
- JWT failures don't break existing functionality
- Monitor authentication success rates

**Testing Before Cleanup**:
- Phase 8 (Testing) validates everything before Phase 7 (Cleanup)
- Can rollback easily if tests fail
- No data loss risk

**Rollback Plan**:
1. Git revert Phase 7 changes (restore session_validator.py)
2. Git revert Phase 4 backend (restore session in dependencies.py)
3. Git revert Phase 4 frontend (remove JWT plugin)
4. Investigate failure root cause
5. Fix and retry migration

---

## Task Validation Checklist

**Each task must:**
- ✅ Focus on single file or logical concern
- ✅ Be independently testable
- ✅ Include exact file path
- ✅ Be completable in 20-40 minutes
- ✅ Have clear acceptance criteria

**Organization:**
- ✅ Organized by phase and user story
- ✅ Aligned with spec.md priorities
- ✅ Clear execution dependencies
- ✅ Parallel opportunities identified

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 53 |
| **Phases** | 9 |
| **User Stories** | 3 (US1: JWT Validation, US2: User Scoping, US3: Audit) |
| **Parallel Tasks** | 29 (marked with [P]) |
| **MVP Scope** | Phases 1-4 (T001-T021) = 21 tasks |
| **Estimated Time** | 23 hours sequential, 15 hours parallel |

**Key Success Metrics**:
- ✅ JWT verification <10ms (cached JWKS)
- ✅ 100% invalid tokens rejected (401)
- ✅ 100% cross-user access blocked (403)
- ✅ Zero session endpoint calls
- ✅ Application fails if JWKS unreachable on startup

**Complexity Distribution**:
- Simple: 20 tasks (config, cleanup, docs)
- Moderate: 25 tasks (implementation, testing)
- Complex: 8 tasks (JWT core, dependencies, integration)

---

**Status**: Ready for implementation
**Next Command**: `/sp.implement` or start with Phase 1
**Branch**: Will create `003-auth-security` from current fix/auth-session-redirect-loop
