# Data Model: In-Memory Todo CLI

## Entities

### Task (Dataclass)
Represents a single todo item.

| Attribute | Type | Description |
|-----------|------|-------------|
| id | int | Unique sequential identifier (1, 2, 3...) |
| title | str | Description of the task |
| is_completed | bool | Status flag (default: False) |

## State Transitions
1. **Created**: `is_completed = False`.
2. **Completed**: `is_completed = True` (idempotent - always sets to True regardless of current state).
3. **Updated**: `title` changes, `is_completed` remains same.
4. **Deleted**: Task removed from memory store.

## Constraints
- `id` must be > 0.
- `title` must be non-empty and non-whitespace.
- `id` lifecycle is strictly monotonic (no reuse).
- `complete_task` operation is idempotent (always sets `is_completed = True`).

## Storage Model

### Task Store
```python
Dict[int, Task]
```

### Operations
- Add: Insert new task with next available ID
- Get: Retrieve task by ID
- Update: Modify task properties by ID
- Delete: Remove task by ID
- List: Return all tasks
- Complete: Set task completion status to True by ID (idempotent operation)

## Service Interface

### TodoService Operations
- `add_task(title: str) -> Task`: Creates new task with unique ID
- `get_task(task_id: int) -> Task`: Retrieves task by ID
- `list_tasks() -> List[Task]`: Returns all tasks sorted by ID
- `update_task(task_id: int, title: str) -> Task`: Updates task title by ID
- `complete_task(task_id: int) -> Task`: Sets task completion status to True (idempotent)
- `delete_task(task_id: int) -> bool`: Removes task by ID

## CLI Interaction Model

### Command Processing
- **Inline Commands**: Single-line format (e.g., `add "Buy milk"`)
- **Interactive Commands**: Prompt-based format (e.g., `add` then enter title)
- **Help Command**: Displays available commands and usage examples
- **Error Handling**: Human-readable messages with usage hints and examples

### Feedback Strategy
- **Success Messages**: Concise confirmation after actions (e.g., "Task added: ID=1, Title="Title", Status=Incomplete")
- **No Auto-Refresh**: Task list not automatically shown after mutations
- **Error Messages**: Include usage hints to help users correct mistakes