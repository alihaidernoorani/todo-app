# Feature Specification: In-Memory Python Console Todo App

**Feature Branch**: `001-in-memory-todo-cli`
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Phase I: In-Memory Python Console Todo App. Required Features: Add, View, Update, Delete, Mark Complete. Constraints: Python 3.13+, UV, In-memory, Stdlib only."

## Clarifications

### Session 2026-01-01
- Q: ID Lifecycle and Strategy → A: Strictly monotonic (never reuse deleted IDs).
- Q: Input Loop and Persistence → A: Persistent interactive loop (`todo> ` prompt).
- Q: Output Formatting and Table Look → A: Tabular view (aligned columns using f-string padding).
- Q: Update Logic - Partial vs Full Overwrite → A: Update title only.
- Q: Empty Repository View Message → A: "No tasks found. Use 'add' to create one."
- Q: Task Completion Behavior → A: Complete command is idempotent - always sets task to completed state regardless of current state.
- Q: Should 'complete' command be idempotent? → A: Yes, the complete command should always set task to completed state regardless of current state.
- Q: What feedback should be shown after actions? → A: Show concise success message only (e.g., "Task added: ID=1, Title="Title", Status=Incomplete"), do not auto-refresh the task list after actions.
- Q: Should a help command be implemented? → A: Yes, implement a help command showing available commands and usage.
- Q: Command format style? → A: Support both inline (e.g., `add "Buy milk"`) and interactive (e.g., `add` then prompt for title) styles.
- Q: Should error messages include usage hints? → A: Yes, error messages should include usage hints and examples to help users correct mistakes.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and View Tasks (Priority: P1)

As a user, I want to add tasks and see them in a list so that I can keep track of my work.

**Why this priority**: Essential functionality for any todo application. Without adding and viewing, the application has no purpose.

**Independent Test**: Add 3 tasks and verify they appear in the list with correct IDs and titles.

**Acceptance Scenarios**:

1. **Given** the app is started, **When** I add a task with title "Buy milk", **Then** I should see a confirmation and the task list should contain "Buy milk" with status "incomplete" and a unique ID.
2. **Given** multiple tasks exist, **When** I view the task list, **Then** I should see a formatted table or list containing all tasks with their IDs, titles, and completion status.

---

### User Story 2 - Task Completion (Priority: P1)

As a user, I want to mark tasks as complete so that I can distinguish between what is done and what is pending.

**Why this priority**: Core value proposition of a todo list - knowing what is finished.

**Independent Test**: Create a task, mark it complete by ID, and verify its status changed to "complete" in the view.

**Acceptance Scenarios**:

1. **Given** an incomplete task with ID 1 exists, **When** I mark task 1 as complete, **Then** its status should change to "complete".
2. **Given** a complete task with ID 2 exists, **When** I mark it complete again, **Then** its status should remain "complete" (idempotent behavior).

---

### User Story 3 - Management: Update and Delete (Priority: P2)

As a user, I want to edit task titles or delete tasks so that I can correct mistakes or remove irrelevant items.

**Why this priority**: Necessary for maintaining the list over time, though not strictly required for a minimal viable add/view flow.

**Independent Test**: Update a task's title and verify the change; Delete a task and verify it is removed from the list.

**Acceptance Scenarios**:

1. **Given** task 1 exists with title "Buy milks", **When** I update task 1 to "Buy milk", **Then** the list should show the updated title.
2. **Given** task 2 exists, **When** I delete task 2, **Then** it should no longer appear in the list.

---

## Edge Cases

- **Invalid ID**: What happens when a user tries to update, delete, or complete a non-existent ID? -> System MUST show a human-readable error message.
- **Empty Title**: How does system handle adding a task with no title? -> System SHOULD reject empty or whitespace-only titles.
- **Non-Numeric Input**: How does system handle non-numeric input for ID-based commands? -> System MUST handle formatting errors gracefully and prompt again.
- **Large List**: If many tasks are added, the view remains readable (e.g., sequential list).
- **Empty State**: Explicitly define the message shown when 'View' is called on an empty list: "No tasks found. Use 'add' to create one."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow adding a task with a title string.
- **FR-002**: System MUST assign a unique, sequential integer ID to each new task starting from 1. IDs MUST be strictly monotonically increasing and MUST NOT be reused after deletion.
- **FR-003**: System MUST list all tasks in a formatted tabular view with aligned columns (ID, Title, Status).
- **FR-004**: System MUST allow updating a task's title by providing its ID and the new title string. This MUST NOT change its completion status.
- **FR-005**: System MUST allow deleting a task by its ID.
- **FR-006**: System MUST allow marking a task's completion status by its ID. The complete command MUST be idempotent - calling it multiple times on the same task should always result in the task being marked as complete.
- **FR-008**: System MUST provide a persistent interactive prompt (e.g., `todo> `) until an exit command is issued.
- **FR-009**: System MUST support specific exit commands (e.g., `exit`, `quit`) to terminate the session gracefully.
- **FR-010**: System MUST handle `Ctrl+C` (KeyboardInterrupt) by exiting gracefully without displaying a traceback.

### Key Entities

- **Task**: Represents a single item in the todo list.
  - `id`: Unique integer.
  - `title`: String description.
  - `is_completed`: Boolean flag (defaults to False).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add, view, and complete a task in under 30 seconds of interaction.
- **SC-002**: 100% of task additions, updates, and deletions are accurately reflected in the immediate next "View Tasks" call.
- **SC-003**: System handles invalid IDs and non-numeric input without crashing or losing data in 100% of cases.
- **SC-004**: UI provides clear feedback for every action (success or error).
