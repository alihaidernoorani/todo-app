# MCP Task Management Tools

Stateless MCP (Model Context Protocol) server exposing task management operations for AI agents.

## Overview

This MCP server provides five tools that enable AI agents to perform CRUD operations on tasks:

- **add_task**: Create a new task
- **list_tasks**: Retrieve tasks with optional status filtering
- **complete_task**: Mark a task as completed
- **update_task**: Modify task title or description
- **delete_task**: Remove a task

All operations are stateless and enforce strict user_id scoping for data isolation.

## Prerequisites

- Python 3.13+
- uv package manager
- Backend FastAPI server running (default: http://localhost:8000)
- PostgreSQL database with task schema

## Installation

```bash
# Navigate to backend directory
cd Phase_III/backend

# Install dependencies using uv
uv sync

# Or if using pip
pip install -e .
```

## Configuration

Environment variables (add to `.env` file):

```bash
# Backend API URL
BACKEND_URL=http://localhost:8000

# Request timeout in seconds
REQUEST_TIMEOUT=30

# Optional: Enable debug logging
MCP_DEBUG=false
```

## Running the MCP Server

```bash
# From backend directory
cd Phase_III/backend

# Run MCP server
uv run python -m src.mcp.server

# Or with direct Python
python -m src.mcp.server
```

The MCP server will start and register all available tools.

## Tool Usage

### add_task

Create a new task for a user.

**Parameters:**
- `user_id` (string, required): User identifier
- `title` (string, required, max 255 chars): Task title
- `description` (string, optional, max 2000 chars): Task description

**Response:**
```json
{
  "task_id": "uuid",
  "title": "string",
  "status": "pending",
  "created_at": "2026-02-09T10:30:00Z"
}
```

### list_tasks

Retrieve all tasks for a user with optional filtering.

**Parameters:**
- `user_id` (string, required): User identifier
- `status` (string, optional): Filter by status ("all", "pending", "completed")

**Response:**
```json
{
  "tasks": [
    {
      "task_id": "uuid",
      "title": "string",
      "description": "string | null",
      "status": "pending" | "completed",
      "priority": "High" | "Medium" | "Low",
      "created_at": "2026-02-09T10:30:00Z"
    }
  ]
}
```

### complete_task

Mark a task as completed.

**Parameters:**
- `user_id` (string, required): User identifier
- `task_id` (UUID, required): Task to complete

**Response:**
```json
{
  "task_id": "uuid",
  "title": "string",
  "status": "completed"
}
```

### update_task

Update task title and/or description.

**Parameters:**
- `user_id` (string, required): User identifier
- `task_id` (UUID, required): Task to update
- `title` (string, optional): New title
- `description` (string, optional): New description

**Response:**
```json
{
  "task_id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "pending" | "completed"
}
```

### delete_task

Remove a task.

**Parameters:**
- `user_id` (string, required): User identifier
- `task_id` (UUID, required): Task to delete

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Architecture

### Stateless Design

The MCP server maintains **zero in-memory state**:
- No task caching
- No user session storage
- No conversation history

All data operations are delegated to the backend FastAPI REST API, which persists to PostgreSQL.

### User Isolation

Every tool enforces user_id scoping:
1. Tool receives user_id as required parameter
2. Backend API validates user_id against authenticated session
3. Database queries filter by user_id column
4. Cross-user data access is impossible

### Backend Integration

MCP tools communicate with the backend via REST API:
- `POST /api/{user_id}/tasks` - Create task
- `GET /api/{user_id}/tasks` - List tasks
- `PATCH /api/{user_id}/tasks/{id}/complete` - Complete task
- `PUT /api/{user_id}/tasks/{id}` - Update task
- `DELETE /api/{user_id}/tasks/{id}` - Delete task

## Testing

```bash
# Run all MCP tests
pytest tests/mcp/

# Run specific verification script
python tests/mcp/verify_add_task.py

# Run stateless validation
pytest tests/mcp/test_stateless.py
```

## Troubleshooting

### Backend Connection Errors

**Symptom**: Tools fail with "Connection refused" or timeout errors

**Solution**: Verify backend is running:
```bash
cd Phase_III/backend
uvicorn src.main:app --reload --port 8000
```

### Authorization Errors

**Symptom**: Tools return 403 Forbidden

**Solution**: Ensure user_id in tool invocation matches authenticated session

### Invalid UUIDs

**Symptom**: Tools fail with "Invalid UUID format"

**Solution**: Verify task_id parameters are valid UUIDs (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)

### MCP Server Won't Start

**Symptom**: Import errors or dependency issues

**Solution**: Reinstall dependencies:
```bash
uv sync
# or
pip install -e .
```

## Development

### Adding New Tools

1. Create tool file in `src/mcp/tools/`
2. Define tool schema in `src/mcp/schemas/`
3. Register tool in `src/mcp/server.py`
4. Add tests in `tests/mcp/`

### Code Style

Follow project standards:
- Type hints on all functions
- Docstrings for public APIs
- Ruff for linting
- mypy for type checking

```bash
# Run linters
ruff check src/mcp/
mypy src/mcp/
```

## License

MIT License - See project root LICENSE file
