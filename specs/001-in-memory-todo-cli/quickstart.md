# Quickstart Guide: In-Memory Todo CLI

## Setup

1. **Prerequisites**: Python 3.13+ and UV package manager
2. **Create and activate virtual environment**:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. **Install dependencies**:
   ```bash
   uv sync
   ```
4. **Install the CLI**:
   ```bash
   uv build
   uv pip install .
   # Or run directly with:
   uv run src/cli.py
   ```

## Usage

### Running the Application
```bash
# Direct execution
python -m src.cli

# Or via UV
uv run src/cli.py

# If installed as package
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

pyproject.toml           # UV configuration and CLI entry point definition
```

## Testing
Run all tests:
```bash
uv run pytest
```

Run specific test:
```bash
uv run pytest tests/unit/test_models.py
```

Run with coverage:
```bash
uv run pytest --cov=src
```

## Architecture Notes
- **Domain Logic**: Handled by the TodoService in `todo_service.py`
- **Presentation Logic**: Handled by the CLI in `cli.py`
- **Clear Separation**: Business logic is independent of UI concerns
- **Evolution Ready**: Design supports transition to FastAPI + SQLModel in Phase II