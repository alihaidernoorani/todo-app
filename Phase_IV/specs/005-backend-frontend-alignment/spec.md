# Feature Specification: Backend-Frontend Data Model Alignment

**Feature Branch**: `005-backend-frontend-alignment`
**Created**: 2026-02-05
**Status**: Draft
**Input**: User description: "Update the specification to align the Backend API models with the Frontend requirements. Specifically, define the User and Task models to ensure field names match the JSON sent by the frontend (e.g., email vs username). Document that the API must support Better Auth session handling and explicit CORS origins for my Vercel deployments."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seamless Frontend-Backend Communication (Priority: P1)

As a frontend developer, I want the backend API to accept and return data in the exact format my frontend sends, so that I can work without transformation layers or field mapping logic.

**Why this priority**: This is foundational - without aligned data models, no frontend-backend integration works. Every API call will fail due to field name mismatches, breaking the entire application.

**Independent Test**: Can be fully tested by sending frontend-formatted JSON (e.g., with `email`, `title`, `priority`) to backend endpoints and verifying responses use identical field names without transformation.

**Acceptance Scenarios**:

1. **Given** a frontend Task object with fields `{title, description, priority, is_completed}`, **When** the frontend POSTs this to `/api/{user_id}/tasks`, **Then** the backend accepts it without requiring field transformations and returns a TaskRead object with matching field names.

2. **Given** the frontend sends user authentication data with an `email` field, **When** Better Auth processes the signup/login request, **Then** the backend stores and returns user data with `email` (not `username`) matching the frontend contract.

3. **Given** the frontend expects task responses to include `user_id`, `created_at`, and `id` as strings/ISO timestamps, **When** the backend returns task data, **Then** all date/UUID fields are serialized in the frontend-expected format (ISO 8601 strings, UUID strings).

---

### User Story 2 - Better Auth Integration with JWT (Priority: P1)

As a developer deploying to production, I want the backend to validate Better Auth JWT tokens and extract the authenticated user's ID, so that all API requests are properly authenticated and user-scoped.

**Why this priority**: Without authentication working, the entire security model fails. This must work before any user data can be safely stored or retrieved.

**Independent Test**: Can be tested by generating a JWT token from Better Auth, sending it in the `Authorization: Bearer <token>` header to protected endpoints, and verifying the backend extracts the correct `user_id` from the token's `sub` claim.

**Acceptance Scenarios**:

1. **Given** a valid JWT token issued by Better Auth with `sub` claim containing user ID, **When** the frontend sends this token in the Authorization header to `/api/{user_id}/tasks`, **Then** the backend validates the token, extracts `user_id` from `sub`, and authorizes access.

2. **Given** an expired JWT token, **When** the frontend attempts to access a protected endpoint, **Then** the backend returns 401 Unauthorized with error message "Token expired".

3. **Given** a JWT token where the `sub` claim doesn't match the `user_id` in the URL path, **When** the frontend attempts to access `/api/{user_id}/tasks`, **Then** the backend returns 403 Forbidden preventing cross-user access.

4. **Given** no Authorization header is provided, **When** the frontend attempts to access a protected endpoint, **Then** the backend returns 401 Unauthorized with error message "Authorization header required".

---

### User Story 3 - Production CORS Configuration (Priority: P1)

As a developer deploying to Vercel, I want the backend to accept requests from my specific Vercel deployment URLs, so that browser CORS policies don't block my API calls in production.

**Why this priority**: Without correct CORS configuration, all frontend API calls will fail in production due to browser security policies, making the application unusable.

**Independent Test**: Can be tested by deploying the frontend to a Vercel URL, making API calls from the browser, and verifying the backend includes correct CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`) in responses.

**Acceptance Scenarios**:

1. **Given** the frontend is deployed at `https://my-app.vercel.app`, **When** the browser makes a preflight OPTIONS request to the backend, **Then** the backend responds with `Access-Control-Allow-Origin: https://my-app.vercel.app` and `Access-Control-Allow-Credentials: true`.

2. **Given** a Vercel preview deployment at `https://my-app-git-feature-username.vercel.app`, **When** the browser makes API calls from this origin, **Then** the backend allows the request using the wildcard pattern `https://*.vercel.app`.

3. **Given** the frontend sends credentials (cookies or Authorization headers) with API requests, **When** the backend responds, **Then** it includes `Access-Control-Allow-Credentials: true` to permit credential-based requests.

4. **Given** an unauthorized origin (not in the allowlist) attempts to call the API, **When** the backend receives the request, **Then** it rejects the request and the browser blocks it due to missing CORS headers.

---

### User Story 4 - User Model Consistency (Priority: P2)

As a system integrator, I want the User model in both Better Auth (frontend) and the backend Task API to use consistent field names, so that user data flows seamlessly between authentication and task management.

**Why this priority**: While authentication is P1, ensuring the User model schema consistency is P2 because the basic auth flow can work even with minor field name inconsistencies as long as the `user_id` is correctly extracted.

**Independent Test**: Can be tested by signing up a user through Better Auth, then inspecting the JWT token payload and database records to verify field names (email, id, name) match the documented User model specification.

**Acceptance Scenarios**:

1. **Given** a user signs up with email `test@example.com`, **When** the user data is stored in the Better Auth database, **Then** the record includes fields `id` (UUID), `email`, `name`, and `createdAt` (timestamp).

2. **Given** a JWT token is issued for an authenticated user, **When** the token is decoded, **Then** the `sub` claim contains the user's `id` (UUID string), and optional `email` and `name` claims are present.

3. **Given** the backend Task API receives a user_id from the JWT, **When** storing tasks, **Then** the Task model's `user_id` field references the same UUID used in the Better Auth `user.id` field.

---

### Edge Cases

- What happens when the frontend sends a field the backend doesn't recognize (e.g., a new optional field added in frontend only)?
  - **Expected**: Backend ignores unknown fields (Pydantic's default behavior) and processes the request with known fields only.

- How does the system handle date/time timezone mismatches between frontend (browser local time) and backend (UTC)?
  - **Expected**: Backend always stores and returns timestamps in UTC with ISO 8601 format. Frontend is responsible for displaying in user's local timezone.

- What happens when CORS preflight OPTIONS requests fail due to incorrect configuration?
  - **Expected**: Browser blocks the actual API request before it's sent. Backend logs should show OPTIONS requests and their responses for debugging.

- How does the system handle UUID vs string type mismatches in Task.id?
  - **Expected**: Backend stores UUIDs internally but serializes them as strings in JSON responses. Frontend treats all IDs as strings.

## Requirements *(mandatory)*

### Functional Requirements

#### Backend API Models

- **FR-001**: The Task model in the backend MUST use field names `id`, `title`, `description`, `is_completed`, `priority`, `created_at`, and `user_id` to exactly match the frontend TypeScript interface `TaskRead`.

- **FR-002**: The TaskCreate schema MUST accept fields `title`, `description`, and `priority` with validation rules: title (1-255 chars, required), description (max 2000 chars, optional), priority (enum: "High"|"Medium"|"Low", default "Medium").

- **FR-003**: The TaskUpdate schema MUST require all fields `title`, `description`, `is_completed`, and `priority` (PUT semantics for full replacement).

- **FR-004**: All Task response schemas (TaskRead, TaskList) MUST serialize UUIDs as strings and datetime objects as ISO 8601 strings (e.g., "2026-02-05T14:30:00Z").

#### User Model and Better Auth Integration

- **FR-005**: The User model in Better Auth MUST include fields: `id` (UUID, primary key), `email` (string, unique), `name` (string, optional), `emailVerified` (boolean), `createdAt` (timestamp), and `updatedAt` (timestamp).

- **FR-006**: The backend authentication layer MUST extract the user ID from the JWT token's `sub` claim (not from a custom `user_id` claim).

- **FR-007**: The backend MUST validate JWT tokens using RS256 algorithm with public keys fetched from the Better Auth JWKS endpoint (`/.well-known/jwks.json`).

- **FR-008**: The backend MUST reject requests with expired, invalid, or missing JWT tokens with appropriate HTTP status codes (401 for auth failures, 403 for authorization failures).

#### CORS Configuration

- **FR-009**: The backend CORS middleware MUST explicitly allow origins:
  - `http://localhost:3000` (local development)
  - The production Vercel URL (e.g., `https://my-todo-app.vercel.app`)
  - Vercel preview deployment pattern `https://*.vercel.app` (wildcard for git branch deployments)

- **FR-010**: The backend MUST set `Access-Control-Allow-Credentials: true` to permit cookies and Authorization headers in cross-origin requests.

- **FR-011**: The backend MUST allow HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`.

- **FR-012**: The backend MUST allow request headers: `Content-Type`, `Authorization`, `If-Match`, `If-None-Match`, `ETag`.

- **FR-013**: The backend MUST expose response headers: `ETag`, `Last-Modified` for optimistic concurrency control.

- **FR-014**: The backend MUST set `max_age=600` for CORS preflight caching (10 minutes) to reduce OPTIONS request overhead.

#### Data Consistency and Validation

- **FR-015**: All backend Pydantic schemas MUST use `extra="ignore"` (default) to silently ignore unexpected fields from the frontend rather than rejecting requests.

- **FR-016**: The backend MUST validate that `priority` values are strictly one of `"High"`, `"Medium"`, or `"Low"` (case-sensitive) and reject other values with 422 Unprocessable Entity.

- **FR-017**: The backend MUST ensure `user_id` fields in Task records reference valid UUIDs from the Better Auth user table.

### Key Entities

#### User (Better Auth Managed)

- **Purpose**: Represents an authenticated user account stored in the Better Auth database.
- **Key Attributes**:
  - `id`: UUID, unique identifier (used as `user_id` in Task records)
  - `email`: String, unique, user's login email
  - `name`: String, optional display name
  - `emailVerified`: Boolean, whether email is verified
  - `createdAt`, `updatedAt`: Timestamps for audit trail
- **Relationships**: One user can own many tasks (one-to-many via `user_id` foreign key).

#### Task (Backend Managed)

- **Purpose**: Represents a todo task item owned by a specific user.
- **Key Attributes**:
  - `id`: UUID, unique task identifier
  - `title`: String, task name (1-255 chars)
  - `description`: String or null, detailed description (max 2000 chars)
  - `is_completed`: Boolean, completion status
  - `priority`: Enum ("High", "Medium", "Low"), task priority
  - `created_at`: Timestamp (UTC), when task was created
  - `user_id`: UUID (foreign key), references User.id
- **Relationships**: Many tasks belong to one user (many-to-one via `user_id`).

#### JWT Token (Better Auth Issued)

- **Purpose**: Stateless authentication token issued by Better Auth for API access.
- **Key Claims**:
  - `sub`: User ID (UUID string) - standard OIDC subject claim
  - `iss`: Issuer URL (Better Auth base URL)
  - `aud`: Audience URL (backend API URL)
  - `exp`: Expiration timestamp (1 hour default)
  - `iat`: Issued at timestamp
- **Relationships**: Issued for one user, validated by backend to authorize API requests.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Frontend developers can call backend API endpoints without writing field transformation logic (zero transformation layers required).

- **SC-002**: All API requests with valid Better Auth JWT tokens are successfully authenticated and authorized with 100% success rate (excluding intentionally invalid tokens).

- **SC-003**: Production API calls from Vercel-deployed frontend complete without CORS errors in 100% of cases (measured via browser console and backend logs).

- **SC-004**: 95% of integration issues related to field name mismatches are eliminated (measured by reduction in bug reports and developer support requests).

- **SC-005**: Backend API response times remain under 200ms for 95th percentile requests (CORS preflight caching should not degrade performance).

- **SC-006**: Zero data corruption incidents due to UUID/string serialization issues (all IDs are consistently handled as strings in JSON).

- **SC-007**: Developer onboarding time for frontend-backend integration reduces by 50% (measured by time from setup to first successful API call).

## Out of Scope

- Implementing new authentication methods (OAuth, magic links) beyond email/password - this focuses only on aligning existing Better Auth JWT handling.

- Database schema migrations for existing user/task data - this is specification documentation, not a data migration project.

- Frontend TypeScript type generation from backend schemas - while beneficial, this is a developer tooling enhancement for a future iteration.

- Performance optimization of JWT validation (caching JWKS responses) - current implementation is sufficient for initial production loads.

- Implementing field-level access control or data masking - all fields in Task/User models are either fully accessible or fully restricted based on user_id scoping.

## Assumptions

- Better Auth is already configured to issue RS256-signed JWT tokens with standard OIDC claims (`sub`, `iss`, `aud`, `exp`).

- The frontend uses the `better-auth` client library and sends JWT tokens in `Authorization: Bearer <token>` headers for all API requests.

- The production Vercel deployment URL is known and can be added to the CORS allowlist (e.g., via environment variable `CORS_ALLOWED_ORIGINS`).

- All timestamps are stored in UTC in the database and serialized as ISO 8601 strings in API responses (e.g., `"2026-02-05T14:30:00Z"`).

- The backend uses Pydantic/SQLModel for automatic JSON serialization of UUIDs and datetime objects to strings.

- Developers have access to Better Auth's `.well-known/jwks.json` endpoint for fetching public keys (required for RS256 JWT validation).

- The frontend and backend are deployed to separate domains/hosts, requiring CORS configuration (not served from the same origin).

## Dependencies

- **Better Auth** (frontend): Must be configured to issue JWT tokens with `sub` claim containing user ID.

- **Pydantic/SQLModel** (backend): Required for automatic validation and serialization of Task models.

- **FastAPI CORS middleware** (backend): Required for handling cross-origin requests from Vercel frontend.

- **PyJWT library** (backend): Required for decoding and validating RS256-signed JWT tokens.

- **Requests/httpx library** (backend): Required for fetching public keys from Better Auth JWKS endpoint.

## Security Considerations

- **JWT Validation**: Backend MUST validate all JWT claims (`sub`, `iss`, `aud`, `exp`) and reject tokens with invalid signatures or expired timestamps.

- **User-Scoped Authorization**: Backend MUST verify that the authenticated user (from JWT `sub`) matches the `user_id` in the URL path to prevent cross-user data access.

- **CORS Restrictions**: Backend MUST use explicit origin allowlists (no `allow_origins=["*"]` wildcard) to prevent unauthorized cross-origin requests.

- **Credential Handling**: Backend MUST set `Access-Control-Allow-Credentials: true` only for trusted origins to prevent credential leakage to malicious sites.

- **HTTPS in Production**: CORS configuration assumes HTTPS for production (Vercel URLs use HTTPS by default). HTTP origins should only be allowed in local development.

- **Token Expiration**: JWT tokens should have short expiration times (1 hour default) to limit the impact of token theft. Frontend should handle token refresh flows.
