# Task Backend API

Backend API for Phase 2 Todo Application with PostgreSQL database.

## Features

- Full CRUD operations for Task items
- Path-based user context via `{user_id}` URL parameter
- User-scoped data isolation (users can only access their own tasks)
- PostgreSQL database with Alembic migrations
- RESTful API with FastAPI

## Quick Start

1. Copy `.env.example` to `.env` and configure `NEON_DATABASE_URL`
2. Install dependencies: `uv pip install -e ".[dev]"`
3. Run migrations: `alembic upgrade head`
4. Start server: `uvicorn src.main:app --reload`
5. View API docs: http://localhost:8000/docs

## API Endpoints

All task endpoints use path-based user context: `/api/{user_id}/tasks`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/{user_id}/tasks` | List all tasks for user |
| POST | `/api/{user_id}/tasks` | Create a new task |
| GET | `/api/{user_id}/tasks/{id}` | Get single task |
| PUT | `/api/{user_id}/tasks/{id}` | Full update of task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle completion |

## Usage Examples

### Create a Task

```bash
curl -X POST http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

### List Tasks

```bash
curl http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks
```

### Get Single Task

```bash
curl http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/{task_id}
```

### Update Task (Full Replace)

```bash
curl -X PUT http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/{task_id} \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "description": "Updated description", "is_completed": true}'
```

### Toggle Completion

```bash
curl -X PATCH http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/{task_id}/complete
```

### Delete Task

```bash
curl -X DELETE http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/{task_id}
```

## Testing

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test types
pytest tests/unit/
pytest tests/integration/
pytest tests/contract/
```

## Project Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # Database session management
│   ├── models/task.py       # Task SQLModel
│   ├── schemas/task.py      # Request/Response schemas
│   ├── services/task_service.py  # Business logic
│   └── api/v1/tasks.py      # Task endpoints
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── contract/            # Contract tests
├── alembic/                 # Database migrations
├── pyproject.toml
└── .env.example
```
