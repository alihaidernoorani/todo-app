# Task List: In-Memory Todo CLI

**Feature**: 001-in-memory-todo-cli
**Generated from**: specs/001-in-memory-todo-cli/spec.md and specs/001-in-memory-todo-cli/plan.md
**Date**: 2026-01-02
**Status**: Phase I Implementation

## Phase 1: Setup

### Setup Tasks
- [X] T001 Create project structure with src/ containing models/, services/, and cli.py
- [X] T002 Create tests/ directory structure with unit/ and integration/ subdirectories
- [X] T003 [P] Create pyproject.toml with CLI entry point configuration
- [X] T004 [P] Create README.md with project description and usage examples

## Phase 2: Foundational Components

### Core Domain Implementation
- [X] T005 Create Task dataclass in src/models/task.py with id, title, and is_completed attributes
- [X] T006 Create TodoService class in src/services/todo_service.py with in-memory storage
- [X] T007 [P] Implement add_task method with unique ID assignment and title validation
- [X] T008 [P] Implement list_tasks method to return all tasks sorted by ID
- [X] T009 [P] Implement get_task method to retrieve task by ID with error handling
- [X] T010 [P] Implement update_task method to modify task title while preserving completion status
- [X] T011 [P] Implement complete_task method with idempotent behavior (always sets to complete)
- [X] T012 [P] Implement delete_task method to remove task by ID with strictly monotonic IDs

## Phase 3: [US1] Create and View Tasks (P1)

### User Story 1 Implementation
- [X] T013 [P] [US1] Create CLI interface in src/cli.py with persistent interactive loop and `todo> ` prompt
- [X] T014 [P] [US1] Implement add command with both inline and interactive styles in CLI
- [X] T015 [P] [US1] Implement view command to display tasks in tabular format with ID, Title, Status columns
- [X] T016 [US1] Implement concise confirmation messages after add action (e.g., "Task added: ID=1, Title="Title", Status=Incomplete")
- [X] T017 [US1] Implement empty-state message: "No tasks found. Use 'add' to create one."
- [X] T018 [US1] Verify no auto-refresh of task list after mutations (add command)
- [X] T019 [US1] Test that adding a task with title "Buy milk" creates task with unique ID and shows confirmation
- [X] T020 [US1] Test that viewing multiple tasks shows all tasks with their IDs, titles, and completion status

## Phase 4: [US2] Task Completion (P1)

### User Story 2 Implementation
- [X] T021 [P] [US2] Implement complete command with idempotent behavior in CLI
- [X] T022 [US2] Implement concise confirmation messages after complete action (e.g., "Task 1 marked as complete")
- [X] T023 [US2] Verify no auto-refresh of task list after complete action
- [X] T024 [US2] Test that marking an incomplete task as complete changes its status to complete
- [X] T025 [US2] Test that marking a complete task again keeps it complete (idempotent behavior)

## Phase 5: [US3] Management: Update and Delete (P2)

### User Story 3 Implementation
- [X] T026 [P] [US3] Implement update command with both inline and interactive styles in CLI
- [X] T027 [P] [US3] Implement delete command in CLI
- [X] T028 [US3] Implement concise confirmation messages after update action (e.g., "Task updated: ID=1, Title="New Title", Status=Incomplete")
- [X] T029 [US3] Implement concise confirmation messages after delete action (e.g., "Task 1 deleted")
- [X] T030 [US3] Verify no auto-refresh of task list after update action
- [X] T031 [US3] Verify no auto-refresh of task list after delete action
- [X] T032 [US3] Test that updating a task's title preserves its completion status
- [X] T033 [US3] Test that deleting a task removes it from the list

## Phase 6: UX Enhancement

### Help and Error Handling
- [X] T034 [P] Implement help command showing available commands and usage examples
- [X] T035 [P] Implement error messages with usage hints for invalid ID operations
- [X] T036 [P] Implement error messages with usage hints for empty/whitespace-only titles
- [X] T037 [P] Implement error messages with usage hints for non-numeric input
- [X] T038 [P] Implement error messages with usage hints for unknown commands
- [ ] T039 [P] Test that help command displays all available commands with usage examples
- [ ] T040 [P] Test that error messages include helpful usage hints to guide users

## Phase 7: Verification and Polish

### Cross-cutting Verification Tasks
- [X] T041 [P] Verify FR-001: System allows adding a task with a title string with proper confirmation
- [X] T042 [P] Verify FR-002: System assigns unique, sequential integer IDs with strictly monotonic behavior
- [X] T043 [P] Verify FR-003: System lists tasks in formatted tabular view with aligned columns
- [X] T044 [P] Verify FR-004: System allows updating task title by ID without changing completion status
- [X] T045 [P] Verify FR-005: System allows deleting a task by its ID
- [X] T046 [P] Verify FR-006: System allows marking task completion status by ID with idempotent behavior
- [X] T047 [P] Verify FR-008: System provides persistent interactive prompt until exit command
- [X] T048 [P] Verify FR-009: System supports exit and quit commands for graceful session termination
- [X] T049 [P] Verify FR-010: System handles Ctrl+C gracefully without traceback
- [X] T050 [P] Verify UX requirements: Both inline and interactive command styles supported
- [X] T051 [P] Verify UX requirements: Help command implemented with usage examples
- [X] T052 [P] Verify UX requirements: Error messages include usage hints
- [X] T053 [P] Verify UX requirements: Concise confirmation messages after actions
- [X] T054 [P] Verify UX requirements: No auto-refresh after mutations
- [ ] T055 [P] Test that all success criteria (SC-001 through SC-004) are met

## Dependencies

### User Story Completion Order
1. **Phase 1-2**: Project setup and foundational components (prerequisites for all stories)
2. **Phase 3**: [US1] Create and View Tasks (P1) - Foundation for all other operations
3. **Phase 4**: [US2] Task Completion (P1) - Depends on US1
4. **Phase 5**: [US3] Management: Update and Delete (P2) - Depends on US1
5. **Phase 6**: UX Enhancement - Can run in parallel with user story implementations
6. **Phase 7**: Verification and Polish - Runs after all functionality is implemented

### Parallel Execution Examples
- **Within US1**: T013-T016 can be implemented in parallel (CLI interface, add command, view command, confirmation messages)
- **Within US2**: T021 can be implemented once service is ready
- **Within US3**: T026-T027 can be implemented in parallel (update and delete commands)
- **Verification**: T034-T040 can be implemented in parallel with other phases

## Implementation Strategy

### MVP Scope (Minimum Viable Product)
- Phases 1-3: Project setup, core domain, and basic add/view functionality with proper UX
- Core functionality: Add tasks (both styles) and view them in tabular format with confirmation messages
- Basic CLI loop with persistent `todo> ` prompt and proper error handling

### Incremental Delivery
1. **MVP**: Task creation and viewing with UX requirements (US1)
2. **Add Completion**: Task completion functionality with UX requirements (US2)
3. **Add Management**: Update and delete functionality with UX requirements (US3)
4. **Add UX**: Help command and enhanced error messages
5. **Add Verification**: Complete testing and validation

## Functional Requirement Mapping

### FR-001: System MUST allow adding a task with a title string
- Mapped to: T007 (add_task method), T014 (add command), T041 (verification)

### FR-002: System MUST assign unique, sequential integer ID (strictly monotonic, no reuse)
- Mapped to: T012 (delete_task with monotonic IDs), T042 (verification)

### FR-003: System MUST list tasks in tabular view with aligned columns
- Mapped to: T015 (view command), T043 (verification)

### FR-004: System MUST allow updating task title by ID (no completion status change)
- Mapped to: T010 (update_task method), T026 (update command), T044 (verification)

### FR-005: System MUST allow deleting task by ID
- Mapped to: T011 (delete_task method), T027 (delete command), T045 (verification)

### FR-006: System MUST allow marking completion status with idempotent behavior
- Mapped to: T011 (complete_task method), T021 (complete command), T046 (verification)

### FR-008: System MUST provide persistent interactive prompt
- Mapped to: T013 (CLI interface), T047 (verification)

### FR-009: System MUST support exit commands (exit, quit)
- Mapped to: T048 (verification)

### FR-010: System MUST handle Ctrl+C gracefully
- Mapped to: T049 (verification)

## UX Requirement Coverage

### Both Command Styles (Inline and Interactive)
- Mapped to: T014 (add command), T026 (update command), T050 (verification)

### Help Command Implementation
- Mapped to: T034 (help command), T039 (help testing), T051 (verification)

### Error Messages with Usage Hints
- Mapped to: T035-T038 (error handling), T040 (error testing), T052 (verification)

### Concise Confirmation Messages
- Mapped to: T016, T022, T028, T029 (confirmation messages), T053 (verification)

### No Auto-Refresh After Mutations
- Mapped to: T018, T023, T030, T031 (no auto-refresh), T054 (verification)