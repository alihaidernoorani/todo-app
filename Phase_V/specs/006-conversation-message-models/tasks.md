---
description: "Task list for Conversation and Message Models implementation"
---

# Tasks: Conversation and Message Models for AI Chatbot

**Input**: Design documents from `/specs/006-conversation-message-models/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md (required), research.md, quickstart.md

**Tests**: Not requested in specification. Tasks focus on model implementation and migration.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/models/`, `backend/alembic/versions/`
- **Tests** (if added later): `backend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and ensure backend structure is ready

- [X] T001 Verify backend directory structure exists at backend/src/models/
- [X] T002 Verify Alembic is configured in backend/alembic/
- [X] T003 Verify database connection works in backend/src/core/database.py

**Checkpoint**: Backend infrastructure verified - model creation can proceed

---

## Phase 2: User Story 1 - Store Conversation History (Priority: P1) 🎯 MVP

**Goal**: Enable persistent conversation and message storage in the database for stateless backend

**Independent Test**: Create a conversation, add multiple messages with different roles, query them back in chronological order, verify user_id scoping works

### Implementation for User Story 1

- [X] T004 [P] [US1] Create Conversation model file at backend/src/models/conversation.py with SQLModel class definition
- [X] T005 [P] [US1] Create Message model file at backend/src/models/message.py with SQLModel class definition
- [X] T006 [US1] Update model exports in backend/src/models/__init__.py to include Conversation and Message
- [X] T007 [US1] Generate Alembic migration using "alembic revision --autogenerate -m 'Add conversation and message models'" in backend/
- [X] T008 [US1] Review generated migration file in backend/alembic/versions/ to verify foreign keys, indexes, and CASCADE DELETE
- [X] T009 [US1] Run Alembic migration using "alembic upgrade head" in backend/ to create tables
- [X] T010 [US1] Verify tables created in database using psql commands "\d conversations" and "\d messages"

**Checkpoint**: At this point, User Story 1 should be fully functional - conversations and messages can be created, queried, and deleted with CASCADE ✅

---

## Phase 3: User Story 2 - Maintain Data Integrity (Priority: P2)

**Goal**: Ensure database constraints prevent invalid data (orphaned messages, user mismatch)

**Independent Test**: Attempt to create message without conversation, attempt to create message with mismatched user_id, verify both fail gracefully

### Implementation for User Story 2

- [X] T011 [US2] Test foreign key constraint by attempting to insert message with non-existent conversation_id in backend/ Python REPL
- [X] T012 [US2] Verify CASCADE DELETE by creating conversation with messages, deleting conversation, confirming messages auto-deleted
- [X] T013 [US2] Document constraint behavior in backend/src/models/README.md (create if not exists)

**Checkpoint**: At this point, User Story 2 validation complete - database integrity constraints prevent data corruption ✅

---

## Phase 4: User Story 3 - Support Conversation Lifecycle (Priority: P3)

**Goal**: Enable timestamp tracking for conversation activity (created_at, updated_at)

**Independent Test**: Create conversation, verify timestamps set automatically, add message, verify updated_at reflects latest activity (note: updated_at auto-update will be handled by API layer in future)

### Implementation for User Story 3

- [X] T014 [US3] Verify created_at auto-populates on Conversation creation in Python REPL test
- [X] T015 [US3] Verify created_at auto-populates on Message creation in Python REPL test
- [X] T016 [US3] Test sorting conversations by updated_at DESC to get most recent conversations
- [X] T017 [US3] Document updated_at update strategy (application-layer, not DB trigger) in backend/src/models/README.md

**Checkpoint**: All user stories complete - lifecycle tracking works as designed ✅

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation

- [X] T018 [P] Update backend/src/models/README.md with comprehensive model documentation
- [X] T019 [P] Add inline code comments to conversation.py and message.py for field explanations
- [X] T020 Run full database schema validation to confirm all indexes and constraints exist
- [X] T021 Create example usage script in backend/scripts/test_models.py demonstrating CRUD operations
- [X] T022 Run quickstart.md validation steps to ensure all documented procedures work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion - REQUIRED for all features
- **User Story 2 (Phase 3)**: Depends on User Story 1 completion (needs models and tables to exist)
- **User Story 3 (Phase 4)**: Depends on User Story 1 completion (needs models and tables to exist)
- **Polish (Phase 5)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - Can start after Setup
- **User Story 2 (P2)**: Requires User Story 1 models to be created
- **User Story 3 (P3)**: Requires User Story 1 models to be created

### Within Each User Story

- **US1**: T004 and T005 can run in parallel → T006 sequential → T007 sequential → T008 review → T009 sequential → T010 verification
- **US2**: All tasks sequential (each test depends on previous validation)
- **US3**: All tasks sequential (each test depends on previous validation)

### Parallel Opportunities

- **Setup**: T001, T002, T003 can all verify in parallel (if running multiple shells)
- **US1 Models**: T004 (Conversation model) and T005 (Message model) can be created in parallel
- **Polish**: T018 and T019 can run in parallel (different documentation tasks)

---

## Parallel Example: User Story 1

```bash
# Step 1: Create both model files in parallel
Task T004: Create backend/src/models/conversation.py
Task T005: Create backend/src/models/message.py

# Step 2: Sequential tasks
Task T006: Update backend/src/models/__init__.py
Task T007: Generate migration
Task T008: Review migration
Task T009: Run migration
Task T010: Verify tables
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup verification
2. Complete Phase 2: User Story 1 (models + migration)
3. **STOP and VALIDATE**: Test conversation and message creation in Python REPL
4. Verify persistence, user_id scoping, chronological ordering

### Incremental Delivery

1. Complete Setup → Foundation ready
2. Add User Story 1 → Test independently → Models working ✅
3. Add User Story 2 → Test independently → Constraints validated ✅
4. Add User Story 3 → Test independently → Lifecycle tracking confirmed ✅
5. Each story adds validation without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together
2. Once Setup done:
   - Developer A: User Story 1 (models + migration)
   - Developer B: Can prepare User Story 2 tests (wait for US1)
   - Developer C: Can prepare User Story 3 tests (wait for US1)
3. After US1 complete, US2 and US3 can validate in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No tests explicitly requested in spec - focus on model implementation and manual validation
- Future features will add API endpoints, user_id validation middleware, and automated tests
- Commit after completing each user story phase
- Stop at any checkpoint to validate story independently
- Avoid: modifying unrelated code, changing Phase II models, adding features not in spec

---

## Task Summary

**Total Tasks**: 22
- Setup: 3 tasks
- User Story 1 (P1): 7 tasks
- User Story 2 (P2): 3 tasks
- User Story 3 (P3): 4 tasks
- Polish: 5 tasks

**Parallel Opportunities**: 4 tasks can run in parallel
- T004, T005 (model creation)
- T018, T019 (documentation)

**Estimated Completion**:
- MVP (US1 only): ~7 tasks
- Full Feature (all stories): 22 tasks

**Critical Path**: Setup → US1 → (US2 + US3 can run in parallel after US1) → Polish
