---
id: 0001
title: Specify In-Memory Todo CLI Features
stage: spec
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-in-memory-todo-cli
branch: 001-in-memory-todo-cli
user: DELL
command: /sp.specify
labels: ["spec", "todo-cli", "phase1", "sdd"]
links:
  spec: specs/001-in-memory-todo-cli/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-in-memory-todo-cli/spec.md
 - specs/001-in-memory-todo-cli/checklists/requirements.md
tests:
 - none
---

## Prompt

# Phase I: In-Memory Python Console Todo App

---

## Objective

Build a command-line Todo application in Python that stores tasks **in memory** and implements all **Basic Level features**

---

## Required Features

The application must support:

1. **Add Task** – Create a new in-memory task (initially incomplete)
2. **View Tasks** – List all tasks with ID, title, and completion status
3. **Update Task** – Edit task title by ID
4. **Delete Task** – Remove task by ID
5. **Mark Complete** – Toggle task completion status by ID

---

## Success Criteria

- All five features work correctly in memory
- All actions are performed via console input/output
- Invalid input is handled gracefully
- Behavior matches this specification exactly
- No manual code edits were made

---

## Constraints

- **Language:** Python 3.13+
- **Environment:** UV
- **Storage:** In-memory only
- **Interface:** Console (stdin/stdout)
- **Dependencies:** Standard library only

---

## Structure Expectations

- Separation of:
  - Task model
  - Task management logic
  - Console interaction
- Clean, readable, modular code

---

## Out of Scope

- File or database persistence
- Web or GUI interfaces
- APIs or networking
- AI or chatbot features
- Authentication

## Response snapshot

I've specified the features for the In-Memory Todo CLI in `specs/001-in-memory-todo-cli/spec.md`. The spec covers User Stories for Add/View, Completion, and Update/Delete, along with functional requirements and success criteria.

## Outcome

- ✅ Impact: High - Defined functional scope for the initial application.
- 🧪 Tests: n/a
- 📁 Files: Created spec.md and requirements checklist.
- 🔁 Next prompts: Use /sp.plan to design the architecture.
- 🧠 Reflection: The prompt was comprehensive, allowing for a detailed spec with minimal clarification needs.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): n/a
