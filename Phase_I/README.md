# In-Memory Python Console Todo App

A simple, fast todo application that runs in the console with an interactive prompt.

## Features

- Add, view, update, delete, and mark complete tasks
- Persistent interactive session with `todo> ` prompt
- Tabular display of tasks with ID, Title, and Status
- Idempotent completion (always sets to complete regardless of current state)
- Strictly monotonic ID generation (never reuses deleted IDs)
- Both inline and interactive command styles supported
- Help command with usage examples
- Clear, friendly feedback for every user action

## Setup

1. Ensure you have Python 3.13+ installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   or with uv:
   ```bash
   uv sync
   ```

## Usage

Run the application:
```bash
python -m cli
```

Or via UV:
```bash
uv run cli.py
```

Or if installed as a package:
```bash
todo
```

### Available Commands

- `add "Task title"` - Add a new task (inline style)
- `add` - Add a new task (interactive style - prompts for title)
- `view` - View all tasks in tabular format
- `update <id> "New title"` - Update task title by ID (inline style)
- `update <id>` - Update task title by ID (interactive style - prompts for new title)
- `complete <id>` - Mark task as complete (idempotent - always sets to complete)
- `delete <id>` - Delete task by ID
- `help` - Show available commands and usage examples
- `exit` or `quit` - Exit the application
- `Ctrl+C` - Graceful exit

### Example Session

```
todo> help
Available commands: add, view, update, complete, delete, help, exit, quit
Usage examples:
- add "Buy groceries" (inline) or just 'add' (interactive)
- view
- update 1 "New title" (inline) or 'update 1' (interactive)
- complete 1
- delete 1

todo> add "Buy groceries"
Task added: ID=1, Title="Buy groceries", Status=Incomplete

todo> add "Walk the dog"
Task added: ID=2, Title="Walk the dog", Status=Incomplete

todo> view
ID    Title             Status
--    ---------------   --------
1     Buy groceries     Incomplete
2     Walk the dog      Incomplete

todo> complete 1
Task 1 marked as complete

todo> view
ID    Title             Status
--    ---------------   --------
1     Buy groceries     Complete
2     Walk the dog      Incomplete

todo> exit
Goodbye!
```

## Project Structure

```
src/
├── models/
│   └── task.py          # Task dataclass definition
├── services/
│   └── todo_service.py  # Business logic for todo operations with in-memory storage
└── cli.py               # Main CLI entry point with interactive loop and command processing

tests/
├── unit/
│   ├── test_models.py      # Unit tests for Task model
│   └── test_services.py    # Unit tests for todo service functions
└── integration/
    └── test_cli.py         # Integration tests for CLI functionality
```

## Testing

Run all tests:
```bash
pytest
```

Run specific test:
```bash
pytest tests/unit/test_models.py
```

Run with coverage:
```bash
pytest --cov=src
```