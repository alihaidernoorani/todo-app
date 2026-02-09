# API Contract: Todo CRUD Endpoints

**Feature Branch**: `002-backend-database`
**Date**: 2026-01-22
**API Version**: v1
**Base Path**: `/api/v1`

## Overview

This document defines the REST API contract for Todo CRUD operations. All endpoints require user context via the `X-User-ID` header (temporary; will be replaced by JWT auth in a future spec).

## Authentication (Temporary)

Until the authentication feature is implemented, user context is provided via header:

```
X-User-ID: <uuid>
```

**Note**: This is a placeholder. Production will use JWT tokens with Better Auth.

---

## Endpoints Summary

| Method | Path | Description | FR Reference |
|--------|------|-------------|--------------|
| POST | `/api/v1/todos` | Create a new todo | FR-008 |
| GET | `/api/v1/todos` | List all todos for user | FR-009 |
| GET | `/api/v1/todos/{todo_id}` | Retrieve a single todo | FR-010 |
| PATCH | `/api/v1/todos/{todo_id}` | Update a todo | FR-011 |
| DELETE | `/api/v1/todos/{todo_id}` | Delete a todo | FR-012 |

---

## Endpoint: Create Todo

### Request

```
POST /api/v1/todos
Content-Type: application/json
X-User-ID: <uuid>
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
  "created_at": "2026-01-22T10:30:00Z",
  "user_id": "uuid"
}
```

**400 Bad Request** (missing X-User-ID):
```json
{
  "detail": "User context required",
  "error_code": "MISSING_USER_CONTEXT"
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

## Endpoint: List Todos

### Request

```
GET /api/v1/todos
X-User-ID: <uuid>
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
      "created_at": "2026-01-22T10:30:00Z",
      "user_id": "uuid"
    }
  ],
  "count": 1
}
```

**Note**: Returns empty list `{"items": [], "count": 0}` if user has no todos.

**400 Bad Request** (missing X-User-ID):
```json
{
  "detail": "User context required",
  "error_code": "MISSING_USER_CONTEXT"
}
```

---

## Endpoint: Retrieve Todo

### Request

```
GET /api/v1/todos/{todo_id}
X-User-ID: <uuid>
```

**Path Parameters**:
- `todo_id`: UUID of the todo to retrieve

### Response

**200 OK**:
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "is_completed": false,
  "created_at": "2026-01-22T10:30:00Z",
  "user_id": "uuid"
}
```

**400 Bad Request** (invalid UUID format):
```json
{
  "detail": "Invalid todo ID format",
  "error_code": "VALIDATION_ERROR"
}
```

**404 Not Found** (todo doesn't exist OR user doesn't own it):
```json
{
  "detail": "Todo not found",
  "error_code": "NOT_FOUND"
}
```

**Note**: Returns 404 for both "not exists" and "not owned" to prevent enumeration attacks.

---

## Endpoint: Update Todo

### Request

```
PATCH /api/v1/todos/{todo_id}
Content-Type: application/json
X-User-ID: <uuid>
```

**Path Parameters**:
- `todo_id`: UUID of the todo to update

**Request Body** (all fields optional):
```json
{
  "title": "string (optional, 1-255 chars)",
  "description": "string (optional, max 2000 chars)",
  "is_completed": "boolean (optional)"
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
  "created_at": "2026-01-22T10:30:00Z",
  "user_id": "uuid"
}
```

**404 Not Found**:
```json
{
  "detail": "Todo not found",
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

## Endpoint: Delete Todo

### Request

```
DELETE /api/v1/todos/{todo_id}
X-User-ID: <uuid>
```

**Path Parameters**:
- `todo_id`: UUID of the todo to delete

### Response

**204 No Content**: Successfully deleted (no response body)

**404 Not Found**:
```json
{
  "detail": "Todo not found",
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
| `MISSING_USER_CONTEXT` | 400 | X-User-ID header not provided |
| `NOT_FOUND` | 404 | Resource not found or access denied |
| `SERVER_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Database or external service unavailable |

---

## OpenAPI Schema (YAML)

```yaml
openapi: 3.1.0
info:
  title: Todo API
  version: "1.0.0"
  description: CRUD API for Todo items with user-scoped data isolation

servers:
  - url: http://localhost:8000
    description: Local development

paths:
  /api/v1/todos:
    post:
      summary: Create a new todo
      operationId: createTodo
      tags: [Todos]
      parameters:
        - $ref: '#/components/parameters/UserIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoCreate'
      responses:
        '201':
          description: Todo created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodoRead'
        '400':
          $ref: '#/components/responses/BadRequest'
        '422':
          $ref: '#/components/responses/ValidationError'

    get:
      summary: List all todos for user
      operationId: listTodos
      tags: [Todos]
      parameters:
        - $ref: '#/components/parameters/UserIdHeader'
      responses:
        '200':
          description: List of todos
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodoList'
        '400':
          $ref: '#/components/responses/BadRequest'

  /api/v1/todos/{todo_id}:
    parameters:
      - name: todo_id
        in: path
        required: true
        schema:
          type: string
          format: uuid

    get:
      summary: Retrieve a single todo
      operationId: getTodo
      tags: [Todos]
      parameters:
        - $ref: '#/components/parameters/UserIdHeader'
      responses:
        '200':
          description: Todo details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodoRead'
        '404':
          $ref: '#/components/responses/NotFound'

    patch:
      summary: Update a todo
      operationId: updateTodo
      tags: [Todos]
      parameters:
        - $ref: '#/components/parameters/UserIdHeader'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TodoUpdate'
      responses:
        '200':
          description: Todo updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TodoRead'
        '404':
          $ref: '#/components/responses/NotFound'
        '422':
          $ref: '#/components/responses/ValidationError'

    delete:
      summary: Delete a todo
      operationId: deleteTodo
      tags: [Todos]
      parameters:
        - $ref: '#/components/parameters/UserIdHeader'
      responses:
        '204':
          description: Todo deleted successfully
        '404':
          $ref: '#/components/responses/NotFound'

components:
  parameters:
    UserIdHeader:
      name: X-User-ID
      in: header
      required: true
      schema:
        type: string
        format: uuid
      description: User ID for request context (temporary until auth implemented)

  schemas:
    TodoCreate:
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

    TodoUpdate:
      type: object
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

    TodoRead:
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

    TodoList:
      type: object
      required: [items, count]
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/TodoRead'
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

### Create Todo - Success
```bash
curl -X POST http://localhost:8000/api/v1/todos \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"title": "Buy groceries", "description": "Milk, eggs, bread"}'
```

Response (201):
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "is_completed": false,
  "created_at": "2026-01-22T10:30:00Z",
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Update Todo - Mark Complete
```bash
curl -X PATCH http://localhost:8000/api/v1/todos/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "Content-Type: application/json" \
  -H "X-User-ID: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"is_completed": true}'
```

### Cross-User Access Attempt
```bash
curl -X GET http://localhost:8000/api/v1/todos/7c9e6679-7425-40de-944b-e07fc1f90ae7 \
  -H "X-User-ID: different-user-uuid"
```

Response (404):
```json
{
  "detail": "Todo not found",
  "error_code": "NOT_FOUND"
}
```
