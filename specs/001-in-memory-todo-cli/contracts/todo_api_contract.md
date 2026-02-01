# API Contract: Todo CLI Operations

## Overview
This document defines the contract for the todo CLI operations, including function signatures, input/output specifications, and error handling, with updated UX requirements from clarifications.

## Operations

### Add Task
**Function**: `add_task(title: str) -> Task`
**Description**: Creates a new task with a unique ID
**Input**:
- title: String, must not be empty or whitespace-only
**Output**:
- Task object with assigned ID and initial status of incomplete
**Errors**:
- ValueError: If title is empty or contains only whitespace
- Returns human-readable error message with usage hint

### List Tasks
**Function**: `list_tasks() -> List[Task]`
**Description**: Returns all tasks in the store
**Input**: None
**Output**:
- List of Task objects sorted by ID
**Errors**: None

### Update Task
**Function**: `update_task(task_id: int, title: str) -> Task`
**Description**: Updates the title of an existing task
**Input**:
- task_id: Integer, must exist in the store
- title: String, must not be empty or whitespace-only
**Output**:
- Updated Task object with same completion status
**Errors**:
- KeyError: If task_id does not exist
- ValueError: If title is empty or contains only whitespace
- Returns human-readable error message with usage hint

### Complete Task
**Function**: `complete_task(task_id: int) -> Task`
**Description**: Marks a task as complete (idempotent operation)
**Input**:
- task_id: Integer, must exist in the store
**Output**:
- Task object with is_completed set to True (regardless of previous state)
**Errors**:
- KeyError: If task_id does not exist
- Returns human-readable error message with usage hint

### Delete Task
**Function**: `delete_task(task_id: int) -> bool`
**Description**: Removes a task from the store
**Input**:
- task_id: Integer, must exist in the store
**Output**:
- Boolean indicating success (True) or failure (False)
**Errors**: None (returns False if task doesn't exist)

## CLI Commands Interface

### Add Command
**Syntax**: `add "task title"` (inline) or `add` then enter title (interactive)
**Example**: `add "Buy groceries"`
**Output**: `Task added: ID=1, Title="Buy groceries", Status=Incomplete`

### View Command
**Syntax**: `view`
**Example**: `view`
**Output**: Tabular format showing ID, Title, and Status columns

### Update Command
**Syntax**: `update <id> "new title"` (inline) or `update <id>` then enter title (interactive)
**Example**: `update 1 "Buy food"`
**Output**: `Task updated: ID=1, Title="Buy food", Status=Incomplete`

### Complete Command
**Syntax**: `complete <id>`
**Example**: `complete 1`
**Output**: `Task 1 marked as complete`
**Note**: This operation is idempotent - calling it multiple times on the same task will always result in the task being marked as complete

### Delete Command
**Syntax**: `delete <id>`
**Example**: `delete 1`
**Output**: `Task 1 deleted`

### Help Command
**Syntax**: `help`
**Example**: `help`
**Output**: List of available commands with usage examples

### Exit Command
**Syntax**: `exit` or `quit`
**Example**: `exit`
**Output**: `Goodbye!`

## Error Handling Contract

All error conditions must result in human-readable error messages with usage hints that help the user understand what went wrong and how to fix it.

**Invalid ID Error**: "Task with ID {id} does not exist. Use 'view' to see available tasks."
**Empty Title Error**: "Task title cannot be empty or contain only whitespace. Usage: add \"task title\""
**Non-numeric Input Error**: "Please provide a valid task ID as a number. Usage: complete 1"
**Unknown Command Error**: "Unknown command: {command}. Type 'help' for available commands."

## UX Requirements Contract

### Feedback Strategy
- After successful actions: Show concise confirmation message (e.g., "Task added: ID=1, Title="Title", Status=Incomplete")
- No auto-refresh of task list after mutations
- Error messages include usage hints and examples

### Command Styles
- Support both inline commands (e.g., `add "Buy milk"`) and interactive mode (e.g., `add` then prompt for title)
- Help command available to show all commands and usage examples