# Research: Backend and Database for Phase 2

**Feature Branch**: `002-backend-database`
**Date**: 2026-01-24
**Status**: Complete (Revised v2.0)
**Revision**: Updated API design per user requirements

## Research Summary

This document captures technical decisions and research findings for implementing the FastAPI + SQLModel + Neon PostgreSQL backend stack.

---

## Decision 1: ORM Choice - SQLModel vs Raw SQL

### Decision
**Use SQLModel** as the ORM layer for all database operations.

### Rationale
1. **Type Safety**: SQLModel combines SQLAlchemy ORM with Pydantic models, providing compile-time type checking and runtime validation in a single class definition.
2. **FastAPI Integration**: SQLModel is designed by the same author as FastAPI (Sebastián Ramírez) and integrates seamlessly—models can be used directly as request/response schemas.
3. **Reduced Boilerplate**: Single model definition serves as database table, Pydantic schema, and OpenAPI documentation.
4. **Constitution Compliance**: Constitution Principle II (Persistence First) mandates SQLModel specifically.

### Alternatives Considered

| Alternative | Pros | Cons | Rejection Reason |
|------------|------|------|------------------|
| Raw SQL (psycopg) | Full control, no ORM overhead | Manual mapping, no type safety, SQL injection risk if not careful | Violates constitution mandate; increases development time |
| SQLAlchemy alone | Mature, battle-tested | Requires separate Pydantic models, more boilerplate | SQLModel provides same engine with better DX |
| Tortoise ORM | Async-first | Less FastAPI integration, smaller community | SQLModel has better ecosystem fit |

### Implementation Notes
- Use SQLModel's `Field()` for validation constraints (max_length, etc.)
- Use `table=True` parameter to define database tables
- Leverage `Relationship()` for future entity relationships

---

## Decision 2: Multi-Tenant Data Isolation Strategy

### Decision
**Enforce user_id filtering at the service layer** with every database query explicitly including a `user_id` WHERE clause.

### Rationale
1. **Explicit Over Implicit**: Every query visibly shows the user_id filter, making code reviews easier and security audits straightforward.
2. **No Magic**: Avoids ORM-level query rewriting that can be bypassed or misconfigured.
3. **Testable**: Easy to write tests that verify user_id is always present in queries.
4. **Constitution Compliance**: Principle III (Secure by Design) requires strict data isolation.

### Pattern Implementation

```python
# Service layer pattern - EVERY query includes user_id
async def get_todos(session: AsyncSession, user_id: UUID) -> list[Todo]:
    statement = select(Todo).where(Todo.user_id == user_id)
    result = await session.exec(statement)
    return result.all()

async def get_todo(session: AsyncSession, todo_id: UUID, user_id: UUID) -> Todo | None:
    statement = select(Todo).where(Todo.id == todo_id, Todo.user_id == user_id)
    result = await session.exec(statement)
    return result.first()  # Returns None if not found OR user doesn't own it
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejection Reason |
|------------|------|------|------------------|
| Row-Level Security (RLS) | Database-enforced | Complex setup, requires connection per user | Overkill for this scale; harder to debug |
| ORM query interceptor | Automatic | Can be bypassed; "magic" behavior | Prefer explicit patterns |
| Separate schemas per user | Complete isolation | Unscalable; management nightmare | Not suitable for multi-tenant SaaS |

### Security Notes
- Service functions MUST accept `user_id` as a required parameter
- Repository/DAO layer MUST NOT have methods without user_id
- Integration tests MUST verify cross-user access returns 404 (not 403, to prevent enumeration)

---

## Decision 3: Pydantic v2 for Data Validation

### Decision
**Use Pydantic v2** (bundled with SQLModel) for all request/response validation.

### Rationale
1. **Performance**: Pydantic v2 is 5-50x faster than v1 due to Rust core.
2. **SQLModel Compatibility**: SQLModel 0.0.14+ fully supports Pydantic v2.
3. **Improved Validation**: Better error messages, stricter validation modes available.
4. **FastAPI 0.100+**: Full Pydantic v2 support since FastAPI 0.100.

### Schema Strategy

```python
# Separate schemas for different operations
class TodoCreate(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)

class TodoUpdate(SQLModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    is_completed: bool | None = None

class TodoRead(SQLModel):
    id: UUID
    title: str
    description: str | None
    is_completed: bool
    created_at: datetime
    user_id: UUID
```

### Validation Rules Mapping (from FR requirements)
- FR-016: `title` is required → `min_length=1` on create
- FR-017: title max 255 chars → `max_length=255`
- FR-018: description max 2000 chars → `max_length=2000`
- FR-019: UUID format → UUID type annotation

---

## Decision 4: Database Driver Selection

### Decision
**Use psycopg (v3)** with async support for Neon PostgreSQL connections.

### Rationale
1. **Native Async**: psycopg3 has true async support, not wrapper-based.
2. **Neon Compatibility**: Officially supported by Neon for serverless PostgreSQL.
3. **Connection Pooling**: Built-in connection pool suitable for serverless.
4. **SQLModel/SQLAlchemy**: Works via `asyncpg` dialect or native psycopg async.

### Configuration

```python
# Database URL format for Neon
DATABASE_URL = "postgresql+psycopg://user:password@host/dbname?sslmode=require"

# For SQLModel async
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set True for SQL debugging
    pool_pre_ping=True,  # Verify connections before use
)
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejection Reason |
|------------|------|------|------------------|
| asyncpg | Fastest async driver | No sync fallback; raw SQL only | psycopg3 comparable speed with ORM support |
| psycopg2-binary | Battle-tested | No native async | Async preferred for FastAPI |
| aiopg | Mature async | Based on psycopg2; legacy | psycopg3 is the future |

---

## Decision 5: Database Migration Strategy

### Decision
**Use Alembic** for database schema migrations.

### Rationale
1. **Constitution Mandate**: Principle II explicitly requires Alembic for migrations.
2. **SQLAlchemy Integration**: Alembic is the de facto migration tool for SQLAlchemy/SQLModel.
3. **Version Control**: Migration files can be committed and tracked.
4. **Rollback Support**: Easy to revert schema changes.

### Migration Workflow
1. Define/modify SQLModel classes
2. Run `alembic revision --autogenerate -m "description"`
3. Review generated migration
4. Run `alembic upgrade head`

---

## Decision 6: Error Response Structure

### Decision
**Use consistent JSON error format** across all endpoints.

### Structure

```json
{
  "detail": "Human-readable error message",
  "error_code": "VALIDATION_ERROR | NOT_FOUND | SERVER_ERROR",
  "field_errors": [
    {"field": "title", "message": "Field is required"}
  ]
}
```

### HTTP Status Code Mapping
- 400 Bad Request: Validation errors (malformed input)
- 404 Not Found: Resource not found OR access denied (no enumeration)
- 422 Unprocessable Entity: Pydantic validation failures
- 500 Internal Server Error: Unexpected errors (database down, etc.)
- 503 Service Unavailable: Database connection failures

---

## Testing Strategy

### Test Types

1. **Contract Tests** (API shape verification)
   - Verify request/response schemas match OpenAPI spec
   - Test all endpoint HTTP methods and status codes
   - Location: `tests/contract/`

2. **Integration Tests** (Full request cycle)
   - Use FastAPI TestClient
   - Test with real database (test schema)
   - Verify user isolation
   - Location: `tests/integration/`

3. **Unit Tests** (Business logic)
   - Test service functions with mocked sessions
   - Test validation rules
   - Location: `tests/unit/`

### Test Database Strategy
- Use separate test database or schema
- Truncate tables between tests
- Use pytest fixtures for session management

---

## Performance Considerations

### Connection Pooling
- Neon supports connection pooling at infrastructure level
- Application should also use SQLAlchemy pool for local efficiency
- Pool size: Start with 5 connections, scale based on load

### Query Optimization
- Add index on `user_id` column for efficient filtering
- Add composite index on `(user_id, created_at)` for sorted lists
- Use `select()` with explicit columns when full model not needed

### Latency Targets (from SC-001, SC-002)
- Create: < 2 seconds
- List (up to 1000 items): < 2 seconds
- Single operations (retrieve, update, delete): < 500ms target

---

## Decision 7: API Route Design (v2.0 Revision)

### Decision
**Use path-based user context** with `/api/{user_id}/tasks` pattern instead of header-based authentication.

### Rationale
1. **RESTful Design**: User context in path is more RESTful - resources are fully addressable via URL.
2. **Explicit Ownership**: URL clearly shows the resource hierarchy (user owns tasks).
3. **Frontend Integration**: Easier to construct URLs in frontend; no custom header handling.
4. **Caching**: URLs can be cached more effectively than header-varied responses.

### Route Structure
```
/api/{user_id}/tasks          # Collection
/api/{user_id}/tasks/{id}     # Individual resource
/api/{user_id}/tasks/{id}/complete  # Action endpoint
```

### Alternatives Considered

| Alternative | Pros | Cons | Rejection Reason |
|------------|------|------|------------------|
| X-User-ID header | Cleaner URLs | Not RESTful; header magic | User preference for path-based |
| JWT claim extraction | Secure | Auth not yet implemented | Deferred to Spec-2 |
| Query parameter | Simple | Not conventional for identity | URLs become ugly |

---

## Decision 8: HTTP Methods for Updates (v2.0 Revision)

### Decision
**Use PUT for full updates** and **dedicated PATCH /complete for toggling completion**.

### Rationale
1. **PUT Semantics**: PUT replaces the entire resource - clearer semantics for updates.
2. **Single-Purpose Toggle**: Dedicated `/complete` endpoint is self-documenting.
3. **Frontend Simplicity**: Toggle completion doesn't require sending full body.

### HTTP Method Usage
| Method | Path | Purpose |
|--------|------|---------|
| PUT | `/api/{user_id}/tasks/{id}` | Full resource replacement |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle is_completed only |

### Alternatives Considered

| Alternative | Pros | Cons | Rejection Reason |
|------------|------|------|------------------|
| PATCH for partial updates | Standard REST | Requires diff semantics | PUT simpler for full updates |
| PUT with partial body | Simple | Violates PUT semantics | Confusing API contract |

---

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Sync vs Async? | Async - better for I/O bound operations |
| Which PostgreSQL driver? | psycopg3 (async) |
| How to handle user_id in requests? | **Path parameter** `/api/{user_id}/tasks` |
| Connection string format? | Environment variable: NEON_DATABASE_URL |
| Update method? | **PUT** for full updates, **PATCH** for toggle only |
| Resource name? | **tasks** (not todos) |

---

## References

- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [FastAPI + SQLModel Tutorial](https://sqlmodel.tiangolo.com/tutorial/fastapi/)
- [Neon PostgreSQL Docs](https://neon.tech/docs)
- [Pydantic v2 Migration Guide](https://docs.pydantic.dev/latest/migration/)
- [Alembic Tutorial](https://alembic.sqlalchemy.org/en/latest/tutorial.html)
