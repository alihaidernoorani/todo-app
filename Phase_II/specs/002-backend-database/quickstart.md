# Quickstart: Backend and Database for Phase 2

**Feature Branch**: `002-backend-database`
**Date**: 2026-01-24

## Prerequisites

- Python 3.13+
- uv (Python package manager)
- Neon PostgreSQL account with database created
- Git

## Project Setup

### 1. Navigate to Backend Directory

```bash
cd /backend
```

### 2. Initialize Python Project

```bash
# Initialize with uv
uv init

# Add dependencies
uv add fastapi sqlmodel psycopg[binary] uvicorn python-dotenv alembic

# Add dev dependencies
uv add --dev pytest pytest-asyncio httpx ruff mypy
```

### 3. Configure Environment

Create `.env` file in `/backend/`:

```env
# Database
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

**Important**: Add `.env` to `.gitignore`!

### 4. Initialize Database

```bash
# Initialize Alembic
alembic init alembic

# Generate migration from models
alembic revision --autogenerate -m "create tasks table"

# Apply migration
alembic upgrade head
```

## Running the Server

### Development Mode

```bash
# Using uvicorn directly
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Or using uv
uv run uvicorn src.main:app --reload
```

### Verify Server Running

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

## Quick API Test

All endpoints use path-based user context: `/api/{user_id}/tasks`

### Create a Task

```bash
curl -X POST http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My first task", "description": "Test description"}'
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

### View Swagger UI

Open http://localhost:8000/docs in your browser.

## Running Tests

```bash
# Run all tests
uv run pytest

# Run with verbose output
uv run pytest -v

# Run specific test file
uv run pytest tests/integration/test_task_api.py

# Run with coverage
uv run pytest --cov=src
```

## Project Structure (Current)

```
/backend/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── database.py          # Database session management
│   ├── models/
│   │   ├── __init__.py
│   │   └── task.py          # Task SQLModel
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── task.py          # Request/Response Pydantic schemas
│   ├── services/
│   │   ├── __init__.py
│   │   └── task_service.py  # Business logic
│   └── api/
│       ├── __init__.py
│       ├── deps.py          # Dependency injection
│       └── v1/
│           ├── __init__.py
│           ├── router.py    # API router aggregator
│           └── tasks.py     # Task endpoints
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   ├── contract/
│   │   └── test_task_contract.py
│   ├── integration/
│   │   └── test_task_api.py
│   └── unit/
│       └── test_task_service.py
├── alembic/
│   ├── versions/
│   └── env.py
├── alembic.ini
├── pyproject.toml
├── .env
└── .env.example
```

## Common Commands

| Command | Description |
|---------|-------------|
| `uv run uvicorn src.main:app --reload` | Start dev server |
| `uv run pytest` | Run tests |
| `uv run ruff check .` | Run linter |
| `uv run ruff format .` | Format code |
| `uv run mypy src` | Type checking |
| `alembic upgrade head` | Apply all migrations |
| `alembic downgrade -1` | Rollback last migration |
| `alembic revision --autogenerate -m "msg"` | Generate migration |

## Troubleshooting

### Database Connection Failed

1. Verify `NEON_DATABASE_URL` is correct in `.env`
2. Check Neon dashboard for connection string
3. Ensure `?sslmode=require` is included

### Import Errors

1. Ensure you're in the correct directory
2. Run `uv sync` to install dependencies
3. Check `pyproject.toml` has all required packages

### Tests Failing

1. Ensure test database is configured
2. Run migrations: `alembic upgrade head`
3. Check fixtures in `conftest.py`

## API Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/{user_id}/tasks` | List all tasks for user |
| POST | `/api/{user_id}/tasks` | Create a new task |
| GET | `/api/{user_id}/tasks/{id}` | Get single task |
| PUT | `/api/{user_id}/tasks/{id}` | Full update of task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle completion |

## Next Steps

After completing this feature:

1. Verify all 50 tests pass: `uv run pytest -v`
2. Review API at http://localhost:8000/docs
3. Proceed to authentication feature (Spec-2)
