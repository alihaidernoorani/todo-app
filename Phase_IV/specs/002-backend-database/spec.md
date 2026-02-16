# Feature Specification: Backend and Database for Phase 2

**Feature Branch**: `002-backend-database`
**Created**: 2026-01-22
**Status**: Draft
**Input**: User description: "Backend and Database Specification for Phase 2 - Neon Serverless PostgreSQL schema design using SQLModel ORM"

## Clarifications

### Session 2026-02-06

- Q: Should the backend URL be defined as a server-only variable (e.g., BACKEND_URL) instead of NEXT_PUBLIC_BACKEND_URL? → A: Use BACKEND_URL (server-only variable) - Server actions can only access server environment variables; prevents runtime errors
- Q: Should all server actions use process.env.BACKEND_URL for API calls? → A: Yes, all server actions use process.env.BACKEND_URL - Ensures consistency and single source of truth for backend URL
- Q: Should the server action read the token from cookies instead of localStorage? → A: Yes, read token from cookies - Server actions can access cookies via next/headers; localStorage is client-only
- Q: Should server actions return structured errors instead of throwing generic exceptions? → A: Yes, return structured errors - Enables specific error handling, better UX, and type-safe error responses
- Q: Should the spec require matching environment variables across local and production deployments? → A: Yes, require matching variables - Ensures consistency across environments; reduces deployment errors and confusion

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a New Todo Item (Priority: P1)

As a user, I want to create a new todo item so that I can track tasks I need to complete.

**Why this priority**: Creating todos is the foundational operation that enables all other functionality. Without the ability to create items, the application has no value.

**Independent Test**: Can be fully tested by sending a create request with valid data and verifying the item is persisted and returned with a unique identifier.

**Acceptance Scenarios**:

1. **Given** a valid user_id and todo data (title, optional description), **When** the user creates a todo, **Then** the system persists the item and returns it with a unique ID, creation timestamp, and is_completed set to false.

2. **Given** a user_id and todo data with an empty title, **When** the user attempts to create a todo, **Then** the system rejects the request with a validation error indicating title is required.

3. **Given** a user_id and todo data with a title exceeding 255 characters, **When** the user attempts to create a todo, **Then** the system rejects the request with a validation error indicating title exceeds maximum length.

---

### User Story 2 - List All Todo Items (Priority: P1)

As a user, I want to see all my todo items so that I can review what tasks I need to complete.

**Why this priority**: Viewing todos is essential for users to interact with their data. Without listing, users cannot see what they have created.

**Independent Test**: Can be tested by creating several todos for a user and verifying only that user's items are returned in the list.

**Acceptance Scenarios**:

1. **Given** a user with multiple existing todo items, **When** the user requests their todo list, **Then** the system returns all and only the items belonging to that user.

2. **Given** a user with no todo items, **When** the user requests their todo list, **Then** the system returns an empty list (not an error).

3. **Given** multiple users with different todo items, **When** user A requests their todo list, **Then** the system returns only user A's items and never user B's items.

---

### User Story 3 - Retrieve a Single Todo Item (Priority: P2)

As a user, I want to retrieve a specific todo item by its ID so that I can see its full details.

**Why this priority**: While listing shows all items, retrieving a single item is necessary for viewing complete details and is a prerequisite for update/delete operations.

**Independent Test**: Can be tested by creating a todo, then retrieving it by ID and verifying all fields match.

**Acceptance Scenarios**:

1. **Given** a user owns a todo item with a specific ID, **When** the user retrieves that item by ID, **Then** the system returns the complete item details.

2. **Given** a user requests a todo ID that does not exist, **When** the user attempts to retrieve it, **Then** the system returns a not-found error.

3. **Given** user A owns a todo item, **When** user B attempts to retrieve that item by ID, **Then** the system returns a not-found error (data isolation enforced).

---

### User Story 4 - Update a Todo Item (Priority: P2)

As a user, I want to update my todo items so that I can change the title, description, or mark them as completed.

**Why this priority**: Updating is essential for tracking progress (marking complete) and correcting mistakes. It depends on create and retrieve functioning first.

**Independent Test**: Can be tested by creating a todo, updating its fields, then retrieving it and verifying changes persisted.

**Acceptance Scenarios**:

1. **Given** a user owns an existing todo item, **When** the user updates the title, **Then** the system persists the change and returns the updated item.

2. **Given** a user owns an existing todo item, **When** the user marks it as completed, **Then** the is_completed field changes to true and persists.

3. **Given** a user owns an existing todo item, **When** the user updates with an empty title, **Then** the system rejects the request with a validation error.

4. **Given** user A owns a todo item, **When** user B attempts to update that item, **Then** the system returns a not-found error (data isolation enforced).

---

### User Story 5 - Delete a Todo Item (Priority: P3)

As a user, I want to delete todo items I no longer need so that my list stays manageable.

**Why this priority**: Deletion is important for list management but is less critical than creating, viewing, and updating items.

**Independent Test**: Can be tested by creating a todo, deleting it, then attempting to retrieve it and confirming it no longer exists.

**Acceptance Scenarios**:

1. **Given** a user owns an existing todo item, **When** the user deletes that item, **Then** the system removes it permanently and returns a success confirmation.

2. **Given** a user attempts to delete a todo ID that does not exist, **When** the delete request is made, **Then** the system returns a not-found error.

3. **Given** user A owns a todo item, **When** user B attempts to delete that item, **Then** the system returns a not-found error (data isolation enforced).

---

### Edge Cases

- What happens when the database connection is unavailable? System returns a service unavailable error with appropriate messaging.
- What happens when a user_id is not provided in a request? System returns a bad request error indicating user context is required.
- What happens when the todo ID format is invalid (not a valid UUID)? System returns a validation error indicating invalid ID format.
- What happens when description is null vs empty string? Both are valid; null means no description provided, empty string means explicitly cleared.
- What happens with concurrent updates to the same todo? Last write wins; no optimistic locking required for this phase.
- What happens when a server action fails to connect to the backend API? Server action returns structured error object with error code `BACKEND_UNAVAILABLE` and user-friendly message instead of throwing an exception.
- What happens when the authentication token is missing or invalid in a server action? Server action returns structured error object with error code `AUTH_FAILED` and clear guidance for the user to re-authenticate.

## Requirements *(mandatory)*

### Functional Requirements

**Data Model**

- **FR-001**: System MUST store todo items with the following attributes: unique identifier (UUID), title (required, max 255 characters), description (optional, max 2000 characters), completion status (boolean, default false), creation timestamp (auto-generated), and user reference (required).

- **FR-002**: System MUST generate a unique UUID for each todo item upon creation.

- **FR-003**: System MUST automatically record the creation timestamp when a todo item is created.

- **FR-004**: System MUST default the completion status to false (incomplete) for new items.

**Database Connection**

- **FR-005**: System MUST connect to the database using a connection string provided via environment configuration.

- **FR-006**: System MUST handle database connection failures gracefully with appropriate error responses.

- **FR-007**: System MUST use connection pooling for efficient database resource management.

**Environment Configuration**

- **FR-022**: All Next.js server actions MUST use `process.env.BACKEND_URL` for backend API calls to ensure consistency and a single source of truth. Server actions MUST NOT use `NEXT_PUBLIC_*` variables which are exposed in client bundles.

- **FR-023**: System MUST fail to start or return clear error messages if required environment variables (`BACKEND_URL`, database connection string) are missing or invalid.

- **FR-028**: Environment variable names MUST remain consistent across all deployment environments (local, staging, production) to prevent configuration errors and simplify deployment processes.

**Authentication in Server Actions**

- **FR-024**: Server actions MUST read authentication tokens from cookies using `cookies()` from `next/headers`, not from client-side localStorage which is inaccessible in server contexts.

- **FR-025**: Server actions MUST include the authentication token in the `Authorization: Bearer <token>` header when making API requests to the backend.

**API Operations**

- **FR-008**: System MUST provide an operation to create a new todo item that accepts title (required), description (optional), and user context.

- **FR-009**: System MUST provide an operation to list all todo items for a specific user.

- **FR-010**: System MUST provide an operation to retrieve a single todo item by its ID for a specific user.

- **FR-011**: System MUST provide an operation to update an existing todo item's title, description, or completion status for a specific user.

- **FR-012**: System MUST provide an operation to permanently delete a todo item by its ID for a specific user.

**Data Isolation**

- **FR-013**: System MUST filter all database queries by user_id to ensure strict data isolation between users.

- **FR-014**: System MUST return a not-found response when a user attempts to access, update, or delete a todo belonging to another user (no information leakage).

- **FR-015**: System MUST reject any request that does not include user context.

**Validation**

- **FR-016**: System MUST validate that title is provided and non-empty for create and update operations.

- **FR-017**: System MUST validate that title does not exceed 255 characters.

- **FR-018**: System MUST validate that description does not exceed 2000 characters when provided.

- **FR-019**: System MUST validate that todo ID is a valid UUID format.

**Error Handling**

- **FR-020**: System MUST return consistent error responses with appropriate status indicators and human-readable messages.

- **FR-021**: System MUST distinguish between validation errors (bad request), not-found errors, and server errors in responses.

- **FR-026**: Server actions MUST return structured error objects (e.g., `{ success: false, error: { code: string, message: string } }`) instead of throwing generic exceptions, enabling type-safe error handling in the frontend.

- **FR-027**: Server action error responses MUST include an error code (for programmatic handling) and a user-friendly error message (for display).

### Key Entities

- **Todo**: Represents a task item owned by a user. Contains a unique identifier, title, optional description, completion status, creation timestamp, and reference to the owning user. The todo is the primary data entity for this feature.

- **User Reference**: Represents the association between a todo item and its owner. Stored as a user_id field on each todo. The actual User entity is defined in a separate authentication specification; this spec only requires the user_id foreign key for data isolation.

## Assumptions

- User authentication and user management are handled by a separate specification (Spec-2). This spec assumes a valid user_id is provided for all operations.
- The user_id format is UUID, matching the authentication system's user identifier format.
- Next.js server actions execute on the server and can only access server-side environment variables (not `NEXT_PUBLIC_*` prefixed variables).
- The frontend uses Next.js App Router with server actions for backend API communication.
- Authentication tokens are stored in cookies (accessible via `cookies()` from `next/headers` in server actions), not in client-side localStorage.
- Soft deletes are not required; deletion is permanent (per explicit constraint).
- Full-text search and complex filtering are not required (per explicit constraint).
- Pagination for list operations is not required for initial implementation; list returns all items for the user.
- No audit trail or change history is required beyond the creation timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new todo item and receive confirmation within 2 seconds under normal conditions.

- **SC-002**: Users can retrieve their complete todo list within 2 seconds for lists up to 1000 items.

- **SC-003**: Users can update any todo item attribute and see the change reflected immediately upon next retrieval.

- **SC-004**: Users can delete a todo item and confirm it no longer appears in their list.

- **SC-005**: 100% of database queries enforce user_id filtering; no cross-user data leakage is possible.

- **SC-006**: All validation errors return clear, actionable messages that help users correct their input.

- **SC-007**: System handles database unavailability gracefully with informative error messages rather than exposing internal errors.

## Out of Scope

- User registration and authentication (handled in Auth/Frontend specifications)
- Soft-delete functionality
- Complex search indexing or full-text search
- Pagination for list operations
- Todo item categories, tags, or labels
- Due dates or reminders
- Todo item ordering or prioritization
- Sharing todos between users
- Frontend implementation
