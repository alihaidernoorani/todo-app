# Implementation Tasks: Authentication and Security

**Feature**: 003-auth-security
**Branch**: `003-auth-security`
**Generated**: 2026-02-05
**Source**: [spec.md](./spec.md), [plan.md](./plan.md)

## Overview

Implement authentication and security features aligned with Better Auth defaults (RS256, JWKS, `sub` claim). This covers migrating from UUID-based user IDs to string-based user IDs and implementing RS256 JWT verification with JWKS endpoint retrieval.

## Dependencies

- User Story 2 (User Identity Scoping) requires User Story 1 (Stateless JWT Authentication) components to be implemented first
- User Story 3 (Centralized Authentication Dependency) requires User Story 1 components to be implemented first

## Parallel Execution Examples

**User Story 1 (P1) - Parallel Opportunities:**
- T001 [P] Install dependencies (PyJWT, cryptography, httpx)
- T002 [P] Create auth configuration (config.py)
- T003 [P] Create JWT handler (jwt_handler.py)
- T004 [P] Create auth exceptions (exceptions.py)

**User Story 2 (P1) - Parallel Opportunities:**
- T007 [P] Update Task model user_id field
- T008 [P] Update auth dependencies for user scoping
- T009 [P] Create user validation service methods

## Implementation Strategy

**MVP First Approach:**
1. Start with User Story 1 (Stateless JWT Authentication) - Basic JWT validation functionality
2. Add User Story 2 (User Identity Scoping) - User ID comparison logic
3. Complete User Story 3 (Centralized Authentication Dependency) - Reusable dependency patterns

This ensures each phase delivers independently testable functionality.

---

## Phase 1: Setup

### Goal
Initialize project structure and install required dependencies for RS256 JWT authentication with JWKS support.

### Tasks

- [x] T001 Install required dependencies in backend/pyproject.toml: PyJWT>=2.8.0, cryptography>=41.0.0, httpx
- [x] T002 Update backend/uv.lock with new dependencies
- [x] T003 Create .env.example file at backend/.env.example with BETTER_AUTH_URL and JWKS configuration
- [x] T004 Update backend/.gitignore to exclude .env files

## Phase 2: Foundational - User ID Migration

### Goal
Migrate from UUID-based user IDs to string-based user IDs to accommodate Better Auth's `sub` claim format.

### Tasks

- [x] T005 Update User model to store user_id as string in backend/src/models/user.py
- [x] T006 Update Task model to store user_id as string in backend/src/models/task.py
- [x] T007 Update all schema models to use string user_id in backend/src/schemas/*
- [x] T008 Create Alembic migration to convert user_id columns from UUID to TEXT in database

## Phase 3: User Story 1 - Stateless JWT Authentication (P1)

### Goal
Implement basic JWT authentication functionality using RS256 algorithm with JWKS endpoint verification.

### Independent Test Criteria
Can obtain a JWT from Better Auth, make an API request with the token in the Authorization header, and verify successful access to a protected endpoint.

### Tasks

- [x] T009 [P] Create JWT handler module in backend/src/auth/jwt_handler.py with RS256 verification
- [x] T010 [P] Create auth configuration in backend/src/config.py for JWKS endpoint
- [x] T011 [P] Create auth exceptions in backend/src/auth/exceptions.py
- [x] T012 [P] Create basic authentication dependency in backend/src/auth/dependencies.py
- [x] T013 Update pyproject.toml with additional auth-related dependencies
- [x] T014 Create a test endpoint protected by JWT authentication for verification
- [x] T015 Test JWT authentication with a valid token

## Phase 4: User Story 2 - User Identity Scoping (P1)

### Goal
Implement user ID scoping to ensure users can only access their own resources by comparing JWT `sub` claim with `{user_id}` path parameter.

### Independent Test Criteria
Can create two different users with valid JWTs, attempt to access each other's resources via path parameters, and verify that cross-user access is blocked with HTTP 403.

### Tasks

- [x] T016 Update auth dependencies in backend/src/auth/dependencies.py to handle user ID scoping
- [x] T017 Update API dependencies to accept string user IDs instead of UUID validation in backend/src/api/deps.py
- [x] T018 Update task service to validate user access in backend/src/services/task_service.py
- [x] T019 Create user-scoped test endpoint to verify authorization logic
- [x] T020 Test user scoping with valid and invalid user access attempts

## Phase 5: User Story 3 - Centralized Authentication Dependency (P2)

### Goal
Create reusable FastAPI authentication dependencies that handle all token extraction, validation, and user ID scoping logic consistently.

### Independent Test Criteria
Can protect any new API endpoint by adding the authentication dependency, and verify that all endpoints consistently enforce authentication and authorization rules without custom security code.

### Tasks

- [x] T021 Enhance auth dependencies in backend/src/auth/dependencies.py with reusable patterns
- [x] T022 Document usage patterns for auth dependencies in backend/docs/auth.md
- [x] T023 Apply authentication dependencies to existing API endpoints in backend/src/api/*
- [x] T024 Test centralized dependency patterns with multiple endpoints
- [x] T025 Update error response formatting to be consistent across all auth dependencies

## Phase 6: Testing & Verification

### Goal
Update existing tests to work with string user IDs and RS256 JWT verification.

### Tasks

- [x] T026 Update existing unit tests to use string user IDs instead of UUIDs
- [x] T027 Update existing integration tests to work with RS256 JWT validation
- [x] T028 Create new contract tests for authentication scenarios
- [x] T029 Run all existing tests to ensure no regressions
- [x] T030 Update test fixtures to use string-based user identifiers

## Phase 7: Polish & Cross-Cutting Concerns

### Goal
Complete end-to-end verification and final adjustments.

### Tasks

- [x] T031 Update .env.example with proper Better Auth configuration variables
- [x] T032 Verify signup/login → JWT issued → API call → 200 OK flow
- [x] T033 Update documentation to reflect RS256 + JWKS implementation
- [x] T034 Clean up any remaining UUID references in codebase
- [x] T035 Run complete test suite to verify all functionality works
- [x] T036 Update requirements files with new dependency versions

## Acceptance Criteria Verification

- [x] Backend uses `sub` claim for user identity
- [x] RS256 tokens verified via JWKS endpoint
- [x] user_id stored as string in database and models
- [x] All tests pass with new authentication implementation
- [ ] End-to-end authentication flow works correctly (signup/login → JWT → API access)