# Constitution Compliance Rules

This document describes constitution-specific validation rules.

## Phase I: In-Memory Console Todo App

### Technical Constraints

#### Language Version
- **Required**: Python 3.13+
- **Validation**: Check Python version in imports, type hints
- **Rationale**: Modern Python features, better performance

#### Dependencies
- **Allowed**: Python standard library only
- **Exceptions**: Development/testing tools (pytest, mypy, black)
- **Validation**: Parse imports, check against stdlib whitelist
- **Rationale**: Simplicity, no external dependencies to manage

**Stdlib Whitelist** (Phase I):
```python
{
    'abc', 'collections', 'dataclasses', 'datetime', 'enum',
    'functools', 'itertools', 'json', 'logging', 'math',
    'os', 'pathlib', 're', 'sys', 'typing', 'unittest',
    'uuid', 'argparse', 'io', 'subprocess'
}
```

#### No Persistence
- **Prohibited**: File I/O, databases, any form of data persistence
- **Validation**: Search for file operations (open, read, write, Path.write_text)
- **Rationale**: Phase I is in-memory only; persistence comes in Phase II

**Prohibited Patterns**:
- `open()`, `with open`
- `.read()`, `.write()` on files
- `Path().write_text()`, `Path().read_text()`
- Database imports: `sqlite3`, `pymongo`, `psycopg`, `mysql`
- Database queries: `CREATE TABLE`, `INSERT INTO`, `SELECT FROM`

#### No Network/APIs
- **Prohibited**: HTTP servers, API frameworks, network operations
- **Validation**: Check for web framework imports and patterns
- **Rationale**: Phase I is console-only; APIs come in Phase II

**Prohibited Patterns**:
- `import flask`, `import fastapi`, `import requests`, `import urllib`, `import httpx`
- `@app.route`, `@app.get`, `@app.post`
- `socket.` operations

#### Data Model
- **Required**: Python dataclasses for models
- **Validation**: Check for `@dataclass` decorator on model classes
- **Rationale**: Clean, type-safe data structures; easy SQLModel migration in Phase II

### Design Constraints

#### Separation of Concerns
- **Required**: Distinct modules for models, business logic, UI
- **Validation**: Check module organization and imports
- **Rationale**: Maintainability, testability, clear responsibilities

**Expected Structure**:
```
models.py      - Dataclass definitions
logic.py       - Business logic, operations
ui.py          - Console I/O, user interaction
main.py        - Entry point
```

#### Deterministic Behavior
- **Required**: Predictable outputs for same inputs
- **Validation**: Manual review (not automated)
- **Exceptions**: UUID generation, timestamps where required

#### Evolution Readiness
- **Required**: Design decisions must not block Phase II/III
- **Validation**: Manual architectural review
- **Phase II prep**: Models compatible with SQLModel
- **Phase III prep**: Logic separable for AI agent control

### Quality Standards

#### No Dead Code
- **Required**: Delete unused code immediately
- **Validation**: Static analysis, coverage reports
- **Rationale**: Clarity, reduced maintenance burden

#### No Speculative Abstractions
- **Required**: Implement only what spec requires
- **Validation**: Code review against spec
- **Rationale**: YAGNI, avoid over-engineering

#### Clean, Modular Code
- **Required**: Clear naming, single responsibility, testable units
- **Validation**: Code review, automated linting
- **Rationale**: Maintainability, quality bar

## Phase II Preview: FastAPI + SQLModel (Future)

### Future Allowances
- External dependencies: FastAPI, SQLModel, Pydantic
- Persistence: PostgreSQL, SQLite
- Network: REST APIs, HTTP endpoints
- Authentication: OAuth2, JWT

### Migration Considerations
- Dataclasses → SQLModel models (minimal changes)
- Console I/O → API endpoints
- In-memory storage → database operations

## Phase III Preview: AI Agent Control (Future)

### Future Requirements
- LLM integration: OpenAI, Anthropic APIs
- Agent frameworks: LangChain, AutoGen, custom
- Natural language commands
- Autonomous task execution

## Validation Implementation

### Automated Checks
- Import analysis (AST parsing)
- Pattern matching (regex)
- File structure validation
- Dependency scanning

### Manual Reviews
- Architecture alignment
- Evolution readiness
- Design quality
- Business logic correctness

### Check Frequency
- **Before implementation**: Constitution review
- **During implementation**: Continuous validation
- **After implementation**: Full compliance check
- **Before merge**: Gate enforcement

## Customization

Projects can customize constitution rules by:
1. Defining project-specific constraints in `.specify/memory/constitution.md`
2. Updating validation scripts with custom patterns
3. Adjusting stdlib whitelist for project needs
4. Adding phase-specific rules

## Enforcement

Constitution violations are **blocking**:
- Implementation cannot proceed without spec
- Code violating constitution constraints must be fixed
- Quality gate fails if constitution checks fail

Warnings (scope, quality) are **advisory**:
- Manual review required
- Context-dependent decisions
- May proceed with justification
