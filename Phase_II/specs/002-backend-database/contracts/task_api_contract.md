# API Contract: Task CRUD Endpoints

**Feature Branch**: `002-backend-database`
**Date**: 2026-01-24
**API Version**: v1
**Base Path**: `/api`
**Revision**: v2.0 - Path-based user context

## Overview

This document defines the REST API contract for Task CRUD operations. User context is provided via path parameter `{user_id}` for explicit resource ownership.

---

## Endpoints Summary

| Method | Path | Description | FR Reference |
|--------|------|-------------|--------------|
| GET | `/api/{user_id}/tasks` | List all tasks for user | FR-009 |
| POST | `/api/{user_id}/tasks` | Create a new task | FR-008 |
| GET | `/api/{user_id}/tasks/{id}` | Retrieve a single task | FR-010 |
| PUT | `/api/{user_id}/tasks/{id}` | Full update of a task | FR-011 |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete a task | FR-012 |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle completion status | FR-011 |

---

## Path Parameters

### `{user_id}`
- **Type**: UUID
- **Required**: Yes
- **Description**: The unique identifier of the user who owns the tasks
- **Validation**: Must be a valid UUID format

### `{id}`
- **Type**: UUID
- **Required**: Yes (for single-resource operations)
- **Description**: The unique identifier of the task
- **Validation**: Must be a valid UUID format

---

## Endpoint: List Tasks

### Request

```
GET /api/{user_id}/tasks
```

### Response

**200 OK**:
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string | null",
      "is_completed": false,
      "created_at": "2026-01-24T10:30:00Z",
      "user_id": "uuid"
    }
  ],
  "count": 1
}
```

**Note**: Returns empty list `{"items": [], "count": 0}` if user has no tasks.

**400 Bad Request** (invalid user_id format):
```json
{
  "detail": "Invalid user ID format",
  "error_code": "VALIDATION_ERROR"
}
```

---

## Endpoint: Create Task

### Request

```
POST /api/{user_id}/tasks
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "string (required, 1-255 chars)",
  "description": "string (optional, max 2000 chars)"
}
```

### Response

**201 Created**:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "is_completed": false,
  "created_at": "2026-01-24T10:30:00Z",
  "user_id": "uuid"
}
```

**400 Bad Request** (invalid user_id):
```json
{
  "detail": "Invalid user ID format",
  "error_code": "VALIDATION_ERROR"
}
```

**422 Unprocessable Entity** (validation failure):
```json
{
  "detail": "Validation error",
  "error_code": "VALIDATION_ERROR",
  "field_errors": [
    {"field": "title", "message": "Field required"}
  ]
}
```

---

## Endpoint: Get Task

### Request

```
GET /api/{user_id}/tasks/{id}
```

### Response

**200 OK**:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "is_completed": false,
  "created_at": "2026-01-24T10:30:00Z",
  "user_id": "uuid"
}
```

**400 Bad Request** (invalid UUID format):
```json
{
  "detail": "Invalid task ID format",
  "error_code": "VALIDATION_ERROR"
}
```

**404 Not Found** (task doesn't exist OR user doesn't own it):
```json
{
  "detail": "Task not found",
  "error_code": "NOT_FOUND"
}
```

**Note**: Returns 404 for both "not exists" and "not owned" to prevent enumeration attacks.

---

## Endpoint: Update Task (Full Replace)

### Request

```
PUT /api/{user_id}/tasks/{id}
Content-Type: application/json
```

**Request Body** (all fields required for PUT):
```json
{
  "title": "string (required, 1-255 chars)",
  "description": "string | null (required, max 2000 chars)",
  "is_completed": "boolean (required)"
}
```

### Response

**200 OK**:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "is_completed": true,
  "created_at": "2026-01-24T10:30:00Z",
  "user_id": "uuid"
}
```

**404 Not Found**:
```json
{
  "detail": "Task not found",
  "error_code": "NOT_FOUND"
}
```

**422 Unprocessable Entity** (validation failure):
```json
{
  "detail": "Validation error",
  "error_code": "VALIDATION_ERROR",
  "field_errors": [
    {"field": "title", "message": "String should have at least 1 character"}
  ]
}
```

---

## Endpoint: Delete Task

### Request

```
DELETE /api/{user_id}/tasks/{id}
```

### Response

**204 No Content**: Successfully deleted (no response body)

**404 Not Found**:
```json
{
  "detail": "Task not found",
  "error_code": "NOT_FOUND"
}
```

---

## Endpoint: Toggle Completion

### Request

```
PATCH /api/{user_id}/tasks/{id}/complete
```

**No request body required** - this endpoint toggles the current `is_completed` value.

### Response

**200 OK**:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "is_completed": true,
  "created_at": "2026-01-24T10:30:00Z",
  "user_id": "uuid"
}
```

**404 Not Found**:
```json
{
  "detail": "Task not found",
  "error_code": "NOT_FOUND"
}
```

---

## Error Response Schema

All error responses follow this structure:

```json
{
  "detail": "Human-readable error message",
  "error_code": "MACHINE_READABLE_CODE",
  "field_errors": [
    {
      "field": "field_name",
      "message": "Specific error for this field"
    }
  ]
}
```

**Error Codes**:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400, 422 | Request data failed validation |
| `NOT_FOUND` | 404 | Resource not found or access denied |
| `SERVER_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Database or external service unavailable |

---

## OpenAPI Schema (YAML)

```yaml
openapi: 3.1.0
info:
  title: Task API
  version: "2.0.0"
  description: CRUD API for Task items with path-based user context

servers:
  - url: http://localhost:8000
    description: Local development

paths:
  /api/{user_id}/tasks:
    parameters:
      - $ref: '#/components/parameters/UserId'

    get:
      summary: List all tasks for user
      operationId: listTasks
      tags: [Tasks]
      responses:
        '200':
          description: List of tasks
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskList'
        '400':
          $ref: '#/components/responses/BadRequest'

    post:
      summary: Create a new task
      operationId: createTask
      tags: [Tasks]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskCreate'
      responses:
        '201':
          description: Task created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskRead'
        '400':
          $ref: '#/components/responses/BadRequest'
        '422':
          $ref: '#/components/responses/ValidationError'

  /api/{user_id}/tasks/{id}:
    parameters:
      - $ref: '#/components/parameters/UserId'
      - $ref: '#/components/parameters/TaskId'

    get:
      summary: Retrieve a single task
      operationId: getTask
      tags: [Tasks]
      responses:
        '200':
          description: Task details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskRead'
        '404':
          $ref: '#/components/responses/NotFound'

    put:
      summary: Full update of a task
      operationId: updateTask
      tags: [Tasks]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskUpdate'
      responses:
        '200':
          description: Task updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskRead'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          $ref: '#/components/responses/ValidationError'

    delete:
      summary: Delete a task
      operationId: deleteTask
      tags: [Tasks]
      responses:
        '204':
          description: Task deleted successfully
        '404':
          $ref: '#/components/responses/NotFound'

  /api/{user_id}/tasks/{id}/complete:
    parameters:
      - $ref: '#/components/parameters/UserId'
      - $ref: '#/components/parameters/TaskId'

    patch:
      summary: Toggle task completion status
      operationId: toggleTaskComplete
      tags: [Tasks]
      responses:
        '200':
          description: Task completion toggled
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskRead'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  parameters:
    UserId:
      name: user_id
      in: path
      required: true
      schema:
        type: string
        format: uuid
      description: User ID who owns the tasks

    TaskId:
      name: id
      in: path
      required: true
      schema:
        type: string
        format: uuid
      description: Task ID

  schemas:
    TaskCreate:
      type: object
      required: [title]
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          maxLength: 2000
          nullable: true

    TaskUpdate:
      type: object
      required: [title, is_completed]
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 255
        description:
          type: string
          maxLength: 2000
          nullable: true
        is_completed:
          type: boolean

    TaskRead:
      type: object
      required: [id, title, is_completed, created_at, user_id]
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
          nullable: true
        is_completed:
          type: boolean
        created_at:
          type: string
          format: date-time
        user_id:
          type: string
          format: uuid

    TaskList:
      type: object
      required: [items, count]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/TaskRead'
        count:
          type: integer

    ErrorResponse:
      type: object
      required: [detail, error_code]
      properties:
        detail:
          type: string
        error_code:
          type: string
        field_errors:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
              message:
                type: string

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
```

---

## Request/Response Examples

### List Tasks
```bash
curl -X GET http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks
```

Response (200):
```json
{
  "items": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "is_completed": false,
      "created_at": "2026-01-24T10:30:00Z",
      "user_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ],
  "count": 1
}
```

### Create Task
```bash
curl -X POST http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

### Toggle Completion
```bash
curl -X PATCH http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7/complete
```

### Full Update
```bash
curl -X PUT http://localhost:8000/api/550e8400-e29b-41d4-a716-446655440000/tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "description": "Updated description", "is_completed": true}'
```

### Cross-User Access Attempt
```bash
curl -X GET http://localhost:8000/api/different-user-uuid/tasks/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

Response (404):
```json
{
  "detail": "Task not found",
  "error_code": "NOT_FOUND"
}
```
