---
id: 0004
title: Generate In-Memory Todo CLI Tasks
stage: tasks
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-in-memory-todo-cli
branch: 001-in-memory-todo-cli
user: DELL
command: /sp.tasks
labels: ["tasks", "todo-cli", "phase1", "sdd"]
links:
  spec: specs/001-in-memory-todo-cli/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-in-memory-todo-cli/tasks.md
tests:
 - none
---

## Prompt

Create tasks for Phase I: In-Memory Python Console Todo App.

### Core Task Modules

1. **Task Model**
   - Define `Task` class/dataclass with:
     - `id` (unique integer, sequential)
     - `title` (non-empty string)
     - `is_completed` (boolean, default False)
   - Ensure proper validation for all fields.

2. **Task Registry / Manager**
   - Create in-memory storage for tasks.
   - Implement functions:
     - Add task (assign next sequential ID)
     - View tasks (ordered by ID)
     - Update task title by ID (reject empty/whitespace-only)
     - Delete task by ID
     - Toggle task completion by ID
   - Include error handling for invalid IDs or input types.

3. **Console Interface**
   - Implement user input handling for all features:
     - Add, View, Update, Delete, Mark Complete
   - Display tasks in readable list/table format.
   - Provide clear success/error messages.
   - Loop until user chooses to exit.

4. **Edge Cases & Validation**
   - Handle:
     - Non-numeric input for IDs
     - Empty or whitespace-only task titles
     - Completing/deleting/updating non-existent IDs
     - Viewing tasks when list is empty

5. **Testing & Validation**
   - Verify all user stories:
     - Add → task appears in list
     - View → shows all tasks correctly
     - Update → title changes correctly
     - Delete → task removed
     - Mark Complete → status toggled
   - Confirm behavior for all edge cases.

### Task Execution Order

1. Define Task model
2. Implement Task Manager with all CRUD + toggle functions
3. Build Console Interface
4. Add input validation & error handling
5. Test all features with defined user scenarios and edge cases
6. Refine based on spec until Claude Code output matches requirements

### Notes for Claude Code

- All code must be **generated from spec** (no manual edits)
- Maintain **modularity** (Task model, logic, UI separate)
- Ensure **in-memory only**, console-based, and standard library only
- Document each module/function briefly for clarity

## Response snapshot

I've generated the task list for the In-Memory Todo CLI in `specs/001-in-memory-todo-cli/tasks.md`. The tasks are organized by User Story (US1: Add/View, US2: Completion, US3: Management) to ensure incremental delivery of the MVP. All tasks follow the strict `[ID] [P?] [Story] Description` format and include specific file paths.

## Outcome

- ✅ Impact: High - Provided actionable work items for the implementation phase.
- 🧪 Tests: n/a
- 📁 Files: Created tasks.md.
- 🔁 Next prompts: Use /sp.implement to begin coding.
- 🧠 Reflection: Organizing tasks by user story ensures that each milestone is independently testable.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): n/a
